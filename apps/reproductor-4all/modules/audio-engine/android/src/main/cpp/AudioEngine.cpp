#include "AudioEngine.h"
#include <android/log.h>
#include <cmath>
#include <cstring>
#include <algorithm>

#define TAG "AudioEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

AudioEngine& AudioEngine::getInstance() {
    static AudioEngine instance;
    return instance;
}

AudioEngine::AudioEngine()
    : mRingBuffer(384000),
      mDecoder(std::make_unique<AMediaDecoder>(mRingBuffer)) {
    for (auto& s : mSpectrum) s.store(0.0f);
    for (auto& w : mWaveform) w.store(0.0f);
    initOboeStream();
}

AudioEngine::~AudioEngine() {
    stop();
    closeOboeStream();
}

bool AudioEngine::initOboeStream() {
    oboe::AudioStreamBuilder builder;
    // PowerSaving is Google Oboe's recommended mode for music playback:
    // larger hardware buffer -> zero stutter during Camera/Maps/Android Auto + lower battery drain.
    builder.setDirection(oboe::Direction::Output)
           ->setPerformanceMode(oboe::PerformanceMode::PowerSaving)
           ->setSharingMode(oboe::SharingMode::Shared)
           ->setUsage(oboe::Usage::Media)
           ->setContentType(oboe::ContentType::Music)
           ->setFormat(oboe::AudioFormat::Float)
           ->setChannelCount(oboe::ChannelCount::Stereo)
           ->setSampleRate(mSampleRate)
           ->setDataCallback(this)
           ->setErrorCallback(this);

    oboe::Result result = builder.openStream(mStream);
    if (result != oboe::Result::OK) {
        LOGE("Oboe PowerSaving falló (%s), reintentando modo estándar...", oboe::convertToText(result));
        builder.setPerformanceMode(oboe::PerformanceMode::None)
               ->setSampleRate(0);
        result = builder.openStream(mStream);
        if (result != oboe::Result::OK) {
            LOGE("Error crítico abriendo flujo Google Oboe: %s", oboe::convertToText(result));
            mStream.reset();
            return false;
        }
    }

    mSampleRate = mStream->getSampleRate();
    mParametricEQ.setSampleRate(static_cast<float>(mSampleRate));
    LOGI("Flujo Oboe iniciado: SampleRate=%d, FramesPerBurst=%d", mSampleRate, mStream->getFramesPerBurst());
    return true;
}

void AudioEngine::closeOboeStream() {
    if (mStream) {
        mStream->stop();
        mStream->close();
        mStream.reset();
    }
}

bool AudioEngine::openFile(const std::string& filePath) {
    std::lock_guard<std::mutex> lock(mEngineMutex);
    mIsPlaying.store(false);
    mParametricEQ.resetState();
    mEnvRms = 0.2f;
    mNormGain = 1.0f;
    bool ok = mDecoder->open(filePath);
    if (ok) {
        int32_t fileSampleRate = mDecoder->getSampleRate();
        if (fileSampleRate > 0 && fileSampleRate != mSampleRate) {
            mSampleRate = fileSampleRate;
            closeOboeStream();
            initOboeStream();
        } else if (!mStream) {
            initOboeStream();
        }
        int fadeSec = mMixerFadeSeconds.load();
        if (fadeSec > 0) {
            mFadeInTotalFrames = static_cast<int64_t>(mSampleRate) * fadeSec / 2;
            mFadeInFramesRemaining = mFadeInTotalFrames;
            mSkippingLeadingSilence = true;
            mLeadingSilenceFramesSkipped = 0;
        } else {
            mFadeInTotalFrames = 0;
            mFadeInFramesRemaining = 0;
            mSkippingLeadingSilence = false;
        }
    }
    return ok;
}

bool AudioEngine::openFd(int fd, int64_t length) {
    std::lock_guard<std::mutex> lock(mEngineMutex);
    mIsPlaying.store(false);
    mParametricEQ.resetState();
    mEnvRms = 0.2f;
    mNormGain = 1.0f;
    bool ok = mDecoder->openFd(fd, length);
    if (ok) {
        int32_t fileSampleRate = mDecoder->getSampleRate();
        if (fileSampleRate > 0 && fileSampleRate != mSampleRate) {
            mSampleRate = fileSampleRate;
            closeOboeStream();
            initOboeStream();
        } else if (!mStream) {
            initOboeStream();
        }
        int fadeSec = mMixerFadeSeconds.load();
        if (fadeSec > 0) {
            mFadeInTotalFrames = static_cast<int64_t>(mSampleRate) * fadeSec / 2;
            mFadeInFramesRemaining = mFadeInTotalFrames;
            mSkippingLeadingSilence = true;
            mLeadingSilenceFramesSkipped = 0;
        } else {
            mFadeInTotalFrames = 0;
            mFadeInFramesRemaining = 0;
            mSkippingLeadingSilence = false;
        }
    }
    return ok;
}

void AudioEngine::play() {
    std::lock_guard<std::mutex> lock(mEngineMutex);
    if (!mStream || mStream->getState() == oboe::StreamState::Closed || mStream->getState() == oboe::StreamState::Disconnected) {
        closeOboeStream();
        initOboeStream();
    }
    if (mStream && mStream->getState() != oboe::StreamState::Started) {
        oboe::Result r = mStream->requestStart();
        if (r != oboe::Result::OK) {
            LOGE("requestStart falló (%s), recreando flujo Oboe...", oboe::convertToText(r));
            closeOboeStream();
            if (initOboeStream() && mStream) {
                mStream->requestStart();
            }
        }
    }
    mDecoder->start();
    mIsPlaying.store(true);
}

void AudioEngine::pause() {
    std::lock_guard<std::mutex> lock(mEngineMutex);
    mIsPlaying.store(false);
    mDecoder->pause();
    if (mStream && mStream->getState() == oboe::StreamState::Started) {
        mStream->requestPause();
    }
}

void AudioEngine::stop() {
    std::lock_guard<std::mutex> lock(mEngineMutex);
    mIsPlaying.store(false);
    mDecoder->stop();
    if (mStream) {
        mStream->requestStop();
    }
    for (auto& s : mSpectrum) s.store(0.0f);
    for (auto& w : mWaveform) w.store(0.0f);
}

void AudioEngine::seekTo(int64_t positionMs) {
    mDecoder->seekTo(positionMs);
}

void AudioEngine::setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor) {
    mParametricEQ.setBandParams(bandIndex, frequencyHz, gainDb, qFactor);
}

void AudioEngine::setVisualizerEnabled(bool enabled) {
    mVisualizerEnabled.store(enabled, std::memory_order_relaxed);
}

void AudioEngine::setNormalizationEnabled(bool enabled) {
    mNormalizationEnabled.store(enabled, std::memory_order_relaxed);
    if (!enabled) {
        mNormGain = 1.0f;
    }
}

void AudioEngine::setMixerFadeSeconds(int seconds) {
    mMixerFadeSeconds.store(std::clamp(seconds, 0, 12), std::memory_order_relaxed);
}

int64_t AudioEngine::getPositionMs() const {
    return mDecoder ? mDecoder->getPositionMs() : 0;
}

int64_t AudioEngine::getDurationMs() const {
    return mDecoder ? mDecoder->getDurationMs() : 0;
}

bool AudioEngine::isPlaying() const {
    return mIsPlaying.load();
}

bool AudioEngine::isTrackFinished() const {
    return mDecoder && mDecoder->isFinished() && mRingBuffer.availableRead() == 0;
}

void AudioEngine::getVisualizerData(float* outSpectrum, int spectrumLen, float* outWaveform, int waveformLen) {
    int sCount = std::min(spectrumLen, SPECTRUM_BINS);
    for (int i = 0; i < sCount; ++i) {
        outSpectrum[i] = mSpectrum[i].load(std::memory_order_relaxed);
    }
    int wCount = std::min(waveformLen, WAVEFORM_BARS);
    int startIdx = mWaveformWriteIdx;
    for (int i = 0; i < wCount; ++i) {
        int idx = (startIdx + i) % WAVEFORM_BARS;
        outWaveform[i] = mWaveform[idx].load(std::memory_order_relaxed);
    }
}

void AudioEngine::updateVisualizerFromPCM(const float* interleavedStereo, int32_t numFrames) {
    if (numFrames <= 0) return;

    // 1. Real RMS energy of this buffer for scrolling waveform
    float sumSq = 0.0f;
    for (int32_t i = 0; i < numFrames; ++i) {
        float mono = 0.5f * (interleavedStereo[i * 2] + interleavedStereo[i * 2 + 1]);
        sumSq += mono * mono;
    }
    float rms = std::sqrt(sumSq / static_cast<float>(numFrames));
    float normalizedRms = std::clamp(rms * 3.2f, 0.04f, 1.0f);

    // Push a new waveform bar roughly every ~25ms (every ~3-4 callbacks)
    if (++mVisFrameCounter >= 3) {
        mVisFrameCounter = 0;
        mWaveform[mWaveformWriteIdx].store(normalizedRms, std::memory_order_relaxed);
        mWaveformWriteIdx = (mWaveformWriteIdx + 1) % WAVEFORM_BARS;
    }

    // 2. Real 20-band Goertzel/DFT spectrum on 64 mono samples (logarithmic musical frequencies 60Hz..12kHz)
    static constexpr int N = 64;
    if (numFrames < N) return;

    static constexpr float kBandFreqs[SPECTRUM_BINS] = {
        60.0f, 90.0f, 130.0f, 180.0f, 250.0f,
        350.0f, 480.0f, 650.0f, 880.0f, 1200.0f,
        1600.0f, 2100.0f, 2800.0f, 3600.0f, 4600.0f,
        5800.0f, 7200.0f, 8800.0f, 10500.0f, 12500.0f
    };

    float monoBuf[N];
    int step = std::max(1, numFrames / N);
    for (int i = 0; i < N; ++i) {
        int fi = i * step;
        // Hann window to avoid spectral leakage
        float win = 0.5f * (1.0f - std::cos(2.0f * M_PI * i / (N - 1)));
        monoBuf[i] = 0.5f * (interleavedStereo[fi * 2] + interleavedStereo[fi * 2 + 1]) * win;
    }

    float effSampleRate = static_cast<float>(mSampleRate) / static_cast<float>(step);
    for (int b = 0; b < SPECTRUM_BINS; ++b) {
        float targetFreq = std::min(kBandFreqs[b], effSampleRate * 0.45f);
        float omega = 2.0f * M_PI * targetFreq / effSampleRate;
        float coeff = 2.0f * std::cos(omega);
        float s0 = 0.0f, s1 = 0.0f, s2 = 0.0f;
        for (int i = 0; i < N; ++i) {
            s0 = monoBuf[i] + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
        }
        float power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
        float mag = std::sqrt(std::max(0.0f, power)) / (N * 0.35f);
        // Logarithmic visual scaling + smooth decay
        float scaled = std::clamp(std::log1p(mag * 4.5f) / 1.8f, 0.04f, 1.0f);
        float prev = mSpectrum[b].load(std::memory_order_relaxed);
        float smoothed = (scaled > prev) ? (prev * 0.35f + scaled * 0.65f) : (prev * 0.78f + scaled * 0.22f);
        mSpectrum[b].store(smoothed, std::memory_order_relaxed);
    }
}

oboe::DataCallbackResult AudioEngine::onAudioReady(oboe::AudioStream *oboeStream, void *audioData, int32_t numFrames) {
    float *output = static_cast<float *>(audioData);
    size_t totalSamplesNeeded = static_cast<size_t>(numFrames * 2); // Estéreo

    if (!mIsPlaying.load()) {
        std::memset(audioData, 0, totalSamplesNeeded * sizeof(float));
        for (int i = 0; i < SPECTRUM_BINS; ++i) {
            float prev = mSpectrum[i].load(std::memory_order_relaxed);
            mSpectrum[i].store(prev * 0.85f, std::memory_order_relaxed);
        }
        return oboe::DataCallbackResult::Continue;
    }

    size_t samplesRead = mRingBuffer.read(output, totalSamplesNeeded);

    // Smart Leading-Silence Skip when Mixer is enabled (up to 4 seconds max)
    if (mSkippingLeadingSilence && samplesRead >= totalSamplesNeeded) {
        float peak = 0.0f;
        for (size_t i = 0; i < samplesRead; ++i) {
            peak = std::max(peak, std::abs(output[i]));
        }
        if (peak < 0.004f && mLeadingSilenceFramesSkipped < mSampleRate * 4) {
            mLeadingSilenceFramesSkipped += numFrames;
            // Pull next chunk immediately to skip dead silence
            samplesRead = mRingBuffer.read(output, totalSamplesNeeded);
        } else {
            mSkippingLeadingSilence = false;
        }
    }

    // Rellenar con silencio si no hay suficientes muestras listas
    if (samplesRead < totalSamplesNeeded) {
        std::memset(output + samplesRead, 0, (totalSamplesNeeded - samplesRead) * sizeof(float));
    }

    // Optional Real-Time Loudness Normalizer (slow 3s RMS envelope -> target -14 dBFS)
    if (mNormalizationEnabled.load(std::memory_order_relaxed) && samplesRead > 0) {
        float sumSq = 0.0f;
        for (size_t i = 0; i < samplesRead; ++i) {
            sumSq += output[i] * output[i];
        }
        float blockRms = std::sqrt(sumSq / static_cast<float>(samplesRead));
        // Ignore silence so we never boost noise floor during quiet intros
        if (blockRms > 0.015f) {
            mEnvRms = mEnvRms * 0.985f + blockRms * 0.015f;
            constexpr float kTargetRms = 0.20f; // ~ -14 dBFS
            float targetGain = std::clamp(kTargetRms / std::max(0.02f, mEnvRms), 0.50f, 2.20f);
            mNormGain = mNormGain * 0.97f + targetGain * 0.03f;
        }
        for (size_t i = 0; i < samplesRead; ++i) {
            output[i] *= mNormGain;
        }
    }

    // Optional Mixer Equal-Power Fade-In & End-of-Track Fade-Out
    int fadeSec = mMixerFadeSeconds.load(std::memory_order_relaxed);
    if (fadeSec > 0) {
        if (mFadeInFramesRemaining > 0 && mFadeInTotalFrames > 0) {
            for (int32_t f = 0; f < numFrames; ++f) {
                if (mFadeInFramesRemaining <= 0) break;
                float progress = 1.0f - (static_cast<float>(mFadeInFramesRemaining) / static_cast<float>(mFadeInTotalFrames));
                float gain = std::sin(progress * (M_PI * 0.5f));
                output[f * 2] *= gain;
                output[f * 2 + 1] *= gain;
                mFadeInFramesRemaining--;
            }
        }
        int64_t durMs = mDecoder ? mDecoder->getDurationMs() : 0;
        int64_t posMs = mDecoder ? mDecoder->getPositionMs() : 0;
        int64_t fadeOutMs = static_cast<int64_t>(fadeSec) * 1000;
        if (durMs > fadeOutMs + 2000 && posMs > durMs - fadeOutMs) {
            float rem = std::clamp(static_cast<float>(durMs - posMs) / static_cast<float>(fadeOutMs), 0.0f, 1.0f);
            float gain = std::sin(rem * (M_PI * 0.5f));
            for (size_t i = 0; i < samplesRead; ++i) {
                output[i] *= gain;
            }
        }
    }

    // Procesar a través del ecualizador paramétrico de 5 bandas + Soft Limiter en tiempo real
    mParametricEQ.processInterleavedStereo(output, numFrames);

    // Alimentar visualizador SOLO cuando está activo en pantalla (0% CPU en segundo plano / carro)
    if (mVisualizerEnabled.load(std::memory_order_relaxed)) {
        updateVisualizerFromPCM(output, numFrames);
    }

    return oboe::DataCallbackResult::Continue;
}

void AudioEngine::onErrorAfterClose(oboe::AudioStream *oboeStream, oboe::Result error) {
    LOGE("Error en Oboe después del cierre: %s. Reiniciando flujo...", oboe::convertToText(error));
    std::lock_guard<std::mutex> lock(mEngineMutex);
    closeOboeStream();
    if (initOboeStream() && mIsPlaying.load() && mStream) {
        mStream->requestStart();
    }
}

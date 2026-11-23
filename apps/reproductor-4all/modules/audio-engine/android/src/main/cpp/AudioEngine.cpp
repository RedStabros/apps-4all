#include "AudioEngine.h"
#include <android/log.h>

#define TAG "AudioEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

AudioEngine& AudioEngine::getInstance() {
    static AudioEngine instance;
    return instance;
}

AudioEngine::AudioEngine()
    : mRingBuffer(192000),
      mDecoder(std::make_unique<AMediaDecoder>(mRingBuffer)) {
    initOboeStream();
}

AudioEngine::~AudioEngine() {
    stop();
    closeOboeStream();
}

bool AudioEngine::initOboeStream() {
    oboe::AudioStreamBuilder builder;
    builder.setDirection(oboe::Direction::Output)
           ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
           ->setSharingMode(oboe::SharingMode::Exclusive)
           ->setFormat(oboe::AudioFormat::Float)
           ->setChannelCount(oboe::ChannelCount::Stereo)
           ->setSampleRate(mSampleRate)
           ->setDataCallback(this)
           ->setErrorCallback(this);

    oboe::Result result = builder.openStream(mStream);
    if (result != oboe::Result::OK) {
        LOGE("Error abriendo flujo Google Oboe: %s", oboe::convertToText(result));
        return false;
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
    bool ok = mDecoder->open(filePath);
    if (ok) {
        int32_t fileSampleRate = mDecoder->getSampleRate();
        if (fileSampleRate > 0 && fileSampleRate != mSampleRate) {
            mSampleRate = fileSampleRate;
            closeOboeStream();
            initOboeStream();
        }
    }
    return ok;
}

void AudioEngine::play() {
    if (!mStream) {
        initOboeStream();
    }
    if (mStream && mStream->getState() != oboe::StreamState::Started) {
        mStream->requestStart();
    }
    mDecoder->start();
    mIsPlaying.store(true);
}

void AudioEngine::pause() {
    mIsPlaying.store(false);
    mDecoder->pause();
    if (mStream && mStream->getState() == oboe::StreamState::Started) {
        mStream->requestPause();
    }
}

void AudioEngine::stop() {
    mIsPlaying.store(false);
    mDecoder->stop();
    if (mStream) {
        mStream->requestStop();
    }
}

void AudioEngine::seekTo(int64_t positionMs) {
    mDecoder->seekTo(positionMs);
}

void AudioEngine::setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor) {
    mParametricEQ.setBandParams(bandIndex, frequencyHz, gainDb, qFactor);
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

oboe::DataCallbackResult AudioEngine::onAudioReady(oboe::AudioStream *oboeStream, void *audioData, int32_t numFrames) {
    float *output = static_cast<float *>(audioData);
    size_t totalSamplesNeeded = static_cast<size_t>(numFrames * 2); // Estéreo

    if (!mIsPlaying.load()) {
        std::memset(audioData, 0, totalSamplesNeeded * sizeof(float));
        return oboe::DataCallbackResult::Continue;
    }

    size_t samplesRead = mRingBuffer.read(output, totalSamplesNeeded);

    // Rellenar con silencio si no hay suficientes muestras listas
    if (samplesRead < totalSamplesNeeded) {
        std::memset(output + samplesRead, 0, (totalSamplesNeeded - samplesRead) * sizeof(float));
    }

    // Procesar a través del ecualizador paramétrico de 5 bandas en tiempo real
    mParametricEQ.processInterleavedStereo(output, numFrames);

    return oboe::DataCallbackResult::Continue;
}

void AudioEngine::onErrorAfterClose(oboe::AudioStream *oboeStream, oboe::Result error) {
    LOGE("Error en Oboe después del cierre: %s. Reiniciando flujo...", oboe::convertToText(error));
    initOboeStream();
}

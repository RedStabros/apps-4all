#pragma once

#include <memory>
#include <string>
#include <mutex>
#include <array>
#include <oboe/Oboe.h>
#include "LockFreeRingBuffer.h"
#include "ParametricEQ.h"
#include "AMediaDecoder.h"

class AudioEngine : public oboe::AudioStreamDataCallback,
                    public oboe::AudioStreamErrorCallback {
public:
    static constexpr int SPECTRUM_BINS = 20;
    static constexpr int WAVEFORM_BARS = 36;

    static AudioEngine& getInstance();

    bool openFile(const std::string& filePath);
    bool openFd(int fd, int64_t length);
    void play();
    void pause();
    void stop();
    void seekTo(int64_t positionMs);
    void setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor);
    void setVisualizerEnabled(bool enabled);
    void setNormalizationEnabled(bool enabled);
    void setMixerFadeSeconds(int seconds);

    int64_t getPositionMs() const;
    int64_t getDurationMs() const;
    bool isPlaying() const;
    bool isTrackFinished() const;
    void getVisualizerData(float* outSpectrum, int spectrumLen, float* outWaveform, int waveformLen);

    // Callbacks de Google Oboe
    oboe::DataCallbackResult onAudioReady(oboe::AudioStream *oboeStream, void *audioData, int32_t numFrames) override;
    void onErrorAfterClose(oboe::AudioStream *oboeStream, oboe::Result error) override;

private:
    AudioEngine();
    ~AudioEngine();

    bool initOboeStream();
    void closeOboeStream();
    void updateVisualizerFromPCM(const float* interleavedStereo, int32_t numFrames);

    LockFreeRingBuffer mRingBuffer;
    std::unique_ptr<AMediaDecoder> mDecoder;
    ParametricEQ mParametricEQ;

    std::mutex mEngineMutex;
    std::shared_ptr<oboe::AudioStream> mStream;
    std::atomic<bool> mIsPlaying{false};
    int32_t mSampleRate = 48000;

    // Performance & DSP feature toggles (lock-free atomics)
    std::atomic<bool> mVisualizerEnabled{false};
    std::atomic<bool> mNormalizationEnabled{false};
    std::atomic<int> mMixerFadeSeconds{0};

    // Real-time slow RMS normalizer state
    float mEnvRms = 0.2f;
    float mNormGain = 1.0f;

    // Mixer fade-in / smart-silence state
    int64_t mFadeInFramesRemaining = 0;
    int64_t mFadeInTotalFrames = 0;
    bool mSkippingLeadingSilence = false;
    int mLeadingSilenceFramesSkipped = 0;

    // Real-time visualizer buffers (lock-free atomic floats)
    std::array<std::atomic<float>, SPECTRUM_BINS> mSpectrum{};
    std::array<std::atomic<float>, WAVEFORM_BARS> mWaveform{};
    int mWaveformWriteIdx = 0;
    int mVisFrameCounter = 0;
};

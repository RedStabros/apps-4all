#pragma once

#include <memory>
#include <string>
#include <oboe/Oboe.h>
#include "LockFreeRingBuffer.h"
#include "ParametricEQ.h"
#include "AMediaDecoder.h"

class AudioEngine : public oboe::AudioStreamDataCallback,
                    public oboe::AudioStreamErrorCallback {
public:
    static AudioEngine& getInstance();

    bool openFile(const std::string& filePath);
    void play();
    void pause();
    void stop();
    void seekTo(int64_t positionMs);
    void setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor);

    int64_t getPositionMs() const;
    int64_t getDurationMs() const;
    bool isPlaying() const;

    // Callbacks de Google Oboe
    oboe::DataCallbackResult onAudioReady(oboe::AudioStream *oboeStream, void *audioData, int32_t numFrames) override;
    void onErrorAfterClose(oboe::AudioStream *oboeStream, oboe::Result error) override;

private:
    AudioEngine();
    ~AudioEngine();

    bool initOboeStream();
    void closeOboeStream();

    LockFreeRingBuffer mRingBuffer;
    std::unique_ptr<AMediaDecoder> mDecoder;
    ParametricEQ mParametricEQ;

    std::shared_ptr<oboe::AudioStream> mStream;
    std::atomic<bool> mIsPlaying{false};
    int32_t mSampleRate = 48000;
};

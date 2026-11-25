#pragma once

#include <string>
#include <thread>
#include <atomic>
#include <media/NdkMediaExtractor.h>
#include <media/NdkMediaCodec.h>
#include "LockFreeRingBuffer.h"

class AMediaDecoder {
public:
    explicit AMediaDecoder(LockFreeRingBuffer& ringBuffer);
    ~AMediaDecoder();

    bool open(const std::string& filePath);
    bool openFd(int fd, int64_t length);
    void start();
    void pause();
    void resume();
    void stop();
    void seekTo(int64_t positionMs);

    int64_t getDurationMs() const { return mDurationMs.load(); }
    int64_t getPositionMs() const { return mPositionMs.load(); }
    bool isPlaying() const { return mIsPlaying.load(); }
    bool isFinished() const { return mFinished.load(); }
    int32_t getSampleRate() const { return mSampleRate; }
    int32_t getChannelCount() const { return mChannelCount; }

private:
    void decodeLoop();
    void cleanup();

    LockFreeRingBuffer& mRingBuffer;
    AMediaExtractor* mExtractor = nullptr;
    AMediaCodec* mCodec = nullptr;

    std::thread mDecodeThread;
    std::atomic<bool> mIsRunning{false};
    std::atomic<bool> mIsPlaying{false};
    std::atomic<bool> mFinished{false};
    std::atomic<bool> mSeekRequested{false};
    std::atomic<int64_t> mSeekPositionUs{0};

    std::atomic<int64_t> mDurationMs{0};
    std::atomic<int64_t> mPositionMs{0};

    int32_t mSampleRate = 48000;
    int32_t mChannelCount = 2;
    int32_t mPcmEncoding = 2; // 2 = PCM_16BIT, 4 = PCM_FLOAT
    int mTrackIndex = -1;
};

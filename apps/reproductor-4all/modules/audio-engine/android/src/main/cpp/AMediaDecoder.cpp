#include "AMediaDecoder.h"
#include <android/log.h>
#include <fcntl.h>
#include <unistd.h>
#include <chrono>

#define TAG "AMediaDecoder"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

AMediaDecoder::AMediaDecoder(LockFreeRingBuffer& ringBuffer)
    : mRingBuffer(ringBuffer) {}

AMediaDecoder::~AMediaDecoder() {
    stop();
}

bool AMediaDecoder::open(const std::string& filePath) {
    stop();

    std::string cleanPath = filePath;
    const std::string filePrefix = "file://";
    if (cleanPath.rfind(filePrefix, 0) == 0) {
        cleanPath = cleanPath.substr(filePrefix.length());
    }

    int fd = ::open(cleanPath.c_str(), O_RDONLY);
    if (fd < 0) {
        LOGE("Error abriendo archivo en disco: %s", cleanPath.c_str());
        return false;
    }

    off_t fileSize = lseek(fd, 0, SEEK_END);
    lseek(fd, 0, SEEK_SET);

    bool ok = openFd(fd, static_cast<int64_t>(fileSize));
    ::close(fd);
    return ok;
}

bool AMediaDecoder::openFd(int fd, int64_t length) {
    stop();

    if (fd < 0) {
        LOGE("Descriptor de archivo inválido: %d", fd);
        return false;
    }

    int64_t effectiveLen = length;
    if (effectiveLen <= 0) {
        off_t measured = lseek(fd, 0, SEEK_END);
        lseek(fd, 0, SEEK_SET);
        effectiveLen = measured > 0 ? static_cast<int64_t>(measured) : INT64_MAX;
    }

    mExtractor = AMediaExtractor_new();
    media_status_t status = AMediaExtractor_setDataSourceFd(mExtractor, fd, 0, effectiveLen);

    if (status != AMEDIA_OK) {
        LOGE("AMediaExtractor_setDataSourceFd falló con estado %d", status);
        cleanup();
        return false;
    }

    size_t numTracks = AMediaExtractor_getTrackCount(mExtractor);
    mTrackIndex = -1;
    std::string mimeStr;

    for (size_t i = 0; i < numTracks; ++i) {
        AMediaFormat* format = AMediaExtractor_getTrackFormat(mExtractor, i);
        const char* mime = nullptr;
        if (AMediaFormat_getString(format, AMEDIAFORMAT_KEY_MIME, &mime) && mime != nullptr) {
            if (strncmp(mime, "audio/", 6) == 0) {
                mimeStr = mime;
                mTrackIndex = static_cast<int>(i);
                AMediaFormat_getInt32(format, AMEDIAFORMAT_KEY_SAMPLE_RATE, &mSampleRate);
                AMediaFormat_getInt32(format, AMEDIAFORMAT_KEY_CHANNEL_COUNT, &mChannelCount);
                if (!AMediaFormat_getInt32(format, "pcm-encoding", &mPcmEncoding)) {
                    mPcmEncoding = 2; // Default a PCM_16BIT
                }
                int64_t durationUs = 0;
                if (AMediaFormat_getInt64(format, AMEDIAFORMAT_KEY_DURATION, &durationUs)) {
                    mDurationMs.store(durationUs / 1000);
                }
                AMediaExtractor_selectTrack(mExtractor, mTrackIndex);
                AMediaFormat_delete(format);
                break;
            }
        }
        AMediaFormat_delete(format);
    }

    if (mTrackIndex < 0 || mimeStr.empty()) {
        LOGE("No se encontró pista de audio válida en el archivo.");
        cleanup();
        return false;
    }

    LOGI("Pista de audio localizada: MIME=%s, SampleRate=%d, Channels=%d, Duración=%lld ms",
         mimeStr.c_str(), mSampleRate, mChannelCount, (long long)mDurationMs.load());

    mCodec = AMediaCodec_createDecoderByType(mimeStr.c_str());
    if (!mCodec) {
        LOGE("No se pudo instanciar decodificador nativo por hardware para MIME %s", mimeStr.c_str());
        cleanup();
        return false;
    }

    AMediaFormat* audioFormat = AMediaExtractor_getTrackFormat(mExtractor, mTrackIndex);
    status = AMediaCodec_configure(mCodec, audioFormat, nullptr, nullptr, 0);
    AMediaFormat_delete(audioFormat);

    if (status != AMEDIA_OK) {
        LOGE("AMediaCodec_configure falló con estado %d", status);
        cleanup();
        return false;
    }

    status = AMediaCodec_start(mCodec);
    if (status != AMEDIA_OK) {
        LOGE("AMediaCodec_start falló con estado %d", status);
        cleanup();
        return false;
    }

    mPositionMs.store(0);
    mFinished.store(false);
    return true;
}

void AMediaDecoder::start() {
    if (!mCodec || !mExtractor) {
        LOGE("AMediaDecoder::start llamado sin archivo cargado.");
        return;
    }
    if (mIsRunning.load()) {
        mIsPlaying.store(true);
        return;
    }
    if (mDecodeThread.joinable()) {
        mDecodeThread.join();
    }
    mIsRunning.store(true);
    mIsPlaying.store(true);
    mDecodeThread = std::thread(&AMediaDecoder::decodeLoop, this);
}

void AMediaDecoder::pause() {
    mIsPlaying.store(false);
}

void AMediaDecoder::resume() {
    mIsPlaying.store(true);
}

void AMediaDecoder::stop() {
    mIsRunning.store(false);
    mIsPlaying.store(false);
    if (mDecodeThread.joinable()) {
        mDecodeThread.join();
    }
    cleanup();
}

void AMediaDecoder::seekTo(int64_t positionMs) {
    mFinished.store(false);
    mSeekPositionUs.store(positionMs * 1000);
    mSeekRequested.store(true);
}

void AMediaDecoder::cleanup() {
    if (mCodec) {
        AMediaCodec_stop(mCodec);
        AMediaCodec_delete(mCodec);
        mCodec = nullptr;
    }
    if (mExtractor) {
        AMediaExtractor_delete(mExtractor);
        mExtractor = nullptr;
    }
    mRingBuffer.reset();
}

void AMediaDecoder::decodeLoop() {
    bool sawInputEOS = false;
    bool sawOutputEOS = false;
    std::vector<float> convertedSamples;
    convertedSamples.reserve(8192);

    while (mIsRunning.load() && !sawOutputEOS) {
        if (!mIsPlaying.load()) {
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
            continue;
        }
        // Manejar seek si fue solicitado
        if (mSeekRequested.load()) {
            int64_t targetUs = mSeekPositionUs.load();
            mSeekRequested.store(false);
            AMediaExtractor_seekTo(mExtractor, targetUs, AMEDIAEXTRACTOR_SEEK_CLOSEST_SYNC);
            AMediaCodec_flush(mCodec);
            mRingBuffer.reset();
            mPositionMs.store(targetUs / 1000);
            sawInputEOS = false;
        }

        // 1. Alimentar buffer de entrada del decodificador por hardware
        if (!sawInputEOS) {
            ssize_t inputIndex = AMediaCodec_dequeueInputBuffer(mCodec, 2000); // 2ms timeout
            if (inputIndex >= 0) {
                size_t bufferSize = 0;
                uint8_t* inputBuffer = AMediaCodec_getInputBuffer(mCodec, inputIndex, &bufferSize);
                ssize_t sampleSize = AMediaExtractor_readSampleData(mExtractor, inputBuffer, bufferSize);

                if (sampleSize < 0) {
                    sawInputEOS = true;
                    AMediaCodec_queueInputBuffer(mCodec, inputIndex, 0, 0, 0, AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM);
                } else {
                    int64_t presentationTimeUs = AMediaExtractor_getSampleTime(mExtractor);
                    AMediaCodec_queueInputBuffer(mCodec, inputIndex, 0, sampleSize, presentationTimeUs, 0);
                    AMediaExtractor_advance(mExtractor);
                }
            }
        }

        // 2. Extraer buffer PCM descomprimido por el procesador
        AMediaCodecBufferInfo info;
        ssize_t outputIndex = AMediaCodec_dequeueOutputBuffer(mCodec, &info, 2000);

        if (outputIndex >= 0) {
            if (info.flags & AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM) {
                sawOutputEOS = true;
            }

            if (info.size > 0) {
                size_t outBufferSize = 0;
                uint8_t* outputBuffer = AMediaCodec_getOutputBuffer(mCodec, outputIndex, &outBufferSize);

                convertedSamples.clear();

                if (mPcmEncoding == 4) { // AudioFormat.ENCODING_PCM_FLOAT
                    size_t numSamples = info.size / sizeof(float);
                    const float* pcmFloat = reinterpret_cast<const float*>(outputBuffer + info.offset);

                    if (mChannelCount == 1) {
                        for (size_t s = 0; s < numSamples; ++s) {
                            float sample = std::clamp(pcmFloat[s], -1.0f, 1.0f);
                            convertedSamples.push_back(sample);
                            convertedSamples.push_back(sample);
                        }
                    } else {
                        for (size_t s = 0; s < numSamples; ++s) {
                            convertedSamples.push_back(std::clamp(pcmFloat[s], -1.0f, 1.0f));
                        }
                    }
                } else { // AudioFormat.ENCODING_PCM_16BIT (predeterminado)
                    size_t numSamples = info.size / sizeof(int16_t);
                    const int16_t* pcm16 = reinterpret_cast<const int16_t*>(outputBuffer + info.offset);

                    if (mChannelCount == 1) {
                        for (size_t s = 0; s < numSamples; ++s) {
                            float sample = static_cast<float>(pcm16[s]) / 32768.0f;
                            convertedSamples.push_back(sample);
                            convertedSamples.push_back(sample);
                        }
                    } else {
                        for (size_t s = 0; s < numSamples; ++s) {
                            convertedSamples.push_back(static_cast<float>(pcm16[s]) / 32768.0f);
                        }
                    }
                }

                // Escribir en el buffer circular libre de bloqueos
                size_t totalWritten = 0;
                size_t toWrite = convertedSamples.size();
                while (mIsRunning.load() && totalWritten < toWrite) {
                    size_t written = mRingBuffer.write(convertedSamples.data() + totalWritten, toWrite - totalWritten);
                    totalWritten += written;
                    if (totalWritten < toWrite) {
                        // Esperar que el callback de Oboe consuma muestras (12ms ahorra batería y CPU)
                        std::this_thread::sleep_for(std::chrono::milliseconds(12));
                    }
                }

                mPositionMs.store(info.presentationTimeUs / 1000);
            }

            AMediaCodec_releaseOutputBuffer(mCodec, outputIndex, false);
        } else if (outputIndex == AMEDIACODEC_INFO_OUTPUT_FORMAT_CHANGED) {
            AMediaFormat* newFormat = AMediaCodec_getOutputFormat(mCodec);
            AMediaFormat_getInt32(newFormat, AMEDIAFORMAT_KEY_SAMPLE_RATE, &mSampleRate);
            AMediaFormat_getInt32(newFormat, AMEDIAFORMAT_KEY_CHANNEL_COUNT, &mChannelCount);
            AMediaFormat_getInt32(newFormat, "pcm-encoding", &mPcmEncoding);
            AMediaFormat_delete(newFormat);
        }
    }

    if (sawOutputEOS && mIsRunning.load()) {
        mFinished.store(true);
    }
    mIsPlaying.store(false);
    mIsRunning.store(false);
}

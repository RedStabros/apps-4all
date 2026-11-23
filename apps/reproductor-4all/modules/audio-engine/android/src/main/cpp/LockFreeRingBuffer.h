#pragma once

#include <vector>
#include <atomic>
#include <cstdint>
#include <algorithm>
#include <cstring>

/**
 * Single-Producer Single-Consumer (SPSC) Lock-Free Ring Buffer.
 * Diseñado para transferir muestras de audio PCM entre el hilo decodificador (AMediaCodec)
 * y el hilo de tiempo real de audio (Google Oboe callback) con CERO bloqueos (cero mutex)
 * y CERO asignación de memoria dinámica durante la reproducción.
 */
class LockFreeRingBuffer {
public:
    explicit LockFreeRingBuffer(size_t capacity = 192000) // ~1 segundo de estéreo a 48kHz/16-bit
        : mCapacity(capacity),
          mBuffer(capacity, 0.0f),
          mHead(0),
          mTail(0) {}

    void reset() {
        mHead.store(0, std::memory_order_relaxed);
        mTail.store(0, std::memory_order_relaxed);
    }

    size_t availableRead() const {
        size_t head = mHead.load(std::memory_order_acquire);
        size_t tail = mTail.load(std::memory_order_relaxed);
        if (head >= tail) {
            return head - tail;
        }
        return mCapacity + head - tail;
    }

    size_t availableWrite() const {
        return (mCapacity - 1) - availableRead();
    }

    size_t write(const float* data, size_t count) {
        size_t writeable = std::min(count, availableWrite());
        if (writeable == 0) return 0;

        size_t head = mHead.load(std::memory_order_relaxed);
        size_t firstChunk = std::min(writeable, mCapacity - head);
        std::memcpy(&mBuffer[head], data, firstChunk * sizeof(float));

        size_t secondChunk = writeable - firstChunk;
        if (secondChunk > 0) {
            std::memcpy(&mBuffer[0], data + firstChunk, secondChunk * sizeof(float));
        }

        mHead.store((head + writeable) % mCapacity, std::memory_order_release);
        return writeable;
    }

    size_t read(float* dest, size_t count) {
        size_t readable = std::min(count, availableRead());
        if (readable == 0) return 0;

        size_t tail = mTail.load(std::memory_order_relaxed);
        size_t firstChunk = std::min(readable, mCapacity - tail);
        std::memcpy(dest, &mBuffer[tail], firstChunk * sizeof(float));

        size_t secondChunk = readable - firstChunk;
        if (secondChunk > 0) {
            std::memcpy(dest + firstChunk, &mBuffer[0], secondChunk * sizeof(float));
        }

        mTail.store((tail + readable) % mCapacity, std::memory_order_release);
        return readable;
    }

private:
    const size_t mCapacity;
    std::vector<float> mBuffer;
    alignas(64) std::atomic<size_t> mHead;
    alignas(64) std::atomic<size_t> mTail;
};

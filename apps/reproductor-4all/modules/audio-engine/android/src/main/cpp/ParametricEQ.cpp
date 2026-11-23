#include "ParametricEQ.h"
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

BiquadFilter::BiquadFilter() {
    mCoeffs = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    mTargetCoeffs = mCoeffs;
}

void BiquadFilter::setParams(FilterType type, float frequencyHz, float gainDb, float qFactor, float sampleRate) {
    mType = type;
    mFrequency = std::clamp(frequencyHz, 20.0f, sampleRate * 0.45f);
    mGainDb = std::clamp(gainDb, -15.0f, 15.0f);
    mQ = std::clamp(qFactor, 0.1f, 10.0f);
    updateCoeffs(sampleRate);
}

void BiquadFilter::updateCoeffs(float sampleRate) {
    float A = std::pow(10.0f, mGainDb / 40.0f);
    float omega = 2.0f * M_PI * mFrequency / sampleRate;
    float sn = std::sin(omega);
    float cs = std::cos(omega);
    float alpha = sn / (2.0f * mQ);

    float b0 = 1.0f, b1 = 0.0f, b2 = 0.0f, a0 = 1.0f, a1 = 0.0f, a2 = 0.0f;

    switch (mType) {
        case FilterType::LowShelf: {
            float sqrtA = std::sqrt(A);
            b0 = A * ((A + 1.0f) - (A - 1.0f) * cs + 2.0f * sqrtA * alpha);
            b1 = 2.0f * A * ((A - 1.0f) - (A + 1.0f) * cs);
            b2 = A * ((A + 1.0f) - (A - 1.0f) * cs - 2.0f * sqrtA * alpha);
            a0 = (A + 1.0f) + (A - 1.0f) * cs + 2.0f * sqrtA * alpha;
            a1 = -2.0f * ((A - 1.0f) + (A + 1.0f) * cs);
            a2 = (A + 1.0f) + (A - 1.0f) * cs - 2.0f * sqrtA * alpha;
            break;
        }
        case FilterType::Peaking: {
            b0 = 1.0f + alpha * A;
            b1 = -2.0f * cs;
            b2 = 1.0f - alpha * A;
            a0 = 1.0f + alpha / A;
            a1 = -2.0f * cs;
            a2 = 1.0f - alpha / A;
            break;
        }
        case FilterType::HighShelf: {
            float sqrtA = std::sqrt(A);
            b0 = A * ((A + 1.0f) + (A - 1.0f) * cs + 2.0f * sqrtA * alpha);
            b1 = -2.0f * A * ((A - 1.0f) + (A + 1.0f) * cs);
            b2 = A * ((A + 1.0f) + (A - 1.0f) * cs - 2.0f * sqrtA * alpha);
            a0 = (A + 1.0f) - (A - 1.0f) * cs + 2.0f * sqrtA * alpha;
            a1 = 2.0f * ((A - 1.0f) - (A + 1.0f) * cs);
            a2 = (A + 1.0f) - (A - 1.0f) * cs - 2.0f * sqrtA * alpha;
            break;
        }
    }

    // Normalizar por a0
    mTargetCoeffs.b0 = b0 / a0;
    mTargetCoeffs.b1 = b1 / a0;
    mTargetCoeffs.b2 = b2 / a0;
    mTargetCoeffs.a1 = a1 / a0;
    mTargetCoeffs.a2 = a2 / a0;

    // Activar interpolación anti-zipper gradual
    mNeedsSmoothing = true;
}

void BiquadFilter::stepSmoothing() {
    if (!mNeedsSmoothing) return;

    // Interpolación suave para evitar zipper noise (~30ms de convergencia)
    constexpr float kSmooth = 0.002f;
    mCoeffs.b0 += (mTargetCoeffs.b0 - mCoeffs.b0) * kSmooth;
    mCoeffs.b1 += (mTargetCoeffs.b1 - mCoeffs.b1) * kSmooth;
    mCoeffs.b2 += (mTargetCoeffs.b2 - mCoeffs.b2) * kSmooth;
    mCoeffs.a1 += (mTargetCoeffs.a1 - mCoeffs.a1) * kSmooth;
    mCoeffs.a2 += (mTargetCoeffs.a2 - mCoeffs.a2) * kSmooth;

    if (std::abs(mTargetCoeffs.b0 - mCoeffs.b0) < 1e-5f &&
        std::abs(mTargetCoeffs.b1 - mCoeffs.b1) < 1e-5f &&
        std::abs(mTargetCoeffs.b2 - mCoeffs.b2) < 1e-5f &&
        std::abs(mTargetCoeffs.a1 - mCoeffs.a1) < 1e-5f &&
        std::abs(mTargetCoeffs.a2 - mCoeffs.a2) < 1e-5f) {
        mCoeffs = mTargetCoeffs;
        mNeedsSmoothing = false;
    }
}

inline float BiquadFilter::processSample(float in, float& z1, float& z2) {
    // Transposed Direct Form II:
    // y = b0 * x + z1
    // z1 = b1 * x - a1 * y + z2
    // z2 = b2 * x - a2 * y
    float out = mCoeffs.b0 * in + z1;
    z1 = mCoeffs.b1 * in - mCoeffs.a1 * out + z2;
    z2 = mCoeffs.b2 * in - mCoeffs.a2 * out;
    return out;
}

ParametricEQ::ParametricEQ() {
    reset();
}

void ParametricEQ::reset() {
    // Frecuencias estándar para audiófilos:
    // Banda 0: Low Shelf 80 Hz (Sub-graves y pegada)
    // Banda 1: Peaking 250 Hz (Cuerpo y calidez)
    // Banda 2: Peaking 1000 Hz (Claridad vocal y medios)
    // Banda 3: Peaking 4000 Hz (Presencia e instrumentos)
    // Banda 4: High Shelf 12000 Hz (Aire y brillo sin sibilancia)
    mBands[0].setParams(FilterType::LowShelf, 80.0f, 0.0f, 0.707f, mSampleRate);
    mBands[1].setParams(FilterType::Peaking, 250.0f, 0.0f, 1.0f, mSampleRate);
    mBands[2].setParams(FilterType::Peaking, 1000.0f, 0.0f, 1.0f, mSampleRate);
    mBands[3].setParams(FilterType::Peaking, 4000.0f, 0.0f, 1.0f, mSampleRate);
    mBands[4].setParams(FilterType::HighShelf, 12000.0f, 0.0f, 0.707f, mSampleRate);

    for (int i = 0; i < NUM_BANDS; ++i) {
        mBands[i].mCoeffs = mBands[i].mTargetCoeffs;
        mBands[i].mNeedsSmoothing = false;
        mBands[i].mZ1_L = 0.0f;
        mBands[i].mZ2_L = 0.0f;
        mBands[i].mZ1_R = 0.0f;
        mBands[i].mZ2_R = 0.0f;
    }
}

void ParametricEQ::setSampleRate(float sampleRate) {
    mSampleRate = sampleRate;
    for (int i = 0; i < NUM_BANDS; ++i) {
        mBands[i].updateCoeffs(mSampleRate);
    }
}

void ParametricEQ::setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor) {
    if (bandIndex >= 0 && bandIndex < NUM_BANDS) {
        FilterType type = (bandIndex == 0) ? FilterType::LowShelf :
                          (bandIndex == NUM_BANDS - 1) ? FilterType::HighShelf : FilterType::Peaking;
        mBands[bandIndex].setParams(type, frequencyHz, gainDb, qFactor, mSampleRate);
    }
}

void ParametricEQ::processInterleavedStereo(float* buffer, int32_t numFrames) {
    for (int32_t f = 0; f < numFrames; ++f) {
        int idx = f * 2;
        float left = buffer[idx];
        float right = buffer[idx + 1];

        for (int b = 0; b < NUM_BANDS; ++b) {
            mBands[b].stepSmoothing();
            left = mBands[b].processSample(left, mBands[b].mZ1_L, mBands[b].mZ2_L);
            right = mBands[b].processSample(right, mBands[b].mZ1_R, mBands[b].mZ2_R);
        }

        // Hard limiter suave a [-1.0, 1.0] para evitar clipping digital por exceso de ganancia
        buffer[idx] = std::clamp(left, -1.0f, 1.0f);
        buffer[idx + 1] = std::clamp(right, -1.0f, 1.0f);
    }
}

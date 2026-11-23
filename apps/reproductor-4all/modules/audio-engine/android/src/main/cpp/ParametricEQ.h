#pragma once

#include <cmath>
#include <cstdint>
#include <vector>
#include <atomic>

enum class FilterType {
    LowShelf,
    Peaking,
    HighShelf
};

struct BiquadCoeffs {
    float b0 = 1.0f;
    float b1 = 0.0f;
    float b2 = 0.0f;
    float a1 = 0.0f;
    float a2 = 0.0f;
};

class BiquadFilter {
public:
    BiquadFilter();
    void setParams(FilterType type, float frequencyHz, float gainDb, float qFactor, float sampleRate);
    float processSample(float in, float& z1, float& z2);

    FilterType mType = FilterType::Peaking;
    float mFrequency = 1000.0f;
    float mGainDb = 0.0f;
    float mQ = 1.0f;

    BiquadCoeffs mCoeffs;
    BiquadCoeffs mTargetCoeffs;
    bool mNeedsSmoothing = false;
    void stepSmoothing();

    float mZ1_L = 0.0f;
    float mZ2_L = 0.0f;
    float mZ1_R = 0.0f;
    float mZ2_R = 0.0f;

    void updateCoeffs(float sampleRate);
};

class ParametricEQ {
public:
    static constexpr int NUM_BANDS = 5;

    ParametricEQ();
    void setSampleRate(float sampleRate);
    void setBandParams(int bandIndex, float frequencyHz, float gainDb, float qFactor);
    void processInterleavedStereo(float* buffer, int32_t numFrames);
    void reset();

private:
    float mSampleRate = 48000.0f;
    BiquadFilter mBands[NUM_BANDS];
};

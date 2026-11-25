#include <jni.h>
#include <string>
#include "AudioEngine.h"

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeOpenFile(JNIEnv *env, jobject thiz, jstring path) {
    const char *nativePath = env->GetStringUTFChars(path, nullptr);
    std::string filePath(nativePath);
    env->ReleaseStringUTFChars(path, nativePath);

    return static_cast<jboolean>(AudioEngine::getInstance().openFile(filePath));
}

JNIEXPORT jboolean JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeOpenFd(JNIEnv *env, jobject thiz, jint fd, jlong length) {
    return static_cast<jboolean>(AudioEngine::getInstance().openFd(static_cast<int>(fd), static_cast<int64_t>(length)));
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativePlay(JNIEnv *env, jobject thiz) {
    AudioEngine::getInstance().play();
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativePause(JNIEnv *env, jobject thiz) {
    AudioEngine::getInstance().pause();
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeStop(JNIEnv *env, jobject thiz) {
    AudioEngine::getInstance().stop();
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeSeek(JNIEnv *env, jobject thiz, jlong position_ms) {
    AudioEngine::getInstance().seekTo(static_cast<int64_t>(position_ms));
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeSetBandParams(JNIEnv *env, jobject thiz,
                                                                 jint band_index, jfloat frequency_hz,
                                                                 jfloat gain_db, jfloat q_factor) {
    AudioEngine::getInstance().setBandParams(band_index, frequency_hz, gain_db, q_factor);
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeSetVisualizerEnabled(JNIEnv *env, jobject thiz, jboolean enabled) {
    AudioEngine::getInstance().setVisualizerEnabled(static_cast<bool>(enabled));
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeSetNormalizationEnabled(JNIEnv *env, jobject thiz, jboolean enabled) {
    AudioEngine::getInstance().setNormalizationEnabled(static_cast<bool>(enabled));
}

JNIEXPORT void JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeSetMixerFadeSeconds(JNIEnv *env, jobject thiz, jint seconds) {
    AudioEngine::getInstance().setMixerFadeSeconds(static_cast<int>(seconds));
}

JNIEXPORT jlong JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeGetPositionMs(JNIEnv *env, jobject thiz) {
    return static_cast<jlong>(AudioEngine::getInstance().getPositionMs());
}

JNIEXPORT jlong JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeGetDurationMs(JNIEnv *env, jobject thiz) {
    return static_cast<jlong>(AudioEngine::getInstance().getDurationMs());
}

JNIEXPORT jboolean JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeIsPlaying(JNIEnv *env, jobject thiz) {
    return static_cast<jboolean>(AudioEngine::getInstance().isPlaying());
}

JNIEXPORT jboolean JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeIsTrackFinished(JNIEnv *env, jobject thiz) {
    return static_cast<jboolean>(AudioEngine::getInstance().isTrackFinished());
}

JNIEXPORT jfloatArray JNICALL
Java_com_apps4all_audioengine_AudioEngineModule_nativeGetVisualizerData(JNIEnv *env, jobject thiz) {
    constexpr int sLen = AudioEngine::SPECTRUM_BINS;
    constexpr int wLen = AudioEngine::WAVEFORM_BARS;
    float combined[sLen + wLen];
    AudioEngine::getInstance().getVisualizerData(combined, sLen, combined + sLen, wLen);

    jfloatArray out = env->NewFloatArray(sLen + wLen);
    if (out != nullptr) {
        env->SetFloatArrayRegion(out, 0, sLen + wLen, combined);
    }
    return out;
}

}

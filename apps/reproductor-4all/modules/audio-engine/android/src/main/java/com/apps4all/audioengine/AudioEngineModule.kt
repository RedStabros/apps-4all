package com.apps4all.audioengine

import android.bluetooth.BluetoothDevice
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class AudioEngineModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AudioEngine"
        var instance: AudioEngineModule? = null

        init {
            System.loadLibrary("audioengine")
        }
    }

    init {
        instance = this
        registerBluetoothReceiver()
    }

    override fun getName(): String = NAME

    // JNI Native Declarations
    private external fun nativeOpenFile(path: String): Boolean
    private external fun nativePlay()
    private external fun nativePause()
    private external fun nativeStop()
    private external fun nativeSeek(positionMs: Long)
    private external fun nativeSetBandParams(bandIndex: Int, frequencyHz: Float, gainDb: Float, qFactor: Float)
    private external fun nativeGetPositionMs(): Long
    private external fun nativeGetDurationMs(): Long
    private external fun nativeIsPlaying(): Boolean

    private var bluetoothReceiver: BluetoothDeviceReceiver? = null

    private fun registerBluetoothReceiver() {
        bluetoothReceiver = BluetoothDeviceReceiver { name, address ->
            val params = Arguments.createMap().apply {
                putString("deviceName", name)
                putString("deviceAddress", address)
            }
            sendEvent("onBluetoothDeviceConnected", params)
        }

        val filter = IntentFilter(BluetoothDevice.ACTION_ACL_CONNECTED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.registerReceiver(bluetoothReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            reactApplicationContext.registerReceiver(bluetoothReceiver, filter)
        }
    }

    fun emitMediaButtonAction(action: String, mediaId: String? = null) {
        val params = Arguments.createMap().apply {
            putString("action", action)
            if (mediaId != null) {
                putString("mediaId", mediaId)
            }
        }
        sendEvent("onMediaButtonAction", params)
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }

    @ReactMethod
    fun openFile(path: String, promise: Promise) {
        try {
            val success = nativeOpenFile(path)
            if (success) {
                val result = Arguments.createMap().apply {
                    putDouble("durationMs", nativeGetDurationMs().toDouble())
                }
                promise.resolve(result)
            } else {
                promise.reject("ERR_OPEN_FILE", "No se pudo decodificar el archivo local.")
            }
        } catch (e: Exception) {
            promise.reject("ERR_EXCEPTION", e.message)
        }
    }

    @ReactMethod
    fun play() {
        nativePlay()
    }

    @ReactMethod
    fun pause() {
        nativePause()
    }

    @ReactMethod
    fun stop() {
        nativeStop()
        stopForegroundService()
    }

    @ReactMethod
    fun seekTo(positionMs: Long) {
        nativeSeek(positionMs)
    }

    @ReactMethod
    fun setBandParams(bandIndex: Int, frequencyHz: Float, gainDb: Float, qFactor: Float) {
        nativeSetBandParams(bandIndex, frequencyHz, gainDb, qFactor)
    }

    @ReactMethod
    fun getPlaybackStatus(promise: Promise) {
        val result = Arguments.createMap().apply {
            putDouble("positionMs", nativeGetPositionMs().toDouble())
            putDouble("durationMs", nativeGetDurationMs().toDouble())
            putBoolean("isPlaying", nativeIsPlaying())
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun syncAutoQueue(tracksJson: String) {
        AudioPlaybackService.updateAutoQueueFromJson(tracksJson)
    }

    @ReactMethod
    fun startForegroundService(
        title: String,
        artist: String,
        isPlaying: Boolean,
        durationMs: Double,
        positionMs: Double
    ) {
        val intent = Intent(reactApplicationContext, AudioPlaybackService::class.java).apply {
            putExtra("TITLE", title)
            putExtra("ARTIST", artist)
            putExtra("IS_PLAYING", isPlaying)
            putExtra("DURATION_MS", durationMs.toLong())
            putExtra("POSITION_MS", positionMs.toLong())
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactApplicationContext.startForegroundService(intent)
        } else {
            reactApplicationContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopForegroundService() {
        val intent = Intent(reactApplicationContext, AudioPlaybackService::class.java)
        reactApplicationContext.stopService(intent)
    }

    override fun invalidate() {
        super.invalidate()
        if (bluetoothReceiver != null) {
            try {
                reactApplicationContext.unregisterReceiver(bluetoothReceiver)
            } catch (_: Exception) {}
        }
    }
}

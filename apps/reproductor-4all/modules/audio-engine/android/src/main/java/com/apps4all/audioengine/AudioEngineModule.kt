package com.apps4all.audioengine

import android.app.Activity
import android.bluetooth.BluetoothDevice
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.MediaStore
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

class AudioEngineModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AudioEngine"
        private const val REQUEST_CODE_OPEN_DOCUMENT_TREE = 4401
        private val AUDIO_EXTENSIONS = setOf("mp3", "flac", "wav", "m4a", "aac", "ogg", "opus")
        var instance: AudioEngineModule? = null
        @Volatile
        var nativeLoaded: Boolean = false

        init {
            try {
                System.loadLibrary("audioengine")
                nativeLoaded = true
            } catch (t: Throwable) {
                android.util.Log.e("AudioEngineModule", "Failed to load libaudioengine.so", t)
                nativeLoaded = false
            }
        }
    }

    private val ioExecutor = Executors.newSingleThreadExecutor()
    private var pendingFolderPromise: Promise? = null

    private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode != REQUEST_CODE_OPEN_DOCUMENT_TREE) return
            val promise = pendingFolderPromise ?: return
            pendingFolderPromise = null

            if (resultCode != Activity.RESULT_OK || data?.data == null) {
                promise.resolve(null)
                return
            }

            val treeUri = data.data!!
            try {
                reactApplicationContext.contentResolver.takePersistableUriPermission(
                    treeUri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (_: Throwable) {
                // Non-persistable provider; still readable for this session
            }

            ioExecutor.execute {
                try {
                    val result = scanTreeUriRecursive(treeUri)
                    promise.resolve(result)
                } catch (e: Throwable) {
                    promise.reject("ERR_FOLDER_SCAN", e.message ?: "Error leyendo carpeta")
                }
            }
        }
    }

    init {
        instance = this
        reactContext.addActivityEventListener(activityEventListener)
        try {
            registerBluetoothReceiver()
        } catch (t: Throwable) {
            android.util.Log.w("AudioEngineModule", "Bluetooth receiver registration skipped", t)
        }
    }

    override fun getName(): String = NAME

    // JNI Native Declarations
    private external fun nativeOpenFile(path: String): Boolean
    private external fun nativeOpenFd(fd: Int, length: Long): Boolean
    private external fun nativePlay()
    private external fun nativePause()
    private external fun nativeStop()
    private external fun nativeSeek(positionMs: Long)
    private external fun nativeSetBandParams(bandIndex: Int, frequencyHz: Float, gainDb: Float, qFactor: Float)
    private external fun nativeSetVisualizerEnabled(enabled: Boolean)
    private external fun nativeSetNormalizationEnabled(enabled: Boolean)
    private external fun nativeSetMixerFadeSeconds(seconds: Int)
    private external fun nativeGetPositionMs(): Long
    private external fun nativeGetDurationMs(): Long
    private external fun nativeIsPlaying(): Boolean
    private external fun nativeIsTrackFinished(): Boolean
    private external fun nativeGetVisualizerData(): FloatArray

    fun isTrackFinishedNative(): Boolean {
        if (!nativeLoaded) return false
        return try {
            nativeIsTrackFinished()
        } catch (_: Throwable) {
            false
        }
    }

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
            reactApplicationContext.registerReceiver(bluetoothReceiver, filter, Context.RECEIVER_EXPORTED)
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
    fun addListener(eventName: String) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun openFile(path: String, promise: Promise) {
        if (!nativeLoaded) {
            promise.reject("ERR_NATIVE_LIB", "Motor de audio nativo no cargado.")
            return
        }
        try {
            val success = if (path.startsWith("content://")) {
                reactApplicationContext.contentResolver.openFileDescriptor(Uri.parse(path), "r")?.use { pfd ->
                    nativeOpenFd(pfd.fd, pfd.statSize)
                } ?: false
            } else {
                val decodedPath = if (path.startsWith("file://")) {
                    Uri.parse(path).path ?: Uri.decode(path.removePrefix("file://"))
                } else {
                    path
                }
                nativeOpenFile(decodedPath)
            }
            if (success) {
                val result = Arguments.createMap().apply {
                    putDouble("durationMs", nativeGetDurationMs().toDouble())
                }
                promise.resolve(result)
            } else {
                promise.reject("ERR_OPEN_FILE", "No se pudo decodificar el archivo local.")
            }
        } catch (e: Throwable) {
            promise.reject("ERR_EXCEPTION", e.message)
        }
    }

    @ReactMethod
    fun scanDeviceAudio(promise: Promise) {
        ioExecutor.execute {
            try {
                val tracks = Arguments.createArray()
                val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                } else {
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                }

                val projection = mutableListOf(
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.DISPLAY_NAME
                )
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    projection.add(MediaStore.Audio.Media.RELATIVE_PATH)
                } else {
                    @Suppress("DEPRECATION")
                    projection.add(MediaStore.Audio.Media.DATA)
                }

                val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 OR ${MediaStore.Audio.Media.DURATION} > 0"
                val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC"

                reactApplicationContext.contentResolver.query(
                    collection,
                    projection.toTypedArray(),
                    selection,
                    null,
                    sortOrder
                )?.use { cursor ->
                    val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                    val titleCol = cursor.getColumnIndex(MediaStore.Audio.Media.TITLE)
                    val artistCol = cursor.getColumnIndex(MediaStore.Audio.Media.ARTIST)
                    val durationCol = cursor.getColumnIndex(MediaStore.Audio.Media.DURATION)
                    val nameCol = cursor.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
                    val pathCol = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        cursor.getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH)
                    } else {
                        @Suppress("DEPRECATION")
                        cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
                    }

                    var count = 0
                    while (cursor.moveToNext() && count < 3000) {
                        val id = cursor.getLong(idCol)
                        val displayName = if (nameCol >= 0) cursor.getString(nameCol) ?: "" else ""
                        val ext = displayName.substringAfterLast('.', "mp3").lowercase()
                        if (displayName.isNotEmpty() && ext !in AUDIO_EXTENSIONS) continue

                        val rawTitle = if (titleCol >= 0) cursor.getString(titleCol) else null
                        val title = if (!rawTitle.isNullOrBlank()) rawTitle else displayName.substringBeforeLast('.')
                        val rawArtist = if (artistCol >= 0) cursor.getString(artistCol) else null
                        val duration = if (durationCol >= 0) cursor.getLong(durationCol) else 0L
                        val rawPath = if (pathCol >= 0) cursor.getString(pathCol) ?: "" else ""

                        val folder = extractFolderFromPath(rawPath)
                        val artist = if (!rawArtist.isNullOrBlank() && rawArtist != "<unknown>") rawArtist else folder
                        val contentUri = ContentUris.withAppendedId(collection, id).toString()

                        val map = Arguments.createMap().apply {
                            putString("id", "ms-$id")
                            putString("title", title.ifBlank { "Audio $id" })
                            putString("artist", artist)
                            putString("uri", contentUri)
                            putDouble("durationMs", duration.toDouble())
                            putString("format", normalizeFormat(ext))
                            putString("folder", folder)
                            putString("pathHint", rawPath)
                        }
                        tracks.pushMap(map)
                        count++
                    }
                }
                promise.resolve(tracks)
            } catch (e: Throwable) {
                promise.reject("ERR_SCAN_AUDIO", e.message ?: "Error escaneando MediaStore")
            }
        }
    }

    @ReactMethod
    fun pickAndScanFolder(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("ERR_NO_ACTIVITY", "Actividad no disponible")
            return
        }
        pendingFolderPromise?.resolve(null)
        pendingFolderPromise = promise
        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
                addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or
                    Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION or
                    Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
                )
            }
            activity.startActivityForResult(intent, REQUEST_CODE_OPEN_DOCUMENT_TREE)
        } catch (e: Throwable) {
            pendingFolderPromise = null
            promise.reject("ERR_PICKER", e.message ?: "No se pudo abrir el selector de carpetas")
        }
    }

    private fun scanTreeUriRecursive(treeUri: Uri): com.facebook.react.bridge.WritableMap {
        val rootDocId = DocumentsContract.getTreeDocumentId(treeUri)
        val rootFolderName = rootDocId.substringAfterLast(':').substringAfterLast('/').ifBlank { "Carpeta" }
        val tracks = Arguments.createArray()
        walkDocumentTree(treeUri, rootDocId, rootFolderName, tracks, 0)
        return Arguments.createMap().apply {
            putString("folderName", rootFolderName)
            putArray("tracks", tracks)
        }
    }

    private fun walkDocumentTree(
        treeUri: Uri,
        parentDocId: String,
        currentFolderName: String,
        outTracks: WritableArray,
        depth: Int
    ) {
        if (depth > 8 || outTracks.size() >= 3000) return
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocId)
        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE
        )
        reactApplicationContext.contentResolver.query(childrenUri, projection, null, null, null)?.use { cursor ->
            val idIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
            val nameIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
            val mimeIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE)

            while (cursor.moveToNext() && outTracks.size() < 3000) {
                val docId = if (idIdx >= 0) cursor.getString(idIdx) ?: continue else continue
                val displayName = if (nameIdx >= 0) cursor.getString(nameIdx) ?: "" else ""
                val mime = if (mimeIdx >= 0) cursor.getString(mimeIdx) ?: "" else ""

                if (mime == DocumentsContract.Document.MIME_TYPE_DIR) {
                    walkDocumentTree(
                        treeUri,
                        docId,
                        displayName.ifBlank { currentFolderName },
                        outTracks,
                        depth + 1
                    )
                } else {
                    val ext = displayName.substringAfterLast('.', "").lowercase()
                    val isAudio = mime.startsWith("audio/") || ext in AUDIO_EXTENSIONS
                    if (!isAudio) continue

                    val docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId).toString()
                    val cleanTitle = displayName.substringBeforeLast('.').ifBlank { displayName }
                    val map = Arguments.createMap().apply {
                        putString("id", "saf-${docId.hashCode()}-${outTracks.size()}")
                        putString("title", cleanTitle)
                        putString("artist", currentFolderName)
                        putString("uri", docUri)
                        putDouble("durationMs", 0.0)
                        putString("format", normalizeFormat(ext))
                        putString("folder", currentFolderName)
                        putString("pathHint", "$currentFolderName/$displayName")
                    }
                    outTracks.pushMap(map)
                }
            }
        }
    }

    private fun extractFolderFromPath(rawPath: String): String {
        val parts = rawPath.replace('\\', '/').split('/').filter { it.isNotBlank() }
        if (parts.isEmpty()) return "Music"
        // If rawPath is a full file path (API < 29), drop filename
        val last = parts.last()
        return if (last.contains('.') && parts.size >= 2) parts[parts.size - 2] else last
    }

    private fun normalizeFormat(ext: String): String {
        return when (ext.uppercase()) {
            "FLAC", "MP3", "M4A", "WAV", "AAC" -> ext.uppercase()
            else -> "MP3"
        }
    }

    @ReactMethod
    fun play() {
        if (!nativeLoaded) return
        try {
            nativePlay()
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun pause() {
        if (!nativeLoaded) return
        try {
            nativePause()
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun stop() {
        if (nativeLoaded) {
            try {
                nativeStop()
            } catch (_: Throwable) {}
        }
        stopForegroundService()
    }

    @ReactMethod
    fun seekTo(positionMs: Double) {
        if (!nativeLoaded) return
        try {
            nativeSeek(positionMs.toLong())
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun setBandParams(bandIndex: Int, frequencyHz: Double, gainDb: Double, qFactor: Double) {
        if (!nativeLoaded) return
        try {
            nativeSetBandParams(bandIndex, frequencyHz.toFloat(), gainDb.toFloat(), qFactor.toFloat())
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun setVisualizerEnabled(enabled: Boolean) {
        if (!nativeLoaded) return
        try {
            nativeSetVisualizerEnabled(enabled)
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun setNormalizationEnabled(enabled: Boolean) {
        if (!nativeLoaded) return
        try {
            nativeSetNormalizationEnabled(enabled)
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun setMixerFadeSeconds(seconds: Int) {
        if (!nativeLoaded) return
        try {
            nativeSetMixerFadeSeconds(seconds)
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun getPlaybackStatus(promise: Promise) {
        if (!nativeLoaded) {
            val result = Arguments.createMap().apply {
                putDouble("positionMs", 0.0)
                putDouble("durationMs", 0.0)
                putBoolean("isPlaying", false)
            }
            promise.resolve(result)
            return
        }
        try {
            val result = Arguments.createMap().apply {
                putDouble("positionMs", nativeGetPositionMs().toDouble())
                putDouble("durationMs", nativeGetDurationMs().toDouble())
                putBoolean("isPlaying", nativeIsPlaying())
                putBoolean("isFinished", nativeIsTrackFinished())
            }
            promise.resolve(result)
        } catch (e: Throwable) {
            promise.reject("ERR_STATUS", e.message)
        }
    }

    @ReactMethod
    fun getVisualizerData(promise: Promise) {
        if (!nativeLoaded) {
            val empty = Arguments.createMap().apply {
                putArray("spectrum", Arguments.createArray())
                putArray("waveform", Arguments.createArray())
            }
            promise.resolve(empty)
            return
        }
        try {
            val data = nativeGetVisualizerData()
            val spectrum = Arguments.createArray()
            val waveform = Arguments.createArray()
            val sLen = 20
            for (i in 0 until minOf(sLen, data.size)) {
                spectrum.pushDouble(data[i].toDouble())
            }
            for (i in sLen until data.size) {
                waveform.pushDouble(data[i].toDouble())
            }
            val result = Arguments.createMap().apply {
                putArray("spectrum", spectrum)
                putArray("waveform", waveform)
            }
            promise.resolve(result)
        } catch (e: Throwable) {
            promise.reject("ERR_VIS", e.message)
        }
    }

    @ReactMethod
    fun syncAutoQueue(tracksJson: String) {
        try {
            AudioPlaybackService.updateAutoQueueFromJson(tracksJson)
        } catch (_: Throwable) {}
    }

    @ReactMethod
    fun startForegroundService(
        title: String,
        artist: String,
        isPlaying: Boolean,
        durationMs: Double,
        positionMs: Double
    ) {
        try {
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
        } catch (t: Throwable) {
            android.util.Log.w("AudioEngineModule", "Foreground service start skipped", t)
        }
    }

    @ReactMethod
    fun stopForegroundService() {
        try {
            val intent = Intent(reactApplicationContext, AudioPlaybackService::class.java)
            reactApplicationContext.stopService(intent)
        } catch (_: Throwable) {}
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

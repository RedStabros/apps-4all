package com.apps4all.audioengine

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.MediaBrowserServiceCompat
import androidx.media.app.NotificationCompat.MediaStyle
import org.json.JSONArray

data class AutoQueueItem(
    val id: String,
    val title: String,
    val artist: String,
    val durationMs: Long,
    val folder: String = "Music"
)

class AudioPlaybackService : MediaBrowserServiceCompat() {

    companion object {
        const val CHANNEL_ID = "reproductor_4all_playback"
        const val NOTIFICATION_ID = 1044
        const val ACTION_PLAY = "com.apps4all.audioengine.ACTION_PLAY"
        const val ACTION_PAUSE = "com.apps4all.audioengine.ACTION_PAUSE"
        const val ACTION_NEXT = "com.apps4all.audioengine.ACTION_NEXT"
        const val ACTION_PREV = "com.apps4all.audioengine.ACTION_PREV"
        const val ACTION_STOP = "com.apps4all.audioengine.ACTION_STOP"

        private const val ROOT_ID = "ROOT_4ALL"
        private const val QUEUE_ID = "QUEUE_4ALL"
        private const val FOLDERS_ID = "FOLDERS_4ALL"
        private const val FOLDER_PREFIX = "FOLDER_4ALL:"

        // Official Android Auto Media Browser content style keys
        private const val CONTENT_STYLE_SUPPORTED = "android.media.browse.CONTENT_STYLE_SUPPORTED"
        private const val CONTENT_STYLE_PLAYABLE_HINT = "android.media.browse.CONTENT_STYLE_PLAYABLE_HINT"
        private const val CONTENT_STYLE_BROWSABLE_HINT = "android.media.browse.CONTENT_STYLE_BROWSABLE_HINT"
        private const val CONTENT_STYLE_LIST_ITEM_HINT_VALUE = 1

        @Volatile
        var instance: AudioPlaybackService? = null

        @Volatile
        var autoQueue: List<AutoQueueItem> = emptyList()

        fun updateAutoQueueFromJson(json: String) {
            try {
                val arr = JSONArray(json)
                val list = ArrayList<AutoQueueItem>(arr.length())
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    list.add(
                        AutoQueueItem(
                            id = obj.optString("id", "track-$i"),
                            title = obj.optString("title", "Audio"),
                            artist = obj.optString("artist", "Reproductor 4All"),
                            durationMs = obj.optLong("durationMs", 0L),
                            folder = obj.optString("folder", "Music")
                        )
                    )
                }
                autoQueue = list
                instance?.syncMediaSessionQueue()
                instance?.notifyChildrenChanged(ROOT_ID)
                instance?.notifyChildrenChanged(QUEUE_ID)
                instance?.notifyChildrenChanged(FOLDERS_ID)
            } catch (_: Exception) {
                // Keep previous queue on malformed JSON
            }
        }
    }

    private var mediaSession: MediaSessionCompat? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private var hasAudioFocus: Boolean = false
    private var lastPositionMs: Long = 0L
    private var serviceIsPlaying: Boolean = false
    private var trackEndDispatched: Boolean = false
    private var cachedAppArtwork: Bitmap? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private val endWatcher = object : Runnable {
        override fun run() {
            if (serviceIsPlaying) {
                val finished = AudioEngineModule.instance?.isTrackFinishedNative() == true
                if (finished && !trackEndDispatched) {
                    trackEndDispatched = true
                    AudioEngineModule.instance?.emitMediaButtonAction("TRACK_ENDED", null)
                }
                mainHandler.postDelayed(this, 450L)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        initMediaSession()
        initAudioFocus()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Reproducción de Audio 4All",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controles multimedia locales y Android Auto"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, "4AllAudioSession").apply {
            setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            )
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    AudioEngineModule.instance?.play()
                    AudioEngineModule.instance?.emitMediaButtonAction("PLAY", null)
                    updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, lastPositionMs)
                }

                override fun onPause() {
                    AudioEngineModule.instance?.pause()
                    AudioEngineModule.instance?.emitMediaButtonAction("PAUSE", null)
                    updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, lastPositionMs)
                }

                override fun onSkipToNext() {
                    AudioEngineModule.instance?.emitMediaButtonAction("NEXT", null)
                }

                override fun onSkipToPrevious() {
                    AudioEngineModule.instance?.emitMediaButtonAction("PREVIOUS", null)
                }

                override fun onPlayFromMediaId(mediaId: String?, extras: Bundle?) {
                    if (!mediaId.isNullOrEmpty()) {
                        AudioEngineModule.instance?.emitMediaButtonAction("PLAY_ID", mediaId)
                    }
                }

                override fun onStop() {
                    AudioEngineModule.instance?.stop()
                    AudioEngineModule.instance?.emitMediaButtonAction("PAUSE", null)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }

                override fun onSeekTo(pos: Long) {
                    lastPositionMs = pos
                    AudioEngineModule.instance?.seekTo(pos.toDouble())
                    updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, pos)
                }
            })
            isActive = true
        }
        mediaSession?.sessionToken?.let { token ->
            setSessionToken(token)
        }
    }

    // Android Auto MediaBrowserServiceCompat root with full media app UI hints
    override fun onGetRoot(
        clientPackageName: String,
        clientUid: Int,
        rootHints: Bundle?
    ): BrowserRoot {
        val extras = Bundle().apply {
            putBoolean(CONTENT_STYLE_SUPPORTED, true)
            putInt(CONTENT_STYLE_BROWSABLE_HINT, CONTENT_STYLE_LIST_ITEM_HINT_VALUE)
            putInt(CONTENT_STYLE_PLAYABLE_HINT, CONTENT_STYLE_LIST_ITEM_HINT_VALUE)
        }
        return BrowserRoot(ROOT_ID, extras)
    }

    // Android Auto MediaBrowserServiceCompat browse tree (Cola Actual + Carpetas)
    override fun onLoadChildren(
        parentId: String,
        result: Result<MutableList<MediaBrowserCompat.MediaItem>>
    ) {
        val items = mutableListOf<MediaBrowserCompat.MediaItem>()

        if (parentId == ROOT_ID) {
            val queueDesc = MediaDescriptionCompat.Builder()
                .setMediaId(QUEUE_ID)
                .setTitle("Cola Actual (${autoQueue.size})")
                .setSubtitle("Reproductor 4All")
                .build()
            items.add(
                MediaBrowserCompat.MediaItem(
                    queueDesc,
                    MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
                )
            )

            val folderCount = autoQueue.map { it.folder }.distinct().size
            val foldersDesc = MediaDescriptionCompat.Builder()
                .setMediaId(FOLDERS_ID)
                .setTitle("Carpetas ($folderCount)")
                .setSubtitle("Explorar por carpeta")
                .build()
            items.add(
                MediaBrowserCompat.MediaItem(
                    foldersDesc,
                    MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
                )
            )
        } else if (parentId == QUEUE_ID) {
            for (track in autoQueue) {
                val desc = MediaDescriptionCompat.Builder()
                    .setMediaId(track.id)
                    .setTitle(track.title)
                    .setSubtitle(track.artist)
                    .build()
                items.add(
                    MediaBrowserCompat.MediaItem(
                        desc,
                        MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
                    )
                )
            }
        } else if (parentId == FOLDERS_ID) {
            val grouped = autoQueue.groupBy { it.folder }
            for ((folderName, tracks) in grouped) {
                val desc = MediaDescriptionCompat.Builder()
                    .setMediaId("$FOLDER_PREFIX$folderName")
                    .setTitle(folderName)
                    .setSubtitle("${tracks.size} canciones")
                    .build()
                items.add(
                    MediaBrowserCompat.MediaItem(
                        desc,
                        MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
                    )
                )
            }
        } else if (parentId.startsWith(FOLDER_PREFIX)) {
            val targetFolder = parentId.removePrefix(FOLDER_PREFIX)
            for (track in autoQueue.filter { it.folder == targetFolder }) {
                val desc = MediaDescriptionCompat.Builder()
                    .setMediaId(track.id)
                    .setTitle(track.title)
                    .setSubtitle(track.artist)
                    .build()
                items.add(
                    MediaBrowserCompat.MediaItem(
                        desc,
                        MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
                    )
                )
            }
        }

        result.sendResult(items)
    }

    private fun syncMediaSessionQueue() {
        val queueItems = autoQueue.mapIndexed { index, track ->
            val desc = MediaDescriptionCompat.Builder()
                .setMediaId(track.id)
                .setTitle(track.title)
                .setSubtitle(track.artist)
                .build()
            MediaSessionCompat.QueueItem(desc, index.toLong())
        }
        mediaSession?.setQueue(queueItems)
        mediaSession?.setQueueTitle("Cola de Reproducción")
    }

    private fun getAppArtwork(): Bitmap? {
        if (cachedAppArtwork != null) return cachedAppArtwork
        return try {
            val drawable = packageManager.getApplicationIcon(packageName)
            val bmp = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            cachedAppArtwork = bmp
            bmp
        } catch (_: Throwable) {
            null
        }
    }

    private fun initAudioFocus() {
        audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()

            focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { focusChange ->
                    when (focusChange) {
                        AudioManager.AUDIOFOCUS_LOSS,
                        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                            hasAudioFocus = false
                            AudioEngineModule.instance?.pause()
                            AudioEngineModule.instance?.emitMediaButtonAction("PAUSE", null)
                            updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, lastPositionMs)
                        }
                        AudioManager.AUDIOFOCUS_GAIN -> {
                            hasAudioFocus = true
                            AudioEngineModule.instance?.play()
                            AudioEngineModule.instance?.emitMediaButtonAction("PLAY", null)
                            updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, lastPositionMs)
                        }
                    }
                }.build()
        }
    }

    fun requestAudioFocus(): Boolean {
        if (audioManager == null) return false
        if (hasAudioFocus) return true

        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            audioManager?.requestAudioFocus(focusRequest!!) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            audioManager?.requestAudioFocus(
                { focusChange ->
                    if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                        hasAudioFocus = false
                        AudioEngineModule.instance?.pause()
                        AudioEngineModule.instance?.emitMediaButtonAction("PAUSE", null)
                    }
                },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
        hasAudioFocus = granted
        return granted
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY -> {
                AudioEngineModule.instance?.play()
                AudioEngineModule.instance?.emitMediaButtonAction("PLAY", null)
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING, lastPositionMs)
                return START_STICKY
            }
            ACTION_PAUSE -> {
                AudioEngineModule.instance?.pause()
                AudioEngineModule.instance?.emitMediaButtonAction("PAUSE", null)
                updatePlaybackState(PlaybackStateCompat.STATE_PAUSED, lastPositionMs)
                return START_STICKY
            }
            ACTION_NEXT -> {
                AudioEngineModule.instance?.emitMediaButtonAction("NEXT", null)
                return START_STICKY
            }
            ACTION_PREV -> {
                AudioEngineModule.instance?.emitMediaButtonAction("PREVIOUS", null)
                return START_STICKY
            }
            ACTION_STOP -> {
                AudioEngineModule.instance?.stop()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        val title = intent?.getStringExtra("TITLE") ?: "Reproduciendo Audio"
        val artist = intent?.getStringExtra("ARTIST") ?: "Reproductor 4All"
        val isPlaying = intent?.getBooleanExtra("IS_PLAYING", true) ?: true
        val durationMs = intent?.getLongExtra("DURATION_MS", 0L) ?: 0L
        val positionMs = intent?.getLongExtra("POSITION_MS", 0L) ?: 0L
        lastPositionMs = positionMs

        val metadataBuilder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, "$title-$artist")
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, artist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Reproductor 4All")
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs)
        getAppArtwork()?.let { bmp ->
            metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, bmp)
            metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, bmp)
        }
        mediaSession?.setMetadata(metadataBuilder.build())
        syncMediaSessionQueue()

        val notification = buildMediaNotification(title, artist, isPlaying)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        serviceIsPlaying = isPlaying
        trackEndDispatched = false
        mainHandler.removeCallbacks(endWatcher)
        if (isPlaying) {
            mainHandler.postDelayed(endWatcher, 600L)
        }

        updatePlaybackState(
            if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
            positionMs
        )
        if (isPlaying) {
            requestAudioFocus()
        }

        try {
            ReproductorWidgetProvider.updateAllWidgets(this, title, artist, isPlaying)
        } catch (_: Throwable) {}

        return START_STICKY
    }

    private fun updatePlaybackState(state: Int, positionMs: Long) {
        val stateBuilder = PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_PLAY_PAUSE or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                PlaybackStateCompat.ACTION_SEEK_TO or
                PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID or
                PlaybackStateCompat.ACTION_STOP
            )
            .setState(state, positionMs, if (state == PlaybackStateCompat.STATE_PLAYING) 1.0f else 0.0f)

        mediaSession?.setPlaybackState(stateBuilder.build())
    }

    private fun buildMediaNotification(title: String, artist: String, isPlaying: Boolean): Notification {
        val sessionToken = mediaSession?.sessionToken

        val playPauseAction = if (isPlaying) {
            val pauseIntent = PendingIntent.getService(
                this, 1, Intent(this, AudioPlaybackService::class.java).apply { action = ACTION_PAUSE },
                PendingIntent.FLAG_IMMUTABLE
            )
            NotificationCompat.Action(android.R.drawable.ic_media_pause, "Pausar", pauseIntent)
        } else {
            val playIntent = PendingIntent.getService(
                this, 2, Intent(this, AudioPlaybackService::class.java).apply { action = ACTION_PLAY },
                PendingIntent.FLAG_IMMUTABLE
            )
            NotificationCompat.Action(android.R.drawable.ic_media_play, "Reproducir", playIntent)
        }

        val prevIntent = PendingIntent.getService(
            this, 3, Intent(this, AudioPlaybackService::class.java).apply { action = ACTION_PREV },
            PendingIntent.FLAG_IMMUTABLE
        )
        val nextIntent = PendingIntent.getService(
            this, 4, Intent(this, AudioPlaybackService::class.java).apply { action = ACTION_NEXT },
            PendingIntent.FLAG_IMMUTABLE
        )

        val style = MediaStyle()
            .setMediaSession(sessionToken)
            .setShowActionsInCompactView(0, 1, 2)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setStyle(style)
            .setOngoing(isPlaying)
            .addAction(android.R.drawable.ic_media_previous, "Anterior", prevIntent)
            .addAction(playPauseAction)
            .addAction(android.R.drawable.ic_media_next, "Siguiente", nextIntent)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceIsPlaying = false
        mainHandler.removeCallbacks(endWatcher)
        instance = null
        hasAudioFocus = false
        mediaSession?.release()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            audioManager?.abandonAudioFocusRequest(focusRequest!!)
        }
    }
}

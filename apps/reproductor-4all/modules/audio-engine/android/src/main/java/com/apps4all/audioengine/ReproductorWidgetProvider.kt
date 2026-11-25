package com.apps4all.audioengine

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class ReproductorWidgetProvider : AppWidgetProvider() {

    companion object {
        @Volatile
        private var lastTitle: String = "Reproductor 4All"
        @Volatile
        private var lastArtist: String = "Toca para abrir tu música"
        @Volatile
        private var lastIsPlaying: Boolean = false

        fun updateAllWidgets(
            context: Context,
            title: String,
            artist: String,
            isPlaying: Boolean
        ) {
            lastTitle = title
            lastArtist = artist
            lastIsPlaying = isPlaying

            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, ReproductorWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isEmpty()) return

            for (appWidgetId in ids) {
                updateWidget(context, manager, appWidgetId)
            }
        }

        private fun updateWidget(
            context: Context,
            manager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_reproductor_4all)
            views.setTextViewText(R.id.widget_track_title, lastTitle)
            views.setTextViewText(R.id.widget_track_artist, lastArtist)
            views.setImageViewResource(
                R.id.widget_btn_play_pause,
                if (lastIsPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
            )

            // Open app on container click
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val openPending = PendingIntent.getActivity(
                    context,
                    4400,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_info_container, openPending)
            }

            // Previous button
            val prevIntent = Intent(context, AudioPlaybackService::class.java).apply {
                action = AudioPlaybackService.ACTION_PREV
            }
            val prevPending = PendingIntent.getService(
                context,
                4401,
                prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_prev, prevPending)

            // Play / Pause button
            val toggleIntent = Intent(context, AudioPlaybackService::class.java).apply {
                action = if (lastIsPlaying) AudioPlaybackService.ACTION_PAUSE else AudioPlaybackService.ACTION_PLAY
            }
            val togglePending = PendingIntent.getService(
                context,
                4402,
                toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_play_pause, togglePending)

            // Next button
            val nextIntent = Intent(context, AudioPlaybackService::class.java).apply {
                action = AudioPlaybackService.ACTION_NEXT
            }
            val nextPending = PendingIntent.getService(
                context,
                4403,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPending)

            manager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
}


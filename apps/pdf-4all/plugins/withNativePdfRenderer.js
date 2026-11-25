const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withMainApplication,
  withAndroidManifest,
} = require("@expo/config-plugins");

const PDF_RENDERER_MODULE_KT = `package com.apps4all.pdf4all

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

class PdfRendererModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PdfRenderer4All"

    @ReactMethod
    fun getInitialPdfIntent(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            val intent = activity?.intent
            val action = intent?.action
            val data: Uri? = if (action == Intent.ACTION_VIEW) intent.data else null

            if (data == null) {
                promise.resolve(null)
                return
            }

            var displayName = "Documento.pdf"
            try {
                reactApplicationContext.contentResolver.query(data, null, null, null, null)?.use { cursor ->
                    val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIdx >= 0 && cursor.moveToFirst()) {
                        val found = cursor.getString(nameIdx)
                        if (!found.isNullOrBlank()) displayName = found
                    }
                }
            } catch (_: Exception) {
                data.lastPathSegment?.let { seg ->
                    if (seg.isNotBlank()) displayName = seg
                }
            }

            // Consume intent so returning to the screen doesn't re-open it endlessly
            activity?.intent = Intent(Intent.ACTION_MAIN)

            val result = Arguments.createMap().apply {
                putString("uri", data.toString())
                putString("name", displayName)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun renderPdfPages(fileUri: String, maxPages: Int, promise: Promise) {
        Thread {
            var pfd: ParcelFileDescriptor? = null
            var renderer: PdfRenderer? = null
            try {
                val ctx = reactApplicationContext
                pfd = if (fileUri.startsWith("content://")) {
                    ctx.contentResolver.openFileDescriptor(Uri.parse(fileUri), "r")
                } else {
                    val cleanPath = fileUri.removePrefix("file://")
                    ParcelFileDescriptor.open(File(cleanPath), ParcelFileDescriptor.MODE_READ_ONLY)
                }

                if (pfd == null) {
                    promise.reject("ERR_OPEN", "No se pudo abrir el archivo PDF.")
                    return@Thread
                }

                renderer = PdfRenderer(pfd)
                val totalPages = renderer.pageCount
                val limit = if (maxPages > 0) minOf(totalPages, maxPages) else totalPages

                val outDir = File(ctx.cacheDir, "pdf_view_\${System.currentTimeMillis()}")
                outDir.mkdirs()

                val pagesArray = Arguments.createArray()
                for (i in 0 until limit) {
                    val page = renderer.openPage(i)
                    try {
                        val scale = 2.0f
                        val width = maxOf(1, minOf(1800, (page.width * scale).toInt()))
                        val height = maxOf(1, (page.height * (width.toFloat() / page.width)).toInt())
                        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bitmap)
                        canvas.drawColor(Color.WHITE)
                        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

                        val outFile = File(outDir, "page_\$i.jpg")
                        FileOutputStream(outFile).use { fos ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 88, fos)
                        }
                        bitmap.recycle()
                        pagesArray.pushString("file://" + outFile.absolutePath)
                    } finally {
                        page.close()
                    }
                }

                val result = Arguments.createMap().apply {
                    putInt("pageCount", totalPages)
                    putInt("renderedCount", limit)
                    putArray("pages", pagesArray)
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("ERR_RENDER_PDF", e.message ?: "Error al renderizar PDF")
            } finally {
                try { renderer?.close() } catch (_: Exception) {}
                try { pfd?.close() } catch (_: Exception) {}
            }
        }.start()
    }
}
`;

const PDF_RENDERER_PACKAGE_KT = `package com.apps4all.pdf4all

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PdfRendererPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PdfRendererModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

module.exports = function withNativePdfRenderer(config) {
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const pkgDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "apps4all",
        "pdf4all",
      );
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(pkgDir, "PdfRendererModule.kt"),
        PDF_RENDERER_MODULE_KT,
        "utf8",
      );
      fs.writeFileSync(
        path.join(pkgDir, "PdfRendererPackage.kt"),
        PDF_RENDERER_PACKAGE_KT,
        "utf8",
      );
      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("PdfRendererPackage()")) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n              add(PdfRendererPackage())`,
      );
    }
    config.modResults.contents = contents;
    return config;
  });

  // Registrar PDF 4All en el selector "Abrir con..." de Android para archivos application/pdf
  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const mainActivity = app?.activity?.find(
      (a) =>
        a.$?.["android:name"] === ".MainActivity" ||
        a.$?.["android:name"]?.endsWith(".MainActivity"),
    );

    if (mainActivity) {
      if (!mainActivity["intent-filter"]) {
        mainActivity["intent-filter"] = [];
      }

      const alreadyHasPdfView = mainActivity["intent-filter"].some((filter) =>
        filter.data?.some((d) => d.$?.["android:mimeType"] === "application/pdf"),
      );

      if (!alreadyHasPdfView) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: [
            { $: { "android:scheme": "content", "android:mimeType": "application/pdf" } },
            { $: { "android:scheme": "file", "android:mimeType": "application/pdf" } },
          ],
        });
      }
    }

    return config;
  });

  return config;
};


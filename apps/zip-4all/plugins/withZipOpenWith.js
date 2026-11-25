const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withMainApplication,
  withAndroidManifest,
} = require("@expo/config-plugins");

const ZIP_INTENT_MODULE_KT = `package com.apps4all.zip4all

import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

class ZipIntentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ZipIntent4All"

    @ReactMethod
    fun getInitialZipIntent(promise: Promise) {
        Thread {
            try {
                val activity = reactApplicationContext.currentActivity
                val intent = activity?.intent
                val data: Uri? = if (intent?.action == Intent.ACTION_VIEW) intent.data else null

                if (data == null) {
                    promise.resolve(null)
                    return@Thread
                }

                var displayName = "archivo.zip"
                try {
                    reactApplicationContext.contentResolver.query(data, null, null, null, null)?.use { cursor ->
                        val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (idx >= 0 && cursor.moveToFirst()) {
                            val found = cursor.getString(idx)
                            if (!found.isNullOrBlank()) displayName = found
                        }
                    }
                } catch (_: Exception) {
                    data.lastPathSegment?.let { seg ->
                        if (seg.isNotBlank()) displayName = seg
                    }
                }

                activity?.runOnUiThread {
                    activity.intent = Intent(Intent.ACTION_MAIN)
                }

                val safeName = displayName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
                val outFile = File(reactApplicationContext.cacheDir, "open_\${System.currentTimeMillis()}_\$safeName")
                reactApplicationContext.contentResolver.openInputStream(data)?.use { input ->
                    FileOutputStream(outFile).use { output ->
                        input.copyTo(output)
                    }
                } ?: run {
                    promise.resolve(null)
                    return@Thread
                }

                val result = Arguments.createMap().apply {
                    putString("uri", outFile.absolutePath)
                    putString("name", displayName)
                }
                promise.resolve(result)
            } catch (_: Exception) {
                promise.resolve(null)
            }
        }.start()
    }
}
`;

const ZIP_INTENT_PACKAGE_KT = `package com.apps4all.zip4all

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ZipIntentPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ZipIntentModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

const ZIP_MIMES = [
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
];

module.exports = function withZipOpenWith(config) {
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
        "zip4all",
      );
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(pkgDir, "ZipIntentModule.kt"),
        ZIP_INTENT_MODULE_KT,
        "utf8",
      );
      fs.writeFileSync(
        path.join(pkgDir, "ZipIntentPackage.kt"),
        ZIP_INTENT_PACKAGE_KT,
        "utf8",
      );
      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("ZipIntentPackage()")) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n              add(ZipIntentPackage())`,
      );
    }
    config.modResults.contents = contents;
    return config;
  });

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

      const alreadyHasZip = mainActivity["intent-filter"].some((filter) =>
        filter.data?.some((d) => d.$?.["android:mimeType"] === "application/zip"),
      );

      if (!alreadyHasZip) {
        const dataEntries = [];
        for (const mime of ZIP_MIMES) {
          dataEntries.push({ $: { "android:scheme": "content", "android:mimeType": mime } });
          dataEntries.push({ $: { "android:scheme": "file", "android:mimeType": mime } });
        }

        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: dataEntries,
        });
      }
    }

    return config;
  });

  return config;
};


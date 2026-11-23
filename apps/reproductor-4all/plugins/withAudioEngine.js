const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withDangerousMod,
  withSettingsGradle,
  withAppBuildGradle,
} = require("@expo/config-plugins");

module.exports = function withAudioEngine(config) {
  // 1. AndroidManifest: Registrar AudioPlaybackService como MediaBrowserServiceCompat (Android Auto)
  // y Foreground Service de tipo mediaPlayback + meta-data de Android Auto
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication) {
      if (!mainApplication.service) {
        mainApplication.service = [];
      }

      const serviceIndex = mainApplication.service.findIndex(
        (s) =>
          s.$?.["android:name"] ===
          "com.apps4all.audioengine.AudioPlaybackService",
      );

      const serviceEntry = {
        $: {
          "android:name": "com.apps4all.audioengine.AudioPlaybackService",
          "android:foregroundServiceType": "mediaPlayback",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.media.browse.MediaBrowserService",
                },
              },
            ],
          },
        ],
      };

      if (serviceIndex >= 0) {
        mainApplication.service[serviceIndex] = serviceEntry;
      } else {
        mainApplication.service.push(serviceEntry);
      }

      // Meta-data oficial para Android Auto (Media)
      if (!mainApplication["meta-data"]) {
        mainApplication["meta-data"] = [];
      }
      const hasAutoMeta = mainApplication["meta-data"].some(
        (m) => m.$?.["android:name"] === "com.google.android.gms.car.application",
      );
      if (!hasAutoMeta) {
        mainApplication["meta-data"].push({
          $: {
            "android:name": "com.google.android.gms.car.application",
            "android:resource": "@xml/automotive_app_desc",
          },
        });
      }
    }

    const permissions = config.modResults.manifest["uses-permission"] || [];
    permissions.forEach((perm) => {
      if (perm.$?.["android:name"] === "android.permission.BLUETOOTH_CONNECT") {
        perm.$["android:usesPermissionFlags"] = "neverForLocation";
      }
    });

    return config;
  });

  // 2. Generar res/xml/automotive_app_desc.xml para Android Auto
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml",
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      const xmlFile = path.join(xmlDir, "automotive_app_desc.xml");
      fs.writeFileSync(
        xmlFile,
        `<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n    <uses name="media"/>\n</automotiveApp>\n`,
        "utf8",
      );
      return config;
    },
  ]);

  // 3. Settings Gradle: Incluir el módulo C++/Kotlin local
  config = withSettingsGradle(config, (config) => {
    if (!config.modResults.contents.includes("':audio-engine'")) {
      config.modResults.contents += `\ninclude ':audio-engine'\nproject(':audio-engine').projectDir = new File(rootProject.projectDir, '../modules/audio-engine/android')\n`;
    }
    return config;
  });

  // 4. App Build Gradle: Vincular la dependencia al compilador de Android
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("project(':audio-engine')")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation project(':audio-engine')`,
      );
    }
    return config;
  });

  return config;
};

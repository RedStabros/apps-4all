const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Expo Config Plugin: withReleaseSigning
 * Inyecta automÃ¡ticamente el bloque de firmas de producciÃ³n (signingConfigs.release)
 * y la regla de fallo estricta en android/app/build.gradle durante "expo prebuild".
 */
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Inyectar bloque signingConfigs.release si no existe
    if (!contents.includes("signingConfigs {")) {
      // Si no hay bloque signingConfigs, crearlo antes de buildTypes
      const signingConfigsBlock = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            def keystorePath = System.getenv("RELEASE_KEYSTORE_PATH") ?: project.findProperty("RELEASE_KEYSTORE_PATH")
            def keystoreAlias = System.getenv("RELEASE_KEY_ALIAS") ?: project.findProperty("RELEASE_KEY_ALIAS")
            def keystorePassword = System.getenv("RELEASE_STORE_PASSWORD") ?: project.findProperty("RELEASE_STORE_PASSWORD")
            def releaseKeyPassword = System.getenv("RELEASE_KEY_PASSWORD") ?: project.findProperty("RELEASE_KEY_PASSWORD")

            if (keystorePath && file(keystorePath).exists()) {
                storeFile file(keystorePath)
                storePassword keystorePassword
                keyAlias keystoreAlias
                keyPassword releaseKeyPassword
            } else {
                println "ALERTA DE SEGURIDAD 4ALL: Credenciales de firma de release no localizadas en el entorno."
            }
        }
    }
`;
      contents = contents.replace(/android\s*\{/, `android {\n${signingConfigsBlock}`);
    } else if (!contents.includes("release {") || !contents.includes("RELEASE_KEYSTORE_PATH")) {
      // Inyectar release dentro de signingConfigs existente
      const releaseBlock = `
        release {
            def keystorePath = System.getenv("RELEASE_KEYSTORE_PATH") ?: project.findProperty("RELEASE_KEYSTORE_PATH")
            def keystoreAlias = System.getenv("RELEASE_KEY_ALIAS") ?: project.findProperty("RELEASE_KEY_ALIAS")
            def keystorePassword = System.getenv("RELEASE_STORE_PASSWORD") ?: project.findProperty("RELEASE_STORE_PASSWORD")
            def releaseKeyPassword = System.getenv("RELEASE_KEY_PASSWORD") ?: project.findProperty("RELEASE_KEY_PASSWORD")

            if (keystorePath && file(keystorePath).exists()) {
                storeFile file(keystorePath)
                storePassword keystorePassword
                keyAlias keystoreAlias
                keyPassword releaseKeyPassword
            } else {
                println "ALERTA DE SEGURIDAD 4ALL: Credenciales de firma de release no localizadas en el entorno."
            }
        }
`;
      contents = contents.replace(/signingConfigs\s*\{/, `signingConfigs {\n${releaseBlock}`);
    }

    // 2. Asegurar que buildTypes.release utilice signingConfigs.release
    if (contents.includes("buildTypes {") && contents.includes("release {")) {
      if (!contents.includes("signingConfig signingConfigs.release")) {
        contents = contents.replace(
          /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
          "$1signingConfig signingConfigs.release"
        );
      }
    }

    // 3. Inyectar regla de fallo estricta en compilaciones de producciÃ³n
    const safetyCheck = `
// REGLA DE SEGURIDAD 4ALL: Fallo estricto si se intenta compilar release sin keystore de producciÃ³n
gradle.taskGraph.whenReady { taskGraph ->
    if (taskGraph.hasTask(":app:assembleRelease") || taskGraph.hasTask(":app:bundleRelease")) {
        def keystorePath = System.getenv("RELEASE_KEYSTORE_PATH") ?: project.findProperty("RELEASE_KEYSTORE_PATH")
        if (!keystorePath || !file(keystorePath).exists()) {
            throw new GradleException("ERROR CRÃTICO DE SEGURIDAD: Intentando compilar release sin RELEASE_KEYSTORE_PATH vÃ¡lido.")
        }
    }
}
`;
    if (!contents.includes("REGLA DE SEGURIDAD 4ALL")) {
      contents += `\n${safetyCheck}\n`;
    }

    config.modResults.contents = contents;
    return config;
  });
};

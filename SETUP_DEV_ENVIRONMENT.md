# Guía de Instalación del Entorno de Desarrollo — Para Todos (4All) 🛠️

> **Propósito:** Si clonas este monorepositorio (`https://github.com/RedStabros/apps-4all.git`) en una PC nueva o limpia, sigue esta guía (o indícale a tu Agente IA que lea y ejecute este archivo) para dejar todo listo para desarrollar, validar bundles y compilar APKs firmados localmente.

---

## 1. Requisitos Base (Obligatorios)

| Herramienta | Versión Verificada | Uso en el Monorepo |
| :--- | :--- | :--- |
| **Node.js (LTS)** | `v22.x` (probado en `v22.22.0`) | Metro Bundler, Expo CLI, Astro Web Portal y scripts de auditoría |
| **pnpm** | `9.x` (probado en `9.5.0`) | Gestor de paquetes del monorepo (`pnpm-workspace.yaml`) |
| **Git** | `2.46+` | Control de versiones |
| **Java JDK (LTS)** | **JDK 21** (probado en `21.0.4 LTS`) | Gradle Android builds y `keytool` para firmar APKs/AABs |

> ⚠️ **Regla crítica de `pnpm`:** El archivo raíz `.npmrc` contiene `node-linker=hoisted`. **NO lo borres.** Sin `hoisted`, Metro Bundler en Expo SDK 57 + NativeWind v4 falla al resolver `react-native-css-interop/jsx-runtime`.

### Instalación rápida de dependencias JS tras clonar
```powershell
git clone https://github.com/RedStabros/apps-4all.git
cd apps-4all
pnpm install
```

---

## 2. Entorno Android Nativo (Sin necesidad de instalar Android Studio completo)

Para compilar los APKs/AABs localmente (incluido el motor C++ Google Oboe de `Reproductor 4All`), **no necesitas instalar el IDE pesado de Android Studio**. Basta con las **Android Command-Line Tools oficiales de Google** (~2.5 GB con NDK/CMake).

### Paquetes SDK requeridos
- `platform-tools` (incluye `adb`)
- `platforms;android-35` (Android 15 — requerido por `Reproductor 4All` y Expo SDK 57)
- `build-tools;35.0.0`
- `ndk;27.1.12297006` (requerido para compilar C++ Google Oboe en `apps/reproductor-4all`)
- `cmake;3.22.1` (requerido por `apps/reproductor-4all/modules/audio-engine/CMakeLists.txt`)

### Script de instalación automática en Windows (PowerShell)
*(Cambia `$sdkRoot` si prefieres `C:\Android\Sdk` en lugar de `D:\Android\Sdk`)*:

```powershell
$sdkRoot = "D:\Android\Sdk"
$cmdlineLatest = "$sdkRoot\cmdline-tools\latest"
New-Item -ItemType Directory -Force -Path "$sdkRoot\cmdline-tools" | Out-Null

# 1. Descargar y descomprimir Command-Line Tools oficiales de Google
$zip = "$sdkRoot\cmdline-tools.zip"
Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath "$sdkRoot\tmp_extract" -Force
Move-Item "$sdkRoot\tmp_extract\cmdline-tools" $cmdlineLatest
Remove-Item -Recurse -Force "$sdkRoot\tmp_extract", $zip

# 2. Configurar variables de entorno de usuario
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$toAdd = @("$sdkRoot\platform-tools", "$cmdlineLatest\bin")
foreach ($p in $toAdd) { if ($userPath -notlike "*$p*") { $userPath = "$userPath;$p" } }
[Environment]::SetEnvironmentVariable("Path", $userPath.Trim(";"), "User")

# 3. Aceptar licencias e instalar paquetes SDK + NDK + CMake
$sdkManager = "$cmdlineLatest\bin\sdkmanager.bat"
(1..30 | ForEach-Object { "y" }) -join "`n" | & $sdkManager --sdk_root=$sdkRoot --licenses
& $sdkManager --sdk_root=$sdkRoot "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006" "cmake;3.22.1"
```

### Verificación rápida del entorno (para el usuario o Agente IA)
```powershell
node -v           # >= v22.x
pnpm -v           # >= 9.x
java -version     # JDK 17 o 21 LTS
adb --version     # Android Debug Bridge desde ANDROID_HOME\platform-tools
echo $env:ANDROID_HOME
```

---

## 3. Firmas Privadas de Producción (`release.keystore`)

> 🔐 **Seguridad:** Las llaves de firma **NUNCA** se suben a GitHub (`.gitignore` bloquea `*.keystore`, `*.jks` y `*.env.signing`).

- **En una PC nueva (si ya las generaste antes):** copia tu respaldo privado de la carpeta `4All_Keystores_PRIVADO\` fuera del repositorio (ej. `D:\APP_development\4All_Keystores_PRIVADO\`).
- **Si es la primera vez generando firmas:** ejecuta el script incluido en el repo:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\generate-keystores.ps1
  ```
- **Verificar firma de un APK compilado:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\verify-keystore.ps1 -ApkPath "<ruta-al-apk>"
  ```

---

## 4. Comandos Clave de Validación y Compilación

### A. Validar bundle JS/Hermes de cualquier app (sin compilar APK)
```powershell
cd apps/<nombre-app>
npx expo export --platform android --output-dir .expo-test-dist --clear
Remove-Item -Recurse -Force .expo-test-dist
```

### B. Compilar APK nativo local con Gradle
```powershell
cd apps/<nombre-app>
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
# El APK queda en: android\app\build\outputs\apk\release\app-release.apk
```

### C. Compilar Portal Web Astro (`apps/web`)
```powershell
cd apps/web
pnpm build
```

---

## 5. Notas Especiales para Agentes IA trabajando en este Repo

1. **Leer siempre `AGENTS.md` primero:** 100% Offline-First, escala Zinc (`zinc-50` / `zinc-950`), 3 acentos estrictos (Azul/Turquesa/Ámbar), cero texto hardcodeado (`packages/i18n/locales/*.json` en 26 idiomas), cero SDKs de analítica/telemetría y licencia **PolyForm Noncommercial 1.0.0** (solo usar dependencias MIT/ISC/Apache-2.0/BSD/zlib/CC-BY para no bloquear ventas comerciales futuras del autor).
2. **Expo SDK 57 (`expo-file-system`):** usar siempre `import * as FileSystem from "expo-file-system/legacy"` cuando se utilicen `documentDirectory`, `cacheDirectory`, `readAsStringAsync`, `writeAsStringAsync`, `moveAsync` o `deleteAsync`.
3. **Android Auto (`apps/reproductor-4all`):** el servicio `AudioPlaybackService.kt` hereda de `MediaBrowserServiceCompat` y el plugin `plugins/withAudioEngine.js` inyecta `@xml/automotive_app_desc`. Para probar APKs instalados por fuera de Play Store en un carro, activar *"Fuentes desconocidas"* en los Ajustes de desarrollador de Android Auto en el teléfono.
4. **iOS (futuro en macOS):** requiere macOS + Xcode 16+ + CocoaPods (`pod install`). Todas las apps ya incluyen `ios.infoPlist`, iconos opacos `1024×1024` y guardas `Platform.OS`.


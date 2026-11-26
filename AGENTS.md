# Para Todos (4All) Ecosystem - AI Agent Rules

Welcome. As an AI Agent working on this monorepo, you must strictly adhere to the following rules at all times. These are non-negotiable architectural and philosophical constraints.

## 1. Core Philosophy
- **Offline-First (Local First):** The core functionality of ALL apps MUST work perfectly without an internet connection. Heavy processing must be done locally on the device CPU. 
- **Privacy-Centric:** No hidden tracking. Telemetry and syncing are strictly opt-in via our Supabase client (`packages/supabase-client`). Do not add third-party analytics SDKs (e.g., Firebase, Google Analytics).
- **No Push Notifications:** Do not implement background push notifications. If a timer or alarm is needed, use local device notifications only.
- **Lightweight:** Avoid heavy third-party npm packages. Prioritize native React Native/Expo APIs or highly optimized local solutions.

## 2. UI/UX Design System
- **Framework:** Use Tailwind CSS via NativeWind v4 across all apps and the Astro web portal.
- **Base Colors:** Stick strictly to the Zinc scale (`zinc-50` for light mode, `zinc-950` for dark mode backgrounds).
- **Dark Mode:** Dynamic Dark/Light mode support is mandatory. Always use NativeWind's `dark:` modifier (e.g., `bg-white dark:bg-zinc-900`).
- **Accent Colors (3 Categories):** Never hardcode arbitrary hex colors. Apps fall into 3 categories with specific semantic accents:
  - *Productivity:* Light `#2563EB` (Blue 600), Dark `#60A5FA` (Blue 400).
  - *Utilities:* Light `#0F766E` (Teal 700), Dark `#2DD4BF` (Teal 400).
  - *Time & Math:* Light `#B45309` (Amber 700), Dark `#FBBF24` (Amber 400).

## 3. Localization (i18n)
- **Zero Hardcoded Text:** Never write hardcoded strings in the UI. Every string must be mapped using `useTranslation` from `react-i18next`.
- **Shared Dictionary:** All translations live in `packages/i18n/locales/*.json`. The ecosystem officially supports 17 languages.

## 4. Architecture
- **Monorepo:** We use Turborepo. Shared UI components go in `packages/ui-components`. Shared backend connections go in `packages/supabase-client`.
- **Apps:** Each app in the `apps/` directory must be an independent Expo project with its own unique `app.json` package name. 
- **TypeScript:** Write clean, strictly typed TypeScript code. Avoid `any`.

## 5. Licensing & IP
- **License:** The ecosystem operates under the **PolyForm Noncommercial License 1.0.0**.
- **Constraint:** Do not generate or suggest inserting standard open-source licenses (MIT, Apache, GPL). The code is public for portfolio display but strictly prohibits commercial use or unauthorized redistribution for profit.

## 6. Technical Gotchas, Native Architecture & AI Handoff Context
Lessons learned from real-device Android 13–16 (`targetSdk 36`) QA and production APK builds. Follow these strictly to avoid regressions:

### React Native 0.86 / Expo SDK 57 (New Architecture / Bridgeless)
- **Audio Library:** NEVER use legacy `expo-av` (crashes silently on launch under RN 0.86 New Architecture). Use `expo-audio@~57.0.5` (`enfoque-4all`, `notas-voz-4all`). In `expo-audio`, `player.playbackRate` is read-only — use `player.setPlaybackRate(speed, "high")` and only call `seekTo()` after `status.isLoaded`.
- **Native `@ReactMethod` Types:** In RN 0.86 Bridgeless Interop, NEVER use `Long` or `Float` as `@ReactMethod` parameter types (causes silent startup crash: `Unsupported param type`). Always accept `Double` (or `Int`/`String`/`Boolean`/`Promise`) and convert internally in Kotlin. Also always declare `@ReactMethod fun addListener(eventName: String)` and `@ReactMethod fun removeListeners(count: Int)` on modules used with `NativeEventEmitter`.
- **Unified Vector Icons:** Use `lucide-react-native` across all 15 apps and `packages/ui-components`. Do NOT use generic UI emojis (country flag emojis in `festivos-4all` are the only intentional exception).
- **Android Edge-to-Edge & Keyboard Safety:** Always use `SafeAreaView edges={["top", "bottom"]}`, `KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}` on main screens, and generous bottom padding (`pb-14` or `useSafeAreaInsets().bottom + 24`) inside bottom-sheet `Modal`s so controls never overlap Android's 3-button navigation bar.

### `reproductor-4all` (C++20 + Google Oboe + Android Auto + Home Widget)
- **Oboe Stream Configuration:** Always use `oboe::PerformanceMode::PowerSaving` + `oboe::SharingMode::Shared` + `Usage::Media` + `ContentType::Music` with a generous ring buffer (`384,000` stereo floats ≈ 2s). NEVER use `LowLatency` or `Exclusive` — they cause audio stutters when opening the Camera/Maps/Android Auto and fail to re-open on sample-rate changes.
- **AudioFocus Singleton:** In `AudioPlaybackService.kt`, create ONE `AudioFocusRequest` in `initAudioFocus()` and track `hasAudioFocus`. Creating a new `AudioFocusRequest` on every track change causes Android to fire `AUDIOFOCUS_LOSS` on the previous request and self-pause playback immediately.
- **Background Auto-Advance:** JS `setInterval` is suspended when the phone is locked or connected to Android Auto. Track completion MUST be driven natively via `AMediaDecoder::isFinished()` → `AudioEngine::isTrackFinished()` → `AudioPlaybackService` `endWatcher` emitting `TRACK_ENDED`.
- **Real-Time PCM Visualizer & Battery:** Gate both C++ FFT (`mVisualizerEnabled`) and JS polling behind `AppState === "active"` and `isPlaying` (0% background CPU/battery).
- **Parametric EQ Safety:** Protect Biquad coefficient updates with `std::mutex` (`try_to_lock` on audio thread), guard against `NaN`/`Inf` in `processSample`, and apply a `tanh` soft limiter.
- **Android Auto & Widget:** `AudioPlaybackService` implements `MediaBrowserServiceCompat` (`CONTENT_STYLE` hints, `Cola Actual` + `Carpetas` tabs, `mediaSession.setQueue(...)`, app icon artwork). `ReproductorWidgetProvider` provides the native 4×1 home-screen widget. Sideloaded APKs require Android Auto Developer Mode → *Unknown sources* until published on Google Play.

### Android 13–16 Scoped Storage & Native "Open With"
- **Gallery Image Saving (`qr-4all`, `lupa-4all`, `fotos-ligeras-4all`):** Use `MediaLibrary.requestPermissionsAsync(true)` (`writeOnly = true`) only when saving — never request full read permissions before picking.
- **User-Visible Files (`zip-4all`):** Save to user-chosen visible folders (`Downloads`/`Documents`) via `FileSystem.StorageAccessFramework` (`expo-file-system/legacy`).
- **Audio Scanning (`reproductor-4all`):** Uses native Kotlin `MediaStore.Audio` + recursive `ACTION_OPEN_DOCUMENT_TREE` (SAF folder + subfolders with `takePersistableUriPermission`) + C++ `AMediaDecoder::openFd` for direct `content://` playback.
- **Native "Open With" (`ACTION_VIEW`):** Implemented via zero-KB Expo config plugins in `pdf-4all` (`withNativePdfRenderer.js` + Android `PdfRenderer`), `docs-4all` (`withDocsOpenWith.js`), and `zip-4all` (`withZipOpenWith.js`). When modifying any config plugin, delete `apps/<slug>/android` before rebuilding so `expo prebuild` regenerates cleanly.

### Windows Build Pipeline & Handoff Requirements
- **Monorepo Hoisting:** `.npmrc` MUST keep `node-linker=hoisted` and `virtual-store-dir-max-length=40` to avoid Windows 260-char `MAX_PATH` errors in CMake/Ninja/Prefab.
- **PowerShell UTF-8 Safety:** On Windows PowerShell 5.1, NEVER write Gradle/TSX/JSON files with `Set-Content -Encoding UTF8` (writes UTF-8 BOM or ANSI mojibake). Use Node.js `fs.writeFileSync(..., "utf8")` or `[System.IO.File]::WriteAllText(..., [System.Text.UTF8Encoding]::new($false))`.
- **Web Portal Build:** Run `node ../../node_modules/astro/bin/astro.mjs build` inside `apps/web` (or `pnpm --filter` with hoisted binary). Live portal: `https://apps-4all.pages.dev/` (auto-deployed via Cloudflare Pages from `RedStabros/apps-4all` `main`). Keep `apps/web/public/versions.json` and `apps/web/src/data/appsData.ts` synced with the active GitHub Release tag.
- **Signing Keystores (NOT in Git):** The 15 RSA-4096 production keystores and `.env.signing` live outside Git (`D:\APP_development\4All_Keystores_PRIVADO\`). Copy this folder securely when moving to another PC, and update default paths in `scripts/build-apk.ps1` if the drive letter differs.
- **Current Milestone:** All 15 apps are bumped to `v1.0.1` (`versionCode: 2`), verified with `apksigner` (`15/15`), and ready for final real-device testing → GitHub Release `v1.0.1` → Google Play `.aab` publication (to remove Play Protect sideload warnings).


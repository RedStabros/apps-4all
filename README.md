# Para Todos (4All) Ecosystem

**15 lightweight, 100% offline, privacy-first Android apps — built for everyday life with zero ads, zero subscriptions, and zero tracking.**

🌐 **Official Web Portal:** [https://apps-4all.pages.dev/](https://apps-4all.pages.dev/)  
📦 **Releases & Direct APKs:** [GitHub Releases](https://github.com/RedStabros/apps-4all/releases)  
⚖️ **License:** [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

---

## Why 4All Exists

Modern mobile app stores have turned the simplest everyday tools — a music player, a QR scanner, a PDF viewer, a voice recorder, a Pomodoro timer, a unit converter — into bloated, ad-riddled subscription traps that harvest personal data and stop working the moment you lose signal.

**Para Todos (4All)** was created out of frustration with that status quo and a clear belief: **essential daily utilities should belong to the user.**

- **Built for real daily use:** Every app in this suite was designed to solve a real, recurring personal need cleanly and reliably — starting with an audiophile-grade local music player (`Reproductor 4All`) that plays your folders and subfolders in your car without ads or paywalls.
- **Offline-First by architecture:** Every single core feature runs 100% locally on your device CPU. No accounts, no cloud lock-in, no internet required.
- **Privacy without compromise:** Zero third-party analytics SDKs (no Firebase, no Google Analytics, no ad networks), zero hidden telemetry, and zero background push notifications.
- **Lightweight & native:** Instead of shipping 150 MB wrappers or heavy third-party binaries, 4All prioritizes native Android APIs (`Google Oboe C++20`, `AMediaCodec`, `android.graphics.pdf.PdfRenderer`, `MediaStore`, `Storage Access Framework`, native `AppWidgetProvider`, `MediaBrowserServiceCompat` for Android Auto).
- **Accessible worldwide:** Full **26-language** localization (`@apps4all/i18n`), dynamic **Light & Dark mode** built on a unified Zinc design system, and crisp vector iconography (`lucide-react-native`).

---

## The 15-App Suite (`v1.0.1`)

### Productivity (Accent: Blue)
| App | Package | Highlights |
| :--- | :--- | :--- |
| **Apuntes 4All** | `com.apps4all.apuntes4all` | Offline notes, checklists, tags, image attachments, export/import backup |
| **Docs 4All** | `com.apps4all.docs4all` | Local viewer for `.docx`, `.xlsx`, `.csv`, `.md`, `.txt` with multi-sheet Excel, search, print-to-PDF & Android *"Open with"* |
| **Enfoque 4All** | `com.apps4all.enfoque4all` | Pomodoro focus timer with local ambient soundscapes (`expo-audio`) & focus stats |
| **Notas de Voz 4All** | `com.apps4all.notasvoz4all` | High-clarity local voice recorder, speed control (`1x`/`1.5x`/`2x`), non-destructive trim & instant share |
| **PDF 4All** | `com.apps4all.pdf4all` | Zero-KB native `PdfRenderer` in-app reader, scan/images-to-PDF, merge, split, rotate, watermark, reorder & Android *"Open with"* |

### Utilities (Accent: Teal)
| App | Package | Highlights |
| :--- | :--- | :--- |
| **Reproductor 4All** | `com.apps4all.reproductor4all` | **C++20 + Google Oboe** offline audiophile player: native `MediaStore` & recursive folder/subfolder picker, 5-band vertical Biquad EQ + Soft Limiter, real-time Loudness Normalizer, smooth Mixer Fade + Silence Skip, real PCM Spectrum/Waveform visualizer (with `Off` mode), Bluetooth EQ profiles, **Android Auto** (Queue + Folders), and native 4×1 Home-Screen Widget |
| **Fotos Ligeras 4All** | `com.apps4all.fotosligeras4all` | Batch offline image compressor & resizer with quality presets and instant gallery save |
| **Lupa 4All** | `com.apps4all.lupa4all` | Digital magnifier with flashlight toggle, freeze-frame inspection & capture |
| **QR 4All** | `com.apps4all.qr4all` | Live camera & gallery QR scanner, customizable QR generator (colors, frames, editable history) & PNG export/share |
| **Seguridad 4All** | `com.apps4all.seguridad4all` | Offline password vault & strong password generator with local encryption & encrypted backup |
| **ZIP 4All** | `com.apps4all.zip4all` | Compress/decompress `.zip` with optional AES password, selective file extraction, SAF save to Downloads/Documents & Android *"Open with"* |

### Time & Math (Accent: Amber)
| App | Package | Highlights |
| :--- | :--- | :--- |
| **Azar 4All** | `com.apps4all.azar4all` | Dice, coin flip, roulette, random numbers & team/name picker |
| **Cuentas 4All** | `com.apps4all.cuentas4all` | Fast bill splitter, tip calculator, discounts & everyday math |
| **Festivos 4All** | `com.apps4all.festivos4all` | Offline public holidays calendar supporting **140+ countries** with live search |
| **Medidas 4All** | `com.apps4all.medidas4all` | Offline unit converter across 10 categories (length, mass, temp, volume, speed, area, storage, time, pressure, energy) |

---

## Architecture & Tech Stack

This repository is a **Turborepo + pnpm** monorepo containing all 15 independent Expo/React Native Android applications, 3 shared internal packages, and the static multilingual Astro web portal.

```text
Apps_4all/
├── apps/
│   ├── reproductor-4all/     # Includes custom native C++20/Kotlin module (modules/audio-engine)
│   ├── pdf-4all/             # Includes zero-KB native PdfRenderer + Open-With config plugin
│   ├── docs-4all/            # Includes native Android Open-With config plugin
│   ├── zip-4all/             # Includes native Android Open-With config plugin
│   ├── ... (11 more apps)
│   └── web/                  # Astro 5 + Tailwind multilingual web portal (Cloudflare Pages)
├── packages/
│   ├── ui-components/        # Shared SettingsModal4All, LegalModal4All, Update Checker
│   ├── i18n/                 # Shared react-i18next engine + 26 locale JSON dictionaries
│   └── supabase-client/      # Strictly opt-in client (never active without user consent)
└── scripts/
    ├── build-apk.ps1         # Single signed ARM-only APK builder + SHA-256 updater
    └── build-all-apks.ps1    # Batch signed APK builder for all 15 apps
```

### Core Technologies
- **Mobile:** Expo SDK 57, React Native 0.86 (New Architecture / Hermes), TypeScript, NativeWind v4 (Tailwind CSS), Zustand, `lucide-react-native`
- **Native Android / DSP:** C++20, Android NDK (`r27`), CMake, Google Oboe (`1.9.3`), `AMediaExtractor` / `AMediaCodec`, `MediaBrowserServiceCompat` (Android Auto), `AppWidgetProvider`, `PdfRenderer`, Android SAF
- **Web Portal:** Astro 5, Tailwind CSS, deployed automatically to Cloudflare Pages (`apps/web/public/versions.json` powers the in-app manual update checker)

---

## Development & Local Builds

### Prerequisites
- **Node.js** `22+` & **pnpm** `9+`
- **JDK 21** (`JAVA_HOME`)
- **Android SDK** (API 35/36, Build-Tools 36, NDK `27.1.12297006`, CMake `3.22.1`)

### Install Dependencies
```bash
pnpm install
```

### Run an Individual App
```bash
pnpm --filter reproductor-4all start
```

### Build the Web Portal
```bash
pnpm --filter web build
```

### Build Signed Release APKs (Windows / PowerShell)
Signing keystores are stored outside the repository for security (`RELEASE_KEYSTORE_PATH` / `.env.signing`).
```powershell
# Single app
powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1 -AppSlug "reproductor-4all" -Version "1.0.1"

# All 15 apps (ARM-only: arm64-v8a + armeabi-v7a)
powershell -ExecutionPolicy Bypass -File scripts\build-all-apks.ps1 -Version "1.0.1" -CleanIntermediates
```

---

## Security & Integrity
- Every release APK is signed with its own dedicated **RSA-4096** production keystore.
- Official **SHA-256** checksums for all 15 APKs are published in [`apps/web/public/versions.json`](apps/web/public/versions.json) and verifiable on [https://apps-4all.pages.dev/versions.json](https://apps-4all.pages.dev/versions.json).

---

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

The source code is published openly for portfolio showcase, inspection, and personal noncommercial use. **Commercial use, monetization, or unauthorized paid redistribution is strictly prohibited.**


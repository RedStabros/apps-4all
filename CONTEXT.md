# PROJECT CONTEXT: "Para Todos" (4All) Ecosystem

## 1. Project Overview & Core Philosophy
A suite of 14 minimalist, hyper-efficient, and cross-platform utility mobile applications. 

**Strict Core Philosophy (Non-Negotiable):**
- **100% Free & No Ads:** No monetization through ads, paywalls, or in-app purchases. Monetization is purely altruistic via external donation links (e.g., Buy Me a Coffee).
- **Offline-First (Local First):** Core functionalities MUST work perfectly without an internet connection. Heavy processing must be done on the device CPU, not via backend APIs.
- **Privacy-Centric:** No hidden tracking. Telemetry (error logging) and cross-device syncing are strictly **opt-in**.
- **No Push Notifications:** Do not implement background push notifications under any circumstances.
- **Lightweight:** Bundle sizes must be kept to an absolute minimum. Avoid heavy third-party libraries if a native or lightweight local solution exists.

## 2. Tech Stack & Architecture
- **Repository:** Monorepo architecture using **Turborepo**.
- **Mobile Framework:** **React Native** managed with **Expo** (targeting Android first, iOS later).
- **Web Frontend:** **Astro** for the central landing page and APK distribution portal.
- **Styling:** **Tailwind CSS** (via NativeWind for React Native).
- **Backend (Passive/Opt-in only):** **Supabase** (PostgreSQL) strictly for opt-in error logging (`app_errors`) and opt-in user account syncing.
- **Local Storage:** `AsyncStorage` or `SQLite`.
- **Internationalization (i18n):** `react-i18next` utilizing static JSON files.

## 3. Directory Structure (Monorepo)
- `/apps/web`: The Astro static website.
- `/apps/[app-name]-4all`: Individual Expo projects for each utility (each with its own `app.json` and package name).
- `/packages/ui-components`: Shared Tailwind CSS native components (Buttons, Cards, Typography).
- `/packages/supabase-client`: Centralized Supabase connection and logic.
- `/packages/i18n`: Shared localization setup and JSON files.

## 4. UI/UX Design System
- **Theme:** Clean, modern, sober, high-end corporate aesthetic (iOS flat design style).
- **Colors (Zinc Base):** 
  - Backgrounds: `zinc-50` (#FAFAFA) for light mode, `zinc-950` (#09090B) for dark mode.
  - Surfaces: `zinc-0` for light, `zinc-900` for dark.
- **Accent Colors (3 Categories based on app type):**
  - *Category 1 (Productivity):* Light `#2563EB` (Blue 600), Dark `#60A5FA` (Blue 400).
  - *Category 2 (Utilities):* Light `#0F766E` (Teal 700), Dark `#2DD4BF` (Teal 400).
  - *Category 3 (Time & Math):* Light `#B45309` (Amber 700), Dark `#FBBF24` (Amber 400).
- **Typography:** Inter or Roboto (geometric sans-serif for broad international glyph support).
- **Shapes:** Rounded corners on all interactive elements (`rounded-xl` or `rounded-2xl`).
- **Mode:** Dynamic Dark/Light mode support is mandatory across all components.

## 5. Localization (14 Supported Languages)
All text must be internationalized from day one. Do not hardcode strings in UI components.
Use the following language codes: `en` (Default/Fallback), `es`, `pt`, `hi`, `id`, `ru`, `fr`, `de`, `zh-CN`, `zh-TW`, `ko`, `ja`, `vi`, `th`.

## 6. The 14 Applications (Development Roadmap)
1. **Festivos Colombia:** Holiday calendar with widget.
2. **Azar 4All:** Random number and polyhedral dice generator.
3. **QR 4All:** Offline QR/Barcode scanner.
4. **Lupa y Linterna:** Camera digital zoom and LED flash controller.
5. **Fotos Ligeras:** Local image compressor.
6. **Apuntes 4All:** Fast, local, unsynced text notepad.
7. **Seguridad 4All:** Offline, mathematical secure password generator.
8. **Enfoque 4All:** Minimalist Pomodoro timer.
9. **Cuentas 4All:** Offline tip calculator and bill splitter.
10. **Medidas 4All:** Offline unit converter.
11. **ZIP 4All:** Local file extractor (.zip, .rar).
12. **PDF 4All:** PDF viewer, image-to-PDF scanner, and page merger.
13. **Notas de Voz:** Unlimited local voice recorder.
14. **Docs 4All:** Lightweight reader/viewer for .xlsx and .docx.

## 7. Operational Directives for the AI
When generating code, always:
- Prioritize React Native/Expo native APIs over third-party npm packages.
- Ensure all components read dark/light mode context natively via NativeWind.
- Extract any reusable UI element into `packages/ui-components`.
- Write clean, strongly typed TypeScript code.

## 8. Licensing & Intellectual Property
- **License:** PolyForm Noncommercial 1.0.0 (Dual-Licensing model).
- **Directive:** The source code is public for auditing and portfolio display purposes. However, commercial use, monetization, and unauthorized redistribution for profit are strictly prohibited. 
- **AI Instruction:** The AI must not generate any `LICENSE` files suggesting MIT, Apache, or GPL. All copyright remains strictly exclusive to the creator to allow for future M&A (Mergers and Acquisitions) exits.

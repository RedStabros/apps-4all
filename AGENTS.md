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

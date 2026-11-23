import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export type ThemeOption = "system" | "light" | "dark";

interface SharedSettingsState {
  language: string;
  theme: ThemeOption;
  setLanguage: (lang: string) => void;
  setTheme: (theme: ThemeOption) => void;
}

export const useSharedSettingsStore = create<SharedSettingsState>()(
  persist(
    (set) => ({
      language: "es",
      theme: "system" as ThemeOption,

      setLanguage: (lang) => {
        set({ language: lang });
        try {
          const i18nModule = require("@apps4all/i18n");
          const i18n = i18nModule?.default || i18nModule;
          if (i18n && typeof i18n.changeLanguage === "function") {
            i18n.changeLanguage(lang);
          }
        } catch (_) {}
      },

      setTheme: (theme) => {
        if (theme === "system") {
          Appearance.setColorScheme(null); // null = follow OS
        } else {
          Appearance.setColorScheme(theme as "light" | "dark");
        }
        set({ theme });
      },
    }),
    {
      name: "@4all/shared-settings",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Restore theme override on app startup
        if (state?.theme && state.theme !== "system") {
          Appearance.setColorScheme(state.theme as "light" | "dark");
        }
        if (state?.language) {
          try {
            const i18nModule = require("@apps4all/i18n");
            const i18n = i18nModule?.default || i18nModule;
            if (i18n && typeof i18n.changeLanguage === "function") {
              i18n.changeLanguage(state.language);
            }
          } catch (_) {}
        }
      },
    },
  ),
);

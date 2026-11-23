import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface ZipLog {
  id: string;
  action: "COMPRESS" | "DECOMPRESS";
  filename: string;
  timestamp: number;
}

interface ZipState {
  manualLanguage: string | null;
  logs: ZipLog[];

  setLanguage: (lang: string) => void;
  addLog: (action: "COMPRESS" | "DECOMPRESS", filename: string) => void;
  clearLogs: () => void;
}

export const useZipStore = create<ZipState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      logs: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      addLog: (action, filename) => {
        const newLog: ZipLog = {
          id:
            "zip-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 7),
          action,
          filename,
          timestamp: Date.now(),
        };

        const newLogs = [newLog, ...get().logs].slice(0, 50);
        set({ logs: newLogs });
      },

      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: "4all-zip-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface AzarHistoryItem {
  id: string;
  type: "dice" | "coin" | "number" | "list" | "teams" | "wheel";
  result: string | number;
  details?: string;
  timestamp: number;
}

interface AzarState {
  manualLanguage: string | null;
  history: AzarHistoryItem[];
  listItems: string[];
  setLanguage: (lang: string) => void;
  setListItems: (items: string[]) => void;
  addHistory: (item: Omit<AzarHistoryItem, "id" | "timestamp">) => void;
  clearHistory: () => void;
}

export const useAzarStore = create<AzarState>()(
  persist(
    (set) => ({
      manualLanguage: null,
      history: [],
      listItems: ["A", "B", "C", "D"],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      setListItems: (listItems) => set({ listItems }),

      addHistory: (item) =>
        set((state) => {
          const newItem: AzarHistoryItem = {
            ...item,
            id:
              "azar-" +
              Date.now().toString(36) +
              "-" +
              Math.random().toString(36).slice(2, 6),
            timestamp: Date.now(),
          };
          const newHistory = [newItem, ...state.history].slice(0, 20);
          return { history: newHistory };
        }),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "4all-azar-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

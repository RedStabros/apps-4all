import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface AccountRecord {
  id: string;
  name: string;
  billTotal: number;
  tipPercent: number;
  peopleCount: number;
  finalTotal: number;
  eachPays: number;
  timestamp: number;
}

interface AccountsState {
  manualLanguage: string | null;
  history: AccountRecord[];
  savedDiners: string[];
  currency: string;
  enableTax: boolean;
  taxRate: number;
  roundingMode: "none" | "10" | "100" | "500" | "1000";

  setLanguage: (lang: string) => void;
  setCurrency: (currency: string) => void;
  setRoundingMode: (mode: "none" | "10" | "100" | "500" | "1000") => void;
  setTaxSettings: (enableTax: boolean, taxRate: number) => void;
  addSavedDiner: (name: string) => void;
  removeSavedDiner: (name: string) => void;
  saveRecord: (record: Omit<AccountRecord, "id" | "timestamp">) => void;
  deleteRecord: (id: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      history: [],
      savedDiners: [],
      currency: "$",
      enableTax: false,
      taxRate: 19,
      roundingMode: "none",

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      setCurrency: (currency) => set({ currency }),
      setRoundingMode: (roundingMode) => set({ roundingMode }),

      setTaxSettings: (enableTax, taxRate) => set({ enableTax, taxRate }),

      addSavedDiner: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const current = get().savedDiners || [];
        if (current.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
          return;
        }
        set({ savedDiners: [...current, trimmed].slice(0, 20) });
      },

      removeSavedDiner: (name) => {
        set({
          savedDiners: (get().savedDiners || []).filter((d) => d !== name),
        });
      },

      saveRecord: (record) => {
        const current = get().history;
        const newRecord: AccountRecord = {
          ...record,
          id:
            "bill-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 6),
          timestamp: Date.now(),
        };

        let newHistory = [newRecord, ...current];
        if (newHistory.length > MAX_HISTORY) {
          newHistory = newHistory.slice(0, MAX_HISTORY);
        }

        set({ history: newHistory });
      },

      deleteRecord: (id) => {
        set({ history: get().history.filter((r) => r.id !== id) });
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: "4all-cuentas-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

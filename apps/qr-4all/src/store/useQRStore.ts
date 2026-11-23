import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface QRStyleConfig {
  fgColor: string;
  bgColor: string;
  isGradient: boolean;
  gradientColors: [string, string];
  logoUri?: string | null;
  presetIcon?: string | null;
  frameType: "none" | "scanme-top" | "scanme-bottom" | "card";
  frameText?: string;
  frameColor?: string;
}

export interface QRRecord {
  id: string;
  type: string; // 'url' | 'wifi' | 'whatsapp' | 'vcard' | 'text' | 'email' | 'phone' | 'sms' | 'bitcoin' | 'paypal' | 'scan'
  title?: string;
  data: string;
  timestamp: number;
  style?: QRStyleConfig;
}

interface QRState {
  manualLanguage: string | null;
  history: QRRecord[]; // Scanned QR codes
  savedQRs: QRRecord[]; // User-created & saved QR codes

  setLanguage: (lang: string) => void;
  saveRecord: (record: Omit<QRRecord, "id" | "timestamp">) => void;
  deleteRecord: (id: string) => void;
  clearHistory: () => void;

  saveCreatedQR: (qr: Omit<QRRecord, "id" | "timestamp">) => void;
  deleteCreatedQR: (id: string) => void;
  clearSavedQRs: () => void;
  importSavedQRs: (records: QRRecord[]) => number;
}

export const useQRStore = create<QRState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      history: [],
      savedQRs: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      saveRecord: (record) => {
        const current = get().history;

        // Anti-spam: don't duplicate identical consecutive scan within 5s
        if (
          current.length > 0 &&
          current[0].data === record.data &&
          Date.now() - current[0].timestamp < 5000
        ) {
          return;
        }

        const newRecord: QRRecord = {
          ...record,
          id:
            "scan-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 7),
          timestamp: Date.now(),
        };

        let newHistory = [newRecord, ...current];
        if (newHistory.length > 100) newHistory = newHistory.slice(0, 100);

        set({ history: newHistory });
      },

      deleteRecord: (id) => {
        set({ history: get().history.filter((r) => r.id !== id) });
      },

      clearHistory: () => {
        set({ history: [] });
      },

      saveCreatedQR: (qr) => {
        const current = get().savedQRs;
        const newQR: QRRecord = {
          ...qr,
          id:
            "qr-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 7),
          timestamp: Date.now(),
        };

        set({ savedQRs: [newQR, ...current] });
      },

      deleteCreatedQR: (id) => {
        set({ savedQRs: get().savedQRs.filter((q) => q.id !== id) });
      },

      clearSavedQRs: () => {
        set({ savedQRs: [] });
      },

      importSavedQRs: (records) => {
        const existing = get().savedQRs;
        const existingSignatures = new Set(
          existing.map((r) => `${r.type}::${r.data}`),
        );
        const toAdd: QRRecord[] = [];

        for (const item of records) {
          if (
            !item ||
            typeof item.data !== "string" ||
            item.data.trim().length === 0
          ) {
            continue;
          }
          const safeType =
            typeof item.type === "string" && item.type.trim().length > 0
              ? item.type
              : "text";
          const sig = `${safeType}::${item.data}`;
          if (existingSignatures.has(sig)) continue;
          existingSignatures.add(sig);

          toAdd.push({
            id:
              "qr-" +
              Date.now().toString(36) +
              "-" +
              Math.random().toString(36).slice(2, 7),
            type: safeType,
            title:
              typeof item.title === "string" ? item.title : undefined,
            data: item.data,
            timestamp:
              typeof item.timestamp === "number" ? item.timestamp : Date.now(),
            style: item.style,
          });
        }

        if (toAdd.length > 0) {
          set({ savedQRs: [...toAdd, ...existing] });
        }
        return toAdd.length;
      },
    }),
    {
      name: "4all-qr-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";
import { Category } from "../engine/unitsEngine";

export interface RecentConversion {
  id: string;
  category: Category;
  fromId: string;
  toId: string;
}

interface MeasuresState {
  manualLanguage: string | null;
  recent: RecentConversion[];
  favorites: RecentConversion[];
  setLanguage: (lang: string) => void;
  saveRecent: (conversion: Omit<RecentConversion, "id">) => void;
  clearRecent: () => void;
  toggleFavorite: (conversion: Omit<RecentConversion, "id">) => void;
}

export const useMeasuresStore = create<MeasuresState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      recent: [],
      favorites: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      saveRecent: (conv) => {
        const current = get().recent;
        const exists = current.find(
          (c) =>
            c.category === conv.category &&
            ((c.fromId === conv.fromId && c.toId === conv.toId) ||
              (c.fromId === conv.toId && c.toId === conv.fromId)),
        );

        if (exists) {
          const filtered = current.filter((c) => c.id !== exists.id);
          set({ recent: [exists, ...filtered] });
        } else {
          const newEntry: RecentConversion = {
            ...conv,
            id:
              "conv-" +
              Date.now().toString(36) +
              "-" +
              Math.random().toString(36).slice(2, 6),
          };
          let newRecent = [newEntry, ...current];
          if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
          set({ recent: newRecent });
        }
      },

      clearRecent: () => set({ recent: [] }),

      toggleFavorite: (conv) => {
        const current = get().favorites || [];
        const exists = current.find(
          (f) =>
            f.category === conv.category &&
            f.fromId === conv.fromId &&
            f.toId === conv.toId,
        );
        if (exists) {
          set({ favorites: current.filter((f) => f.id !== exists.id) });
        } else {
          const newFav: RecentConversion = {
            ...conv,
            id:
              "fav-" +
              Date.now().toString(36) +
              "-" +
              Math.random().toString(36).slice(2, 6),
          };
          set({ favorites: [newFav, ...current].slice(0, 15) });
        }
      },
    }),
    {
      name: "4all-medidas-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

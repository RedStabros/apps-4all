import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface CustomEvent {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isHoliday: boolean;
  note?: string;
}

interface PreferencesState {
  manualLanguage: string | null;
  selectedCountries: string[];
  customEvents: CustomEvent[];
  setLanguage: (lang: string) => void;
  toggleCountry: (countryCode: string) => void;
  addCustomEvent: (event: Omit<CustomEvent, "id">) => void;
  removeCustomEvent: (id: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      selectedCountries: ["CO"], // Default to Colombia
      customEvents: [],
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },
      toggleCountry: (countryCode) => {
        const current = get().selectedCountries;
        if (current.includes(countryCode)) {
          set({ selectedCountries: current.filter((c) => c !== countryCode) });
        } else {
          set({ selectedCountries: [...current, countryCode] });
        }
      },
      addCustomEvent: (event) => {
        const current = get().customEvents;
        const newEvent = {
          ...event,
          id: Math.random().toString(36).substr(2, 9),
        };
        set({ customEvents: [...current, newEvent] });
      },
      removeCustomEvent: (id) => {
        const current = get().customEvents;
        set({ customEvents: current.filter((e) => e.id !== id) });
      },
    }),
    {
      name: "4all-preferences",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

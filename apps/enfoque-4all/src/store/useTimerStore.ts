import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export type AmbientSoundType =
  | "none"
  | "rain"
  | "whitenoise"
  | "cafe"
  | "waves";

export interface FocusSessionLog {
  id: string;
  task: string;
  minutes: number;
  completedAt: number;
}

interface TimerState {
  manualLanguage: string | null;
  completedToday: number;
  lastCompletedDate: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  ambientSound: AmbientSoundType;
  currentTask: string;
  weeklyHistory: Record<string, number>;
  recentSessions: FocusSessionLog[];

  setLanguage: (lang: string) => void;
  setIntervals: (focus: number, shortBreak: number, longBreak: number) => void;
  setAmbientSound: (sound: AmbientSoundType) => void;
  setCurrentTask: (task: string) => void;
  incrementCompleted: (taskLabel?: string) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      completedToday: 0,
      lastCompletedDate: new Date().toDateString(),
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      ambientSound: "none",
      currentTask: "",
      weeklyHistory: {},
      recentSessions: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      setIntervals: (focus, shortBreak, longBreak) => {
        set({
          focusMinutes: Math.max(1, Math.min(180, focus)),
          shortBreakMinutes: Math.max(1, Math.min(60, shortBreak)),
          longBreakMinutes: Math.max(1, Math.min(90, longBreak)),
        });
      },

      setAmbientSound: (ambientSound) => {
        set({ ambientSound });
      },

      setCurrentTask: (currentTask) => {
        set({ currentTask });
      },

      incrementCompleted: (taskLabel?: string) => {
        const today = new Date().toDateString();
        const dateKey = new Date().toISOString().split("T")[0];
        const currentData = get();

        const currentCount =
          currentData.lastCompletedDate !== today
            ? 0
            : currentData.completedToday;
        const newCount = currentCount + 1;

        const updatedHistory = { ...currentData.weeklyHistory };
        updatedHistory[dateKey] = (updatedHistory[dateKey] || 0) + 1;

        const sessionEntry: FocusSessionLog = {
          id: "ses-" + Date.now().toString(36),
          task: (taskLabel ?? currentData.currentTask).trim(),
          minutes: currentData.focusMinutes,
          completedAt: Date.now(),
        };

        set({
          completedToday: newCount,
          lastCompletedDate: today,
          weeklyHistory: updatedHistory,
          recentSessions: [sessionEntry, ...(currentData.recentSessions || [])].slice(
            0,
            50,
          ),
        });
      },
    }),
    {
      name: "4all-enfoque-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

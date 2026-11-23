import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import i18n from "@apps4all/i18n";

export type VoiceCategory = "general" | "work" | "ideas" | "personal";

export interface AudioRecord {
  id: string;
  uri: string;
  durationMs: number;
  timestamp: number;
  title: string;
  category?: VoiceCategory;
  trimStartMs?: number;
  trimEndMs?: number;
}

interface AudioState {
  manualLanguage: string | null;
  recordings: AudioRecord[];

  setLanguage: (lang: string) => void;
  saveRecording: (
    uri: string,
    durationMs: number,
    category?: VoiceCategory,
  ) => Promise<boolean>;
  renameRecording: (
    id: string,
    newTitle: string,
    category?: VoiceCategory,
  ) => void;
  updateCategory: (id: string, category: VoiceCategory) => void;
  updateTrim: (id: string, trimStartMs?: number, trimEndMs?: number) => void;
  deleteRecording: (id: string) => Promise<void>;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      recordings: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      saveRecording: async (uri, durationMs, category = "general") => {
        try {
          const id =
            "rec-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 7);
          const timestamp = Date.now();
          const newUri = `${FileSystem.documentDirectory}${id}.m4a`;
          await FileSystem.moveAsync({
            from: uri,
            to: newUri,
          });

          const dateObj = new Date(timestamp);
          const newRecord: AudioRecord = {
            id,
            uri: newUri,
            durationMs: Math.max(1000, durationMs),
            timestamp,
            title: `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            category,
          };

          set({ recordings: [newRecord, ...get().recordings] });
          return true;
        } catch {
          return false;
        }
      },

      renameRecording: (
        id: string,
        newTitle: string,
        category?: VoiceCategory,
      ) => {
        set({
          recordings: get().recordings.map((r) =>
            r.id === id
              ? {
                  ...r,
                  title: newTitle.trim() || r.title,
                  ...(category ? { category } : {}),
                }
              : r,
          ),
        });
      },

      updateCategory: (id: string, category: VoiceCategory) => {
        set({
          recordings: get().recordings.map((r) =>
            r.id === id ? { ...r, category } : r,
          ),
        });
      },

      updateTrim: (id: string, trimStartMs?: number, trimEndMs?: number) => {
        set({
          recordings: get().recordings.map((r) =>
            r.id === id ? { ...r, trimStartMs, trimEndMs } : r,
          ),
        });
      },

      deleteRecording: async (id) => {
        const rec = get().recordings.find((r) => r.id === id);
        if (rec) {
          try {
            await FileSystem.deleteAsync(rec.uri, { idempotent: true });
          } catch {
            // File may already be removed
          }
        }
        set({ recordings: get().recordings.filter((r) => r.id !== id) });
      },
    }),
    {
      name: "4all-audio-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@apps4all/i18n";

export interface Folder {
  id: string;
  name: string;
  icon: string;
  isPrivate?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Note {
  id: string;
  folderId: string | null; // null means 'Uncategorized' or 'All Notes' root
  title: string;
  type: "text" | "list";
  textContent: string;
  listContent: ChecklistItem[];
  images?: string[];
  isEncrypted?: boolean;
  isPinned: boolean;
  updatedAt: number;
}

interface NotesState {
  manualLanguage: string | null;
  folders: Folder[];
  notes: Note[];

  setLanguage: (lang: string) => void;

  addFolder: (name: string, icon: string, isPrivate?: boolean) => void;
  deleteFolder: (id: string) => void;

  saveNote: (note: Omit<Note, "updatedAt">) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  importBackup: (
    incomingFolders: Folder[],
    incomingNotes: Note[],
  ) => { addedFolders: number; addedNotes: number };
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      folders: [
        { id: "f-ideas", name: "Ideas", icon: "💡" },
        { id: "f-work", name: "Trabajo", icon: "💼" },
      ],
      notes: [],

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      addFolder: (name, icon, isPrivate = false) => {
        const id = "f-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
        set({ folders: [...get().folders, { id, name, icon, isPrivate }] });
      },

      deleteFolder: (id) => {
        set({
          folders: get().folders.filter((f) => f.id !== id),
          notes: get().notes.filter((n) => n.folderId !== id),
        });
      },

      saveNote: (note) => {
        const current = get().notes;
        const exists = current.find((n) => n.id === note.id);
        const newNote: Note = { ...note, updatedAt: Date.now() };

        if (exists) {
          set({ notes: current.map((n) => (n.id === note.id ? newNote : n)) });
        } else {
          set({ notes: [newNote, ...current] });
        }
      },

      deleteNote: (id) => {
        set({ notes: get().notes.filter((n) => n.id !== id) });
      },

      togglePin: (id) => {
        const current = get().notes;
        set({
          notes: current.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n,
          ),
        });
      },

      importBackup: (incomingFolders, incomingNotes) => {
        const currentFolders = get().folders;
        const currentNotes = get().notes;
        const existingFolderIds = new Set(currentFolders.map((f) => f.id));
        const existingNoteIds = new Set(currentNotes.map((n) => n.id));

        const newFolders = incomingFolders.filter(
          (f) => f && typeof f.id === "string" && typeof f.name === "string" && !existingFolderIds.has(f.id),
        );
        const newNotes = incomingNotes.filter(
          (n) => n && typeof n.id === "string" && !existingNoteIds.has(n.id),
        );

        set({
          folders: [...currentFolders, ...newFolders],
          notes: [...newNotes, ...currentNotes],
        });

        return { addedFolders: newFolders.length, addedNotes: newNotes.length };
      },
    }),
    {
      name: "4all-apuntes-state",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

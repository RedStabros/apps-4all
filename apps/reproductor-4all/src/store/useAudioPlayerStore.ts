import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioEngine } from "../../modules/audio-engine";

export interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  durationMs: number;
  format: "FLAC" | "MP3" | "M4A" | "WAV" | "AAC";
  folder?: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export type ShuffleMode = "off" | "cycle" | "full";
export type RepeatMode = "off" | "all" | "one";

export interface EQBand {
  id: number;
  name: string;
  frequencyHz: number;
  gainDb: number;
  qFactor: number;
}

export interface EQProfile {
  id: string;
  name: string;
  gains: [number, number, number, number, number];
}

export const DEFAULT_EQ_PRESETS: EQProfile[] = [
  { id: "flat", name: "Plano (Referencia)", gains: [0, 0, 0, 0, 0] },
  { id: "headphones", name: "Audífonos / In-Ear", gains: [3.5, 1.5, 0.0, 2.0, 3.0] },
  { id: "speaker", name: "Parlante Celular", gains: [-4.0, 1.0, 4.5, 3.5, 2.0] },
  { id: "car", name: "Carro / Android Auto", gains: [5.5, 2.5, -1.0, 2.5, 4.0] },
  { id: "bt_speaker", name: "Parlante Bluetooth", gains: [4.5, 3.0, 0.5, 2.0, 3.0] },
  { id: "bass", name: "Graves Audiófilos", gains: [6.0, 3.5, 0.0, 1.0, 2.0] },
  { id: "vocal", name: "Claridad Vocal", gains: [-2.0, 0.5, 4.5, 3.5, 1.5] },
  { id: "rock", name: "Rock / Pop", gains: [4.0, 1.5, -1.0, 2.5, 4.5] },
];

export const INITIAL_BANDS: EQBand[] = [
  { id: 0, name: "Sub 80Hz", frequencyHz: 80, gainDb: 0, qFactor: 0.707 },
  { id: 1, name: "Low 250Hz", frequencyHz: 250, gainDb: 0, qFactor: 1.0 },
  { id: 2, name: "Mid 1kHz", frequencyHz: 1000, gainDb: 0, qFactor: 1.0 },
  { id: 3, name: "High 4kHz", frequencyHz: 4000, gainDb: 0, qFactor: 1.0 },
  { id: 4, name: "Air 12kHz", frequencyHz: 12000, gainDb: 0, qFactor: 0.707 },
];

// Fisher-Yates shuffle keeping currentIndex at position 0 so it never repeats immediately
function buildFisherYatesCycle(
  length: number,
  currentIndex: number,
  avoidFirstIndex?: number,
): number[] {
  if (length <= 0) return [];
  const indices: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i !== currentIndex) indices.push(i);
  }
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (currentIndex >= 0 && currentIndex < length) {
    return [currentIndex, ...indices];
  }
  if (
    avoidFirstIndex !== undefined &&
    indices.length > 1 &&
    indices[0] === avoidFirstIndex
  ) {
    const swapIdx = 1 + Math.floor(Math.random() * (indices.length - 1));
    [indices[0], indices[swapIdx]] = [indices[swapIdx], indices[0]];
  }
  return indices;
}

function syncNativeQueue(tracks: Track[]) {
  AudioEngine.syncAutoQueue(
    tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      durationMs: t.durationMs,
    })),
  );
}

interface AudioPlayerState {
  playlist: Track[];
  savedPlaylists: SavedPlaylist[];
  currentTrackIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  bands: EQBand[];
  currentProfileId: string;
  bluetoothProfiles: Record<string, string>;
  activeBluetoothDevice: string | null;

  // Shuffle (2 modes + off) & Repeat & Sleep Timer
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  // Session-only Fisher-Yates deck (NOT persisted -> always resets cleanly on app launch)
  shuffleOrder: number[];
  shuffleCursor: number;
  sleepTimerEndAt: number | null;

  // Anti-junk audio filter preferences
  excludeJunkAudio: boolean;
  minDurationSec: number;
  excludedFolders: string[];

  // Actions
  setPlaylist: (tracks: Track[], startIndex?: number) => Promise<void>;
  addTracks: (tracks: Track[]) => void;
  addTrackAndPlay: (track: Track) => Promise<void>;
  removeTrack: (id: string) => void;
  clearPlaylist: () => void;

  createSavedPlaylist: (name: string, tracks: Track[]) => void;
  deleteSavedPlaylist: (id: string) => void;
  loadSavedPlaylist: (id: string) => Promise<void>;

  loadTrack: (index: number) => Promise<void>;
  playByMediaId: (mediaId: string) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  play: () => void;
  pause: () => void;
  nextTrack: (fromAutoAdvance?: boolean) => void;
  previousTrack: () => void;
  seekTo: (positionMs: number) => void;
  updatePosition: (positionMs: number) => void;

  cycleShuffleMode: () => void;
  cycleRepeatMode: () => void;
  setSleepTimer: (minutes: number | null) => void;

  setExcludeJunkAudio: (enabled: boolean) => void;
  setMinDurationSec: (seconds: number) => void;
  toggleExcludedFolder: (folderName: string) => void;

  setBandGain: (bandIndex: number, gainDb: number) => void;
  applyProfile: (profileId: string) => void;
  assignBluetoothProfile: (deviceName: string, profileId: string) => void;
  handleBluetoothDeviceConnected: (deviceName: string) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()(
  persist(
    (set, get) => ({
      playlist: [],
      savedPlaylists: [],
      currentTrackIndex: 0,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      bands: INITIAL_BANDS,
      currentProfileId: "flat",
      bluetoothProfiles: {},
      activeBluetoothDevice: null,

      shuffleMode: "off",
      repeatMode: "all",
      shuffleOrder: [],
      shuffleCursor: 0,
      sleepTimerEndAt: null,

      excludeJunkAudio: true,
      minDurationSec: 30,
      excludedFolders: [],

      setPlaylist: async (tracks, startIndex = 0) => {
        const safeIdx = Math.max(0, Math.min(startIndex, tracks.length - 1));
        const { shuffleMode } = get();
        const newOrder =
          shuffleMode === "cycle"
            ? buildFisherYatesCycle(tracks.length, safeIdx)
            : [];
        set({
          playlist: tracks,
          currentTrackIndex: tracks.length > 0 ? safeIdx : 0,
          shuffleOrder: newOrder,
          shuffleCursor: 0,
        });
        syncNativeQueue(tracks);
        if (tracks.length > 0) {
          await get().loadTrack(safeIdx);
        }
      },

      addTracks: (newTracks) => {
        const { playlist, shuffleMode, currentTrackIndex } = get();
        const existingUris = new Set(playlist.map((t) => t.uri));
        const filtered = newTracks.filter((t) => !existingUris.has(t.uri));
        if (filtered.length > 0) {
          const updated = [...playlist, ...filtered];
          const newOrder =
            shuffleMode === "cycle"
              ? buildFisherYatesCycle(updated.length, currentTrackIndex)
              : [];
          set({
            playlist: updated,
            shuffleOrder: newOrder,
            shuffleCursor: 0,
          });
          syncNativeQueue(updated);
        }
      },

      addTrackAndPlay: async (track) => {
        const { playlist, loadTrack, shuffleMode } = get();
        const existingIdx = playlist.findIndex((t) => t.uri === track.uri);
        if (existingIdx >= 0) {
          await loadTrack(existingIdx);
        } else {
          const newPlaylist = [...playlist, track];
          const newIndex = newPlaylist.length - 1;
          const newOrder =
            shuffleMode === "cycle"
              ? buildFisherYatesCycle(newPlaylist.length, newIndex)
              : [];
          set({
            playlist: newPlaylist,
            shuffleOrder: newOrder,
            shuffleCursor: 0,
          });
          syncNativeQueue(newPlaylist);
          await loadTrack(newIndex);
        }
      },

      removeTrack: (id) => {
        const { playlist, currentTrackIndex, shuffleMode } = get();
        const filtered = playlist.filter((t) => t.id !== id);
        if (filtered.length === 0) {
          set({
            playlist: [],
            currentTrackIndex: 0,
            isPlaying: false,
            positionMs: 0,
            durationMs: 0,
            shuffleOrder: [],
            shuffleCursor: 0,
          });
          AudioEngine.stop();
          syncNativeQueue([]);
        } else {
          const newIdx =
            currentTrackIndex >= filtered.length
              ? filtered.length - 1
              : currentTrackIndex;
          const newOrder =
            shuffleMode === "cycle"
              ? buildFisherYatesCycle(filtered.length, newIdx)
              : [];
          set({
            playlist: filtered,
            currentTrackIndex: newIdx,
            shuffleOrder: newOrder,
            shuffleCursor: 0,
          });
          syncNativeQueue(filtered);
        }
      },

      clearPlaylist: () => {
        AudioEngine.stop();
        syncNativeQueue([]);
        set({
          playlist: [],
          currentTrackIndex: 0,
          isPlaying: false,
          positionMs: 0,
          durationMs: 0,
          shuffleOrder: [],
          shuffleCursor: 0,
        });
      },

      createSavedPlaylist: (name, tracks) => {
        const trimmed = name.trim();
        if (!trimmed || tracks.length === 0) return;
        const newPl: SavedPlaylist = {
          id: "pl-" + Date.now().toString(36),
          name: trimmed,
          tracks,
          createdAt: Date.now(),
        };
        set({ savedPlaylists: [newPl, ...get().savedPlaylists] });
      },

      deleteSavedPlaylist: (id) => {
        set({
          savedPlaylists: get().savedPlaylists.filter((p) => p.id !== id),
        });
      },

      loadSavedPlaylist: async (id) => {
        const found = get().savedPlaylists.find((p) => p.id === id);
        if (!found || found.tracks.length === 0) return;
        await get().setPlaylist(found.tracks, 0);
      },

      loadTrack: async (index) => {
        const { playlist } = get();
        if (index < 0 || index >= playlist.length) return;

        const track = playlist[index];
        let finalDuration = track.durationMs;
        set({
          currentTrackIndex: index,
          positionMs: 0,
          durationMs: finalDuration,
        });

        try {
          const res = await AudioEngine.openFile(track.uri);
          if (res?.durationMs && res.durationMs > 0) {
            finalDuration = res.durationMs;
            set({ durationMs: finalDuration });
          }
        } catch {
          // Fallback to metadata duration
        }

        AudioEngine.startForegroundService(
          track.title,
          track.artist,
          true,
          finalDuration,
          0,
        );
        AudioEngine.play();
        set({ isPlaying: true });
      },

      playByMediaId: async (mediaId) => {
        const { playlist, loadTrack } = get();
        const idx = playlist.findIndex((t) => t.id === mediaId);
        if (idx >= 0) {
          await loadTrack(idx);
        }
      },

      togglePlayPause: async () => {
        const { isPlaying, playlist, currentTrackIndex, durationMs, positionMs } =
          get();
        if (playlist.length === 0) return;
        const currentTrack = playlist[currentTrackIndex];
        if (!currentTrack) return;

        if (isPlaying) {
          try {
            AudioEngine.pause();
            AudioEngine.startForegroundService(
              currentTrack.title,
              currentTrack.artist,
              false,
              durationMs,
              positionMs,
            );
          } catch {
            // Safe fallback
          }
          set({ isPlaying: false });
        } else {
          try {
            if (!currentTrack.uri.startsWith("internal://")) {
              await AudioEngine.openFile(currentTrack.uri);
              if (positionMs > 0 && positionMs < durationMs) {
                AudioEngine.seekTo(positionMs);
              }
            }
            AudioEngine.play();
            AudioEngine.startForegroundService(
              currentTrack.title,
              currentTrack.artist,
              true,
              durationMs,
              positionMs,
            );
            set({ isPlaying: true });
          } catch {
            set({ isPlaying: false });
          }
        }
      },

      play: () => {
        const { playlist, currentTrackIndex, durationMs, positionMs } = get();
        const currentTrack = playlist[currentTrackIndex];
        AudioEngine.play();
        if (currentTrack) {
          AudioEngine.startForegroundService(
            currentTrack.title,
            currentTrack.artist,
            true,
            durationMs,
            positionMs,
          );
        }
        set({ isPlaying: true });
      },

      pause: () => {
        const { playlist, currentTrackIndex, durationMs, positionMs } = get();
        const currentTrack = playlist[currentTrackIndex];
        AudioEngine.pause();
        if (currentTrack) {
          AudioEngine.startForegroundService(
            currentTrack.title,
            currentTrack.artist,
            false,
            durationMs,
            positionMs,
          );
        }
        set({ isPlaying: false });
      },

      nextTrack: (fromAutoAdvance = false) => {
        const {
          playlist,
          currentTrackIndex,
          shuffleMode,
          repeatMode,
          shuffleOrder,
          shuffleCursor,
          loadTrack,
          pause,
          seekTo,
        } = get();

        if (playlist.length === 0) return;

        // Repeat One on auto-advance
        if (fromAutoAdvance && repeatMode === "one") {
          seekTo(0);
          get().play();
          return;
        }

        // Mode 1: Shuffle Cycle (Fisher-Yates — no repeats until full cycle ends)
        if (shuffleMode === "cycle") {
          let order = shuffleOrder;
          let cursor = shuffleCursor;

          // Build deck lazily if empty or out-of-sync (e.g. fresh app launch)
          if (order.length !== playlist.length) {
            order = buildFisherYatesCycle(playlist.length, currentTrackIndex);
            cursor = 0;
          }

          const nextCursor = cursor + 1;
          if (nextCursor < order.length) {
            set({ shuffleOrder: order, shuffleCursor: nextCursor });
            loadTrack(order[nextCursor]);
          } else {
            // Full cycle completed!
            if (fromAutoAdvance && repeatMode === "off") {
              pause();
              set({ positionMs: 0, shuffleOrder: [], shuffleCursor: 0 });
              return;
            }
            // Start a fresh cycle avoiding repeating the track that just finished
            const freshDeck = buildFisherYatesCycle(
              playlist.length,
              -1,
              currentTrackIndex,
            );
            set({ shuffleOrder: freshDeck, shuffleCursor: 0 });
            loadTrack(freshDeck[0]);
          }
          return;
        }

        // Mode 2: Full Random (any track at any time, avoiding back-to-back same song if >1)
        if (shuffleMode === "full") {
          if (playlist.length === 1) {
            loadTrack(0);
            return;
          }
          let randIdx = Math.floor(Math.random() * playlist.length);
          if (randIdx === currentTrackIndex) {
            randIdx = (randIdx + 1 + Math.floor(Math.random() * (playlist.length - 1))) % playlist.length;
          }
          loadTrack(randIdx);
          return;
        }

        // Mode 3: Ordered
        if (currentTrackIndex + 1 >= playlist.length) {
          if (fromAutoAdvance && repeatMode === "off") {
            pause();
            set({ positionMs: 0 });
            return;
          }
          loadTrack(0);
        } else {
          loadTrack(currentTrackIndex + 1);
        }
      },

      previousTrack: () => {
        const {
          playlist,
          currentTrackIndex,
          positionMs,
          shuffleMode,
          shuffleOrder,
          shuffleCursor,
          loadTrack,
          seekTo,
        } = get();

        if (playlist.length === 0) return;

        // Standard Winamp/Poweramp behavior: if >3s into song, restart current song first
        if (positionMs > 3000) {
          seekTo(0);
          return;
        }

        if (shuffleMode === "cycle" && shuffleOrder.length === playlist.length) {
          const prevCursor = Math.max(0, shuffleCursor - 1);
          set({ shuffleCursor: prevCursor });
          loadTrack(shuffleOrder[prevCursor]);
          return;
        }

        const prevIdx =
          (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(prevIdx);
      },

      seekTo: (positionMs) => {
        AudioEngine.seekTo(positionMs);
        set({ positionMs });
      },

      updatePosition: (positionMs) => set({ positionMs }),

      cycleShuffleMode: () => {
        const { shuffleMode, playlist, currentTrackIndex } = get();
        const nextMode: ShuffleMode =
          shuffleMode === "off"
            ? "cycle"
            : shuffleMode === "cycle"
              ? "full"
              : "off";
        const newOrder =
          nextMode === "cycle"
            ? buildFisherYatesCycle(playlist.length, currentTrackIndex)
            : [];
        set({
          shuffleMode: nextMode,
          shuffleOrder: newOrder,
          shuffleCursor: 0,
        });
      },

      cycleRepeatMode: () => {
        const { repeatMode } = get();
        const next: RepeatMode =
          repeatMode === "off"
            ? "all"
            : repeatMode === "all"
              ? "one"
              : "off";
        set({ repeatMode: next });
      },

      setSleepTimer: (minutes) => {
        if (!minutes || minutes <= 0) {
          set({ sleepTimerEndAt: null });
        } else {
          set({ sleepTimerEndAt: Date.now() + minutes * 60 * 1000 });
        }
      },

      setExcludeJunkAudio: (enabled) => set({ excludeJunkAudio: enabled }),
      setMinDurationSec: (seconds) => set({ minDurationSec: seconds }),
      toggleExcludedFolder: (folderName) => {
        const current = get().excludedFolders;
        if (current.includes(folderName)) {
          set({
            excludedFolders: current.filter((f) => f !== folderName),
          });
        } else {
          set({ excludedFolders: [...current, folderName] });
        }
      },

      setBandGain: (bandIndex, gainDb) => {
        const { bands } = get();
        const newBands = [...bands];
        newBands[bandIndex] = { ...newBands[bandIndex], gainDb };
        set({ bands: newBands, currentProfileId: "custom" });

        AudioEngine.setBandParams(
          bandIndex,
          newBands[bandIndex].frequencyHz,
          gainDb,
          newBands[bandIndex].qFactor,
        );
      },

      applyProfile: (profileId) => {
        const preset = DEFAULT_EQ_PRESETS.find((p) => p.id === profileId);
        if (!preset) return;

        const { bands } = get();
        const newBands = bands.map((b, idx) => ({
          ...b,
          gainDb: preset.gains[idx],
        }));

        set({ bands: newBands, currentProfileId: profileId });

        newBands.forEach((b, idx) => {
          AudioEngine.setBandParams(idx, b.frequencyHz, b.gainDb, b.qFactor);
        });
      },

      assignBluetoothProfile: (deviceName, profileId) => {
        const { bluetoothProfiles } = get();
        set({
          bluetoothProfiles: {
            ...bluetoothProfiles,
            [deviceName]: profileId,
          },
        });
      },

      handleBluetoothDeviceConnected: (deviceName) => {
        set({ activeBluetoothDevice: deviceName });
        const { bluetoothProfiles, applyProfile } = get();
        const mappedProfileId = bluetoothProfiles[deviceName];
        if (mappedProfileId) {
          applyProfile(mappedProfileId);
        }
      },
    }),
    {
      name: "@4all/reproductor-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bands: state.bands,
        currentProfileId: state.currentProfileId,
        bluetoothProfiles: state.bluetoothProfiles,
        playlist: state.playlist,
        savedPlaylists: state.savedPlaylists,
        shuffleMode: state.shuffleMode,
        repeatMode: state.repeatMode,
        excludeJunkAudio: state.excludeJunkAudio,
        minDurationSec: state.minDurationSec,
        excludedFolders: state.excludedFolders,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.playlist && state.playlist.length > 0) {
          syncNativeQueue(state.playlist);
        }
      },
    },
  ),
);

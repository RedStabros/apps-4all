import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  EmitterSubscription,
} from "react-native";

const NativeAudioEngine = NativeModules.AudioEngine
  ? NativeModules.AudioEngine
  : new Proxy(
      {},
      {
        get() {
          // Graceful fallback on iOS / Expo Go / Web without crash
          return () => Promise.resolve();
        },
      },
    );

const eventEmitter =
  Platform.OS === "android" && NativeModules.AudioEngine
    ? new NativeEventEmitter(NativeModules.AudioEngine)
    : null;

export interface PlaybackStatus {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  isFinished?: boolean;
}

export interface BluetoothDeviceEvent {
  deviceName: string;
  deviceAddress: string;
}

export interface MediaButtonEvent {
  action: "NEXT" | "PREVIOUS" | "PLAY" | "PAUSE" | "PLAY_ID" | "TRACK_ENDED";
  mediaId?: string;
}

export interface ScannedTrack {
  id: string;
  title: string;
  artist: string;
  uri: string;
  durationMs: number;
  format: "FLAC" | "MP3" | "M4A" | "WAV" | "AAC";
  folder: string;
  pathHint?: string;
}

export interface PickedFolderResult {
  folderName: string;
  tracks: ScannedTrack[];
}

export const AudioEngine = {
  async openFile(path: string): Promise<{ durationMs: number }> {
    return NativeAudioEngine.openFile(path);
  },

  async scanDeviceAudio(): Promise<ScannedTrack[]> {
    if (Platform.OS !== "android") return [];
    return NativeAudioEngine.scanDeviceAudio();
  },

  async pickAndScanFolder(): Promise<PickedFolderResult | null> {
    if (Platform.OS !== "android") return null;
    return NativeAudioEngine.pickAndScanFolder();
  },

  play(): void {
    NativeAudioEngine.play();
  },

  pause(): void {
    NativeAudioEngine.pause();
  },

  stop(): void {
    NativeAudioEngine.stop();
  },

  seekTo(positionMs: number): void {
    NativeAudioEngine.seekTo(positionMs);
  },

  setBandParams(
    bandIndex: number,
    frequencyHz: number,
    gainDb: number,
    qFactor: number,
  ): void {
    NativeAudioEngine.setBandParams(bandIndex, frequencyHz, gainDb, qFactor);
  },

  setVisualizerEnabled(enabled: boolean): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.setVisualizerEnabled(enabled);
    } catch {}
  },

  setNormalizationEnabled(enabled: boolean): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.setNormalizationEnabled(enabled);
    } catch {}
  },

  setMixerFadeSeconds(seconds: number): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.setMixerFadeSeconds(seconds);
    } catch {}
  },

  async getPlaybackStatus(): Promise<PlaybackStatus> {
    return NativeAudioEngine.getPlaybackStatus();
  },

  async getVisualizerData(): Promise<{ spectrum: number[]; waveform: number[] }> {
    if (Platform.OS !== "android") return { spectrum: [], waveform: [] };
    try {
      return await NativeAudioEngine.getVisualizerData();
    } catch {
      return { spectrum: [], waveform: [] };
    }
  },

  syncAutoQueue(
    tracks: Array<{ id: string; title: string; artist: string; durationMs: number; folder?: string }>,
  ): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.syncAutoQueue(JSON.stringify(tracks));
    } catch {
      // Safe fallback
    }
  },

  startForegroundService(
    title: string,
    artist: string,
    isPlaying: boolean,
    durationMs: number = 0,
    positionMs: number = 0,
  ): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.startForegroundService(
        title,
        artist,
        isPlaying,
        durationMs,
        positionMs,
      );
    } catch {
      // Safe fallback
    }
  },

  stopForegroundService(): void {
    if (Platform.OS !== "android") return;
    try {
      NativeAudioEngine.stopForegroundService();
    } catch {
      // Safe fallback
    }
  },

  onBluetoothDeviceConnected(
    callback: (event: BluetoothDeviceEvent) => void,
  ): EmitterSubscription | null {
    if (!eventEmitter) return null;
    return eventEmitter.addListener("onBluetoothDeviceConnected", callback);
  },

  onMediaButtonAction(
    callback: (event: MediaButtonEvent) => void,
  ): EmitterSubscription | null {
    if (!eventEmitter) return null;
    return eventEmitter.addListener("onMediaButtonAction", callback);
  },
};

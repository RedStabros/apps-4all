import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { AmbientSoundType } from "../store/useTimerStore";

let ambientPlayer: AudioPlayer | null = null;
let chimePlayer: AudioPlayer | null = null;
let currentPlayingType: AmbientSoundType = "none";

// Helper to construct a 16-bit mono PCM WAV base64 string
function createWavBase64(
  sampleRate: number,
  durationSec: number,
  sampleGenerator: (t: number, index: number) => number,
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF chunk
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46;
  const fileSize = 36 + dataSize;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45;

  // fmt chunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20;
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0;
  buffer[20] = 1; buffer[21] = 0;
  buffer[22] = 1; buffer[23] = 0;
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  const byteRate = sampleRate * 2;
  buffer[28] = byteRate & 0xff;
  buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff;
  buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = 2; buffer[33] = 0;
  buffer[34] = 16; buffer[35] = 0;

  // data chunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61;
  buffer[40] = dataSize & 0xff;
  buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff;
  buffer[43] = (dataSize >> 24) & 0xff;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = sampleGenerator(t, i);
    s = Math.max(-1, Math.min(1, s));
    const intSample = Math.floor(s < 0 ? s * 0x8000 : s * 0x7fff);
    buffer[offset++] = intSample & 0xff;
    buffer[offset++] = (intSample >> 8) & 0xff;
  }

  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return typeof btoa === "function" ? btoa(binary) : "";
}

async function ensureCachedWav(
  fileName: string,
  generator: () => string,
): Promise<string> {
  const path = `${FileSystem.cacheDirectory}enfoque_${fileName}.wav`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;

  const base64 = generator();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

function generateChimeBase64(): string {
  return createWavBase64(11025, 1.5, (t) => {
    const f1 = Math.sin(2 * Math.PI * 523.25 * t);
    const f2 = 0.4 * Math.sin(2 * Math.PI * 783.99 * t);
    const decay = Math.exp(-3.5 * t);
    return (f1 + f2) * decay * 0.8;
  });
}

function generateAmbientBase64(type: AmbientSoundType): string {
  const sampleRate = 8000;
  const duration = 2.0;

  if (type === "whitenoise") {
    return createWavBase64(sampleRate, duration, () => (Math.random() * 2 - 1) * 0.15);
  }

  if (type === "rain") {
    let last = 0;
    return createWavBase64(sampleRate, duration, () => {
      const white = Math.random() * 2 - 1;
      last = last * 0.85 + white * 0.15;
      const drop = Math.random() > 0.995 ? Math.random() * 0.4 : 0;
      return (last + drop) * 0.35;
    });
  }

  if (type === "waves") {
    let last = 0;
    return createWavBase64(sampleRate, duration, (t) => {
      const white = Math.random() * 2 - 1;
      last = last * 0.9 + white * 0.1;
      const waveMod = (Math.sin(2 * Math.PI * 0.5 * t) + 1) * 0.5;
      return last * waveMod * 0.4;
    });
  }

  // cafe
  let last = 0;
  return createWavBase64(sampleRate, duration, (t) => {
    const white = Math.random() * 2 - 1;
    last = last * 0.92 + white * 0.08;
    const lowHum = Math.sin(2 * Math.PI * 120 * t) * 0.08;
    return (last + lowHum) * 0.3;
  });
}

export async function playChimeSound(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
    const uri = await ensureCachedWav("chime", generateChimeBase64);
    if (chimePlayer) {
      try {
        chimePlayer.remove();
      } catch {
        // ignore
      }
      chimePlayer = null;
    }
    const player = createAudioPlayer({ uri });
    player.volume = 0.85;
    player.play();
    chimePlayer = player;
  } catch (e) {
    console.warn("Failed to play chime", e);
  }
}

export async function playAmbientSound(type: AmbientSoundType): Promise<void> {
  if (type === currentPlayingType && ambientPlayer) return;

  await stopAmbientSound();
  if (type === "none") return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    const uri = await ensureCachedWav(type, () => generateAmbientBase64(type));
    const player = createAudioPlayer({ uri });
    player.loop = true;
    player.volume = 0.5;
    player.play();

    ambientPlayer = player;
    currentPlayingType = type;
  } catch (e) {
    console.warn("Failed to play ambient sound", e);
  }
}

export async function stopAmbientSound(): Promise<void> {
  if (ambientPlayer) {
    try {
      ambientPlayer.pause();
      ambientPlayer.remove();
    } catch {
      // ignore
    }
    ambientPlayer = null;
  }
  currentPlayingType = "none";
}

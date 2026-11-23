import { Audio } from "expo-av";
import { AmbientSoundType } from "../store/useTimerStore";

let ambientSoundInstance: Audio.Sound | null = null;
let currentPlayingType: AmbientSoundType = "none";

// Helper to construct a 16-bit mono PCM WAV data URI
function createWavDataUri(
  sampleRate: number,
  durationSec: number,
  sampleGenerator: (t: number, index: number) => number,
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF chunk
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  const fileSize = 36 + dataSize;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // fmt chunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // SubChunk1Size (16 for PCM)
  buffer[20] = 1; buffer[21] = 0; // AudioFormat (1 = PCM)
  buffer[22] = 1; buffer[23] = 0; // NumChannels (1 = mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  const byteRate = sampleRate * 2;
  buffer[28] = byteRate & 0xff;
  buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff;
  buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = 2; buffer[33] = 0; // BlockAlign (channels * bits / 8)
  buffer[34] = 16; buffer[35] = 0; // BitsPerSample (16)

  // data chunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
  buffer[40] = dataSize & 0xff;
  buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff;
  buffer[43] = (dataSize >> 24) & 0xff;

  // Samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = sampleGenerator(t, i);
    s = Math.max(-1, Math.min(1, s));
    const intSample = Math.floor(s < 0 ? s * 0x8000 : s * 0x7fff);
    buffer[offset++] = intSample & 0xff;
    buffer[offset++] = (intSample >> 8) & 0xff;
  }

  // Base64 encode
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return `data:audio/wav;base64,${base64}`;
}

// Generate bell chime
function getChimeUri(): string {
  return createWavDataUri(11025, 1.5, (t) => {
    // Fundamental C5 (523.25 Hz) + harmonic G5 (784 Hz) with natural exponential decay
    const f1 = Math.sin(2 * Math.PI * 523.25 * t);
    const f2 = 0.4 * Math.sin(2 * Math.PI * 783.99 * t);
    const decay = Math.exp(-3.5 * t);
    return (f1 + f2) * decay * 0.8;
  });
}

// Generate ambient noises
function getAmbientUri(type: AmbientSoundType): string | null {
  if (type === "none") return null;

  const sampleRate = 8000;
  const duration = 2.0;

  if (type === "whitenoise") {
    return createWavDataUri(sampleRate, duration, () => {
      return (Math.random() * 2 - 1) * 0.15;
    });
  }

  if (type === "rain") {
    // Low-pass filtered noise with random droplet impulses
    let last = 0;
    return createWavDataUri(sampleRate, duration, (t, i) => {
      const white = Math.random() * 2 - 1;
      last = last * 0.85 + white * 0.15; // smooth rain hiss
      const drop = Math.random() > 0.995 ? (Math.random() * 0.4) : 0;
      return (last + drop) * 0.35;
    });
  }

  if (type === "waves") {
    // Slow oscillatory envelope on filtered noise
    let last = 0;
    return createWavDataUri(sampleRate, duration, (t) => {
      const white = Math.random() * 2 - 1;
      last = last * 0.9 + white * 0.1;
      const waveMod = (Math.sin(2 * Math.PI * 0.5 * t) + 1) * 0.5; // slow swelling waves
      return last * waveMod * 0.4;
    });
  }

  if (type === "cafe") {
    // Gentle warm background hum
    let last = 0;
    return createWavDataUri(sampleRate, duration, (t) => {
      const white = Math.random() * 2 - 1;
      last = last * 0.92 + white * 0.08;
      const lowHum = Math.sin(2 * Math.PI * 120 * t) * 0.08;
      return (last + lowHum) * 0.3;
    });
  }

  return null;
}

export async function playChimeSound(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    const chimeUri = getChimeUri();
    const { sound } = await Audio.Sound.createAsync(
      { uri: chimeUri },
      { shouldPlay: true, volume: 0.85 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (e) {
    console.warn("Failed to play chime", e);
  }
}

export async function playAmbientSound(type: AmbientSoundType): Promise<void> {
  if (type === currentPlayingType && ambientSoundInstance) return;

  await stopAmbientSound();
  if (type === "none") return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const uri = getAmbientUri(type);
    if (!uri) return;

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, isLooping: true, volume: 0.5 },
    );

    ambientSoundInstance = sound;
    currentPlayingType = type;
  } catch (e) {
    console.warn("Failed to play ambient sound", e);
  }
}

export async function stopAmbientSound(): Promise<void> {
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.stopAsync();
      await ambientSoundInstance.unloadAsync();
    } catch {}
    ambientSoundInstance = null;
  }
  currentPlayingType = "none";
}


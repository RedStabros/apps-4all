import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, AppState } from "react-native";
import { useTranslation } from "react-i18next";
import { Activity, BarChart3 } from "lucide-react-native";
import { AudioEngine } from "../../modules/audio-engine";

interface WaveformVisualizerProps {
  mode?: "waveform" | "spectrum";
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onSeek: (positionMs: number) => void;
}

const NUM_WAVE_BARS = 36;
const NUM_SPEC_BARS = 20;
const EMPTY_WAVE = Array(NUM_WAVE_BARS).fill(0.06);
const EMPTY_SPEC = Array(NUM_SPEC_BARS).fill(0.05);

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  mode = "waveform",
  isPlaying,
  positionMs,
  durationMs,
  onSeek,
}) => {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(300);
  const [spectrum, setSpectrum] = useState<number[]>(EMPTY_SPEC);
  const [waveform, setWaveform] = useState<number[]>(EMPTY_WAVE);
  const [isForeground, setIsForeground] = useState(
    AppState.currentState === "active",
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      setIsForeground(nextState === "active");
    });
    return () => sub.remove();
  }, []);

  // Poll real PCM audio data ONLY when playing AND app is in foreground (0% CPU in background/camera/car)
  useEffect(() => {
    const shouldRun = isPlaying && isForeground;
    AudioEngine.setVisualizerEnabled(shouldRun);

    if (!shouldRun) {
      if (!isPlaying) setSpectrum(EMPTY_SPEC);
      return;
    }

    let active = true;
    const poll = async () => {
      const data = await AudioEngine.getVisualizerData();
      if (!active) return;
      if (data.spectrum && data.spectrum.length > 0) {
        setSpectrum(data.spectrum);
      }
      if (data.waveform && data.waveform.length > 0) {
        setWaveform(data.waveform);
      }
    };

    poll();
    const id = setInterval(poll, 60); // ~16 fps smooth + battery friendly
    return () => {
      active = false;
      clearInterval(id);
      AudioEngine.setVisualizerEnabled(false);
    };
  }, [isPlaying, isForeground]);

  const progressFraction = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  if (mode === "spectrum") {
    return (
      <View className="w-full px-4 py-3 items-center">
        <View className="flex-row items-center justify-between w-full mb-2.5 px-1">
          <View className="flex-row items-center">
            <BarChart3 color="#2DD4BF" size={14} />
            <Text className="text-[10px] font-mono font-black text-teal-600 dark:text-teal-400 tracking-wider uppercase ml-1.5">
              {t("reproductor_spectrum", "Espectro Real")} • PCM FFT
            </Text>
          </View>
          <Text className="text-[10px] font-mono text-zinc-500 font-bold">
            {isPlaying
              ? t("reproductor_analyzing", "EN VIVO")
              : t("reproductor_paused", "PAUSADO")}
          </Text>
        </View>

        <View className="h-36 w-full bg-zinc-900 border border-zinc-800 rounded-2xl flex-row items-end justify-between px-3 pb-3 pt-4 overflow-hidden">
          {spectrum.map((val, idx) => {
            const pct = Math.max(5, Math.min(96, Math.round(val * 100)));
            return (
              <View
                key={idx}
                className="flex-1 mx-[1.5px] h-full justify-end items-center"
              >
                <View
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-sm ${
                    pct > 72
                      ? "bg-teal-300"
                      : pct > 38
                        ? "bg-teal-500"
                        : "bg-teal-700/90"
                  }`}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full px-4 py-3 items-center">
      <View className="flex-row items-center justify-between w-full mb-2.5 px-1">
        <View className="flex-row items-center">
          <Activity color="#2DD4BF" size={14} />
          <Text className="text-[10px] font-mono font-black text-teal-600 dark:text-teal-400 tracking-wider uppercase ml-1.5">
            {t("reproductor_waveform", "Onda Real")} • Oboe PCM
          </Text>
        </View>
        <Text className="text-[10px] font-mono text-zinc-500 font-bold">
          {isPlaying
            ? t("reproductor_analyzing", "EN VIVO")
            : t("reproductor_paused", "PAUSADO")}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setContainerWidth(w);
        }}
        onPress={(e) => {
          if (durationMs <= 0) return;
          const touchX = e.nativeEvent.locationX;
          const targetFraction = Math.max(
            0,
            Math.min(1, touchX / Math.max(1, containerWidth)),
          );
          onSeek(targetFraction * durationMs);
        }}
        className="h-32 w-full bg-zinc-900 border border-zinc-800 rounded-2xl flex-row items-center justify-between px-3 relative overflow-hidden"
      >
        <View
          style={{ left: `${progressFraction * 94 + 3}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-teal-400/80 z-10"
        />

        {waveform.map((amp, idx) => {
          const barHeightPct = Math.max(6, Math.min(92, Math.round(amp * 100)));
          const isRecent = idx >= waveform.length - 6;
          return (
            <View
              key={idx}
              className="flex-1 items-center justify-center h-full mx-[1px]"
            >
              <View
                style={{ height: `${barHeightPct}%` }}
                className={`w-1 rounded-full ${
                  isPlaying
                    ? isRecent
                      ? "bg-teal-300"
                      : "bg-teal-500/85"
                    : "bg-zinc-700"
                }`}
              />
            </View>
          );
        })}
      </TouchableOpacity>
    </View>
  );
};

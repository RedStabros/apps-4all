import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { useTranslation } from "react-i18next";
import { Activity, BarChart3 } from "lucide-react-native";
import { EQBand } from "../store/useAudioPlayerStore";

interface WaveformVisualizerProps {
  mode?: "waveform" | "spectrum";
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  bands?: EQBand[];
  onSeek: (positionMs: number) => void;
}

const NUM_BARS = 36;
const BASE_HEIGHTS = Array.from({ length: NUM_BARS }, (_, i) => {
  const x = (i / (NUM_BARS - 1)) * Math.PI;
  const harmonic1 = Math.sin(x);
  const harmonic2 = Math.sin(x * 3) * 0.3;
  const harmonic3 = Math.cos(x * 5) * 0.15;
  const raw = Math.abs(harmonic1 + harmonic2 + harmonic3);
  return Math.max(0.18, Math.min(1.0, raw));
});

const SPECTRUM_BARS = 20;

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  mode = "waveform",
  isPlaying,
  positionMs,
  durationMs,
  bands = [],
  onSeek,
}) => {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(300);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(0);
    }
    return () => {
      animation?.stop();
    };
  }, [isPlaying, pulseAnim]);

  const progressFraction = durationMs > 0 ? positionMs / durationMs : 0;
  const activeBarIndex = Math.floor(progressFraction * NUM_BARS);

  if (mode === "spectrum") {
    return (
      <View className="w-full px-4 py-4 items-center">
        <View className="flex-row items-center justify-between w-full mb-3 px-2">
          <View className="flex-row items-center">
            <BarChart3 color="#2DD4BF" size={14} />
            <Text className="text-[10px] font-mono font-black text-teal-400 tracking-wider uppercase ml-1.5">
              {t("reproductor_spectrum", "Espectro EQ")} • 5-Band DSP
            </Text>
          </View>
          <Text className="text-[10px] font-mono text-zinc-500 font-bold">
            {isPlaying
              ? t("reproductor_analyzing", "PROCESANDO PCM")
              : t("reproductor_paused", "PAUSADO")}
          </Text>
        </View>

        <View className="h-36 w-full bg-zinc-900/95 border border-zinc-800 rounded-2xl flex-row items-end justify-between px-3 pb-3 pt-4 overflow-hidden">
          {Array.from({ length: SPECTRUM_BARS }, (_, idx) => {
            const bandIdx = Math.min(
              Math.max(0, bands.length - 1),
              Math.floor((idx / SPECTRUM_BARS) * Math.max(1, bands.length)),
            );
            const bandGain = bands[bandIdx]?.gainDb ?? 0;
            const normalizedGain = (bandGain + 15) / 30; // 0..1
            const phaseOffset = Math.abs(Math.sin(idx * 0.7 + (positionMs / 400)));
            const basePct = isPlaying
              ? Math.max(18, Math.min(95, Math.round((0.35 + normalizedGain * 0.45 + phaseOffset * 0.25) * 100)))
              : Math.max(12, Math.round((0.18 + normalizedGain * 0.3) * 100));

            const scaleY = pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.75 + (idx % 3) * 0.08, 1.0],
            });

            return (
              <Animated.View
                key={idx}
                style={{
                  height: `${basePct}%`,
                  transform: [{ scaleY: isPlaying ? scaleY : 1 }],
                }}
                className={`flex-1 mx-0.5 rounded-t-md ${
                  basePct > 75
                    ? "bg-teal-300"
                    : basePct > 45
                      ? "bg-teal-500"
                      : "bg-teal-700"
                }`}
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full px-4 py-4 items-center">
      {/* Indicador de estado audiófilo */}
      <View className="flex-row items-center justify-between w-full mb-3 px-2">
        <View className="flex-row items-center">
          <Activity color="#2DD4BF" size={14} />
          <Text className="text-[10px] font-mono font-black text-teal-400 tracking-wider uppercase ml-1.5">
            {t("reproductor_waveform", "Forma de Onda")} • Oboe DSP
          </Text>
        </View>
        <Text className="text-[10px] font-mono text-zinc-500 font-bold">
          {isPlaying
            ? t("reproductor_analyzing", "PROCESANDO PCM")
            : t("reproductor_paused", "PAUSADO")}
        </Text>
      </View>

      {/* Contenedor interactivo de barras */}
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
        className="h-32 w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl flex-row items-center justify-between px-3 relative overflow-hidden"
      >
        {/* Marcador de cabeza de reproducción */}
        <View
          style={{ left: `${progressFraction * 94 + 3}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-10 shadow-lg shadow-teal-500"
        />

        {BASE_HEIGHTS.map((baseHeight, idx) => {
          const isPassed = idx <= activeBarIndex;
          const barHeightPct = Math.round(baseHeight * 85);

          return (
            <View
              key={idx}
              className="flex-1 items-center justify-center h-full mx-0.5"
            >
              <View
                style={{ height: `${barHeightPct}%` }}
                className={`w-1.5 rounded-full ${
                  isPassed ? "bg-teal-400" : "bg-zinc-800"
                }`}
              />
            </View>
          );
        })}
      </TouchableOpacity>
    </View>
  );
};

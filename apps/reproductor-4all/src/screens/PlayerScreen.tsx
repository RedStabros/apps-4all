import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Easing,
  Modal,
  Platform,
  PermissionsAndroid,
  TextInput,
  Alert,
  AppState,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  useAudioPlayerStore,
  DEFAULT_EQ_PRESETS,
} from "../store/useAudioPlayerStore";
import { AudioEngine } from "../../modules/audio-engine";
import { WaveformVisualizer } from "../components/WaveformVisualizer";
import { FileExplorerModal } from "../components/FileExplorerModal";
import { BluetoothProfilesModal } from "../components/BluetoothProfilesModal";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sliders,
  Disc,
  Bluetooth,
  Music,
  Settings,
  X,
  Sparkles,
  Volume2,
  FolderOpen,
  Activity,
  Trash2,
  Shuffle,
  Repeat,
  Repeat1,
  Moon,
  BarChart3,
  EyeOff,
  RotateCcw,
} from "lucide-react-native";

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export default function PlayerScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";
  const mutedHex = isDark ? "#A1A1AA" : "#71717A";

  const {
    playlist,
    currentTrackIndex,
    isPlaying,
    positionMs,
    durationMs,
    bands,
    currentProfileId,
    activeBluetoothDevice,
    shuffleMode,
    repeatMode,
    sleepTimerEndAt,
    togglePlayPause,
    play,
    pause,
    playByMediaId,
    nextTrack,
    previousTrack,
    seekTo,
    updatePosition,
    cycleShuffleMode,
    cycleRepeatMode,
    setSleepTimer,
    setBandGain,
    applyProfile,
    handleBluetoothDeviceConnected,
    removeTrack,
    createSavedPlaylist,
    normalizationEnabled,
    mixerFadeSeconds,
    setNormalizationEnabled,
    setMixerFadeSeconds,
  } = useAudioPlayerStore();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [eqModalVisible, setEqModalVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [saveListName, setSaveListName] = useState("");
  const [explorerModalVisible, setExplorerModalVisible] = useState(false);
  const [btModalVisible, setBtModalVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<
    "waveform" | "spectrum" | "vinyl" | "off"
  >("spectrum");
  const [timelineWidth, setTimelineWidth] = useState(300);
  const [sleepRemainingMin, setSleepRemainingMin] = useState<number | null>(
    null,
  );

  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Vinyl rotation animation
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else {
      rotateAnim.stopAnimation();
    }
    return () => {
      animation?.stop();
    };
  }, [isPlaying, rotateAnim]);

  // Sleep Timer watcher
  useEffect(() => {
    if (!sleepTimerEndAt) {
      setSleepRemainingMin(null);
      return;
    }

    const checkTimer = () => {
      const remainingMs = sleepTimerEndAt - Date.now();
      if (remainingMs <= 0) {
        pause();
        setSleepTimer(null);
        setSleepRemainingMin(null);
      } else {
        setSleepRemainingMin(Math.ceil(remainingMs / 60000));
      }
    };

    checkTimer();
    const id = setInterval(checkTimer, 5000);
    return () => clearInterval(id);
  }, [sleepTimerEndAt, pause, setSleepTimer]);

  // Native Bluetooth, Android Auto MediaSession buttons & playback progress polling
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      typeof Platform.Version === "number" &&
      Platform.Version >= 31
    ) {
      PermissionsAndroid.request(
        "android.permission.BLUETOOTH_CONNECT" as Parameters<
          typeof PermissionsAndroid.request
        >[0],
      ).catch(() => {});
    }

    const btSub = AudioEngine.onBluetoothDeviceConnected((event) => {
      handleBluetoothDeviceConnected(event.deviceName);
    });

    const mediaSub = AudioEngine.onMediaButtonAction((event) => {
      if (event.action === "NEXT") nextTrack(false);
      else if (event.action === "TRACK_ENDED") nextTrack(true);
      else if (event.action === "PREVIOUS") previousTrack();
      else if (event.action === "PLAY") play();
      else if (event.action === "PAUSE") pause();
      else if (event.action === "PLAY_ID" && event.mediaId) {
        playByMediaId(event.mediaId);
      }
    });

    const interval = setInterval(async () => {
      if (isPlaying && AppState.currentState === "active") {
        try {
          const status = await AudioEngine.getPlaybackStatus();
          if (status?.isFinished) {
            nextTrack(true);
            return;
          }
          if (status?.positionMs !== undefined) {
            updatePosition(status.positionMs);
            if (durationMs > 0 && status.positionMs >= durationMs - 600) {
              nextTrack(true);
            }
          } else {
            const nextPos = Math.min(positionMs + 500, durationMs);
            updatePosition(nextPos);
            if (durationMs > 0 && nextPos >= durationMs) {
              nextTrack(true);
            }
          }
        } catch {
          const nextPos = Math.min(positionMs + 500, durationMs);
          updatePosition(nextPos);
          if (durationMs > 0 && nextPos >= durationMs) {
            nextTrack(true);
          }
        }
      }
    }, 500);

    return () => {
      btSub?.remove();
      mediaSub?.remove();
      clearInterval(interval);
    };
  }, [
    isPlaying,
    positionMs,
    durationMs,
    nextTrack,
    previousTrack,
    play,
    pause,
    playByMediaId,
    updatePosition,
    handleBluetoothDeviceConnected,
  ]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const currentTrack = playlist[currentTrackIndex] || {
    title: t("reproductor_empty", "Sin pistas de audio en cola"),
    artist: t("reproductor_tap_explore", "Toca Explorar para cargar carpetas"),
    format: "FLAC" as const,
  };

  const progressPercent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  const shuffleLabel =
    shuffleMode === "cycle"
      ? t("reproductor_shuffle_cycle", "Sin repetir")
      : shuffleMode === "full"
        ? t("reproductor_shuffle_full", "Aleatorio total")
        : t("reproductor_shuffle_off", "Ordenado");

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      {/* Header */}
      <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800/80">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 items-center justify-center mr-2.5">
            <Volume2 color={accentHex} size={20} />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-black text-zinc-900 dark:text-white tracking-tight"
              numberOfLines={1}
            >
              {t("reproductor_title", "Reproductor 4All")}
            </Text>
            <Text
              className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider"
              numberOfLines={1}
            >
              {t("reproductor_low_latency", "Google Oboe (Baja Latencia)")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          {/* Sleep Timer Button */}
          <TouchableOpacity
            onPress={() => setSleepModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_sleep_timer", "Temporizador")}
            className={`p-2.5 rounded-xl border flex-row items-center ${
              sleepRemainingMin !== null
                ? "bg-teal-500/15 border-teal-500/40"
                : "bg-zinc-100 dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700/60"
            }`}
          >
            <Moon
              color={sleepRemainingMin !== null ? accentHex : mutedHex}
              size={17}
            />
            {sleepRemainingMin !== null && (
              <Text className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 ml-1">
                {sleepRemainingMin}m
              </Text>
            )}
          </TouchableOpacity>

          {/* Bluetooth Manager Button */}
          <TouchableOpacity
            onPress={() => setBtModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_bt_manager", "Gestor Bluetooth & EQ")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 rounded-xl"
          >
            <Bluetooth
              color={activeBluetoothDevice ? accentHex : mutedHex}
              size={17}
            />
          </TouchableOpacity>

          {/* EQ Button */}
          <TouchableOpacity
            onPress={() => setEqModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_eq", "Ecualizador Paramétrico")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 rounded-xl"
          >
            <Sliders color={accentHex} size={17} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("settings", "Configuración")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 rounded-xl"
          >
            <Settings color={mutedHex} size={17} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Bluetooth Pill */}
      {activeBluetoothDevice && (
        <TouchableOpacity
          onPress={() => setBtModalVisible(true)}
          className="mx-5 mt-2.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 flex-row items-center self-start"
        >
          <Bluetooth color={accentHex} size={12} />
          <Text className="text-teal-700 dark:text-teal-400 text-[10px] font-bold ml-1.5">
            {activeBluetoothDevice} •{" "}
            {t("reproductor_calibrated_profile", "Perfil Calibrado")}
          </Text>
        </TouchableOpacity>
      )}

      {/* 4 Visualizer Modes: Waveform | Spectrum | Vinyl | Off */}
      <View className="flex-row justify-center mt-3 mb-1 px-4">
        <View className="flex-row bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setDisplayMode("waveform")}
            className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${
              displayMode === "waveform"
                ? "bg-teal-500/20 border border-teal-500/40"
                : ""
            }`}
          >
            <Activity
              color={displayMode === "waveform" ? accentHex : mutedHex}
              size={13}
            />
            <Text
              className={`text-[11px] font-bold ml-1 ${
                displayMode === "waveform"
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-zinc-500"
              }`}
            >
              {t("reproductor_waveform_short", "Onda")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDisplayMode("spectrum")}
            className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${
              displayMode === "spectrum"
                ? "bg-teal-500/20 border border-teal-500/40"
                : ""
            }`}
          >
            <BarChart3
              color={displayMode === "spectrum" ? accentHex : mutedHex}
              size={13}
            />
            <Text
              className={`text-[11px] font-bold ml-1 ${
                displayMode === "spectrum"
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-zinc-500"
              }`}
            >
              {t("reproductor_spectrum_short", "Espectro")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDisplayMode("vinyl")}
            className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${
              displayMode === "vinyl"
                ? "bg-teal-500/20 border border-teal-500/40"
                : ""
            }`}
          >
            <Disc
              color={displayMode === "vinyl" ? accentHex : mutedHex}
              size={13}
            />
            <Text
              className={`text-[11px] font-bold ml-1 ${
                displayMode === "vinyl"
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-zinc-500"
              }`}
            >
              {t("reproductor_vinyl", "Vinilo")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDisplayMode("off")}
            className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${
              displayMode === "off"
                ? "bg-teal-500/20 border border-teal-500/40"
                : ""
            }`}
          >
            <EyeOff
              color={displayMode === "off" ? accentHex : mutedHex}
              size={13}
            />
            <Text
              className={`text-[11px] font-bold ml-1 ${
                displayMode === "off"
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-zinc-500"
              }`}
            >
              {t("reproductor_vis_off", "Off")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Display */}
      <View className="flex-1 items-center justify-center px-5">
        {displayMode === "waveform" || displayMode === "spectrum" ? (
          <WaveformVisualizer
            mode={displayMode}
            isPlaying={isPlaying}
            positionMs={positionMs}
            durationMs={durationMs}
            onSeek={seekTo}
          />
        ) : displayMode === "vinyl" ? (
          <View className="w-56 h-56 rounded-full bg-zinc-900 border-4 border-zinc-800 items-center justify-center shadow-2xl relative">
            <View className="w-44 h-44 rounded-full border border-zinc-800/80 items-center justify-center">
              <View className="w-32 h-32 rounded-full border border-zinc-800/60 items-center justify-center">
                <Animated.View
                  style={{ transform: [{ rotate: spin }] }}
                  className="w-20 h-20 rounded-full bg-teal-500 items-center justify-center border-2 border-teal-300/40"
                >
                  <Disc color="#09090b" size={32} />
                </Animated.View>
              </View>
            </View>

            <View className="absolute bottom-2 px-3 py-1 bg-zinc-950/90 border border-teal-500/40 rounded-full">
              <Text className="text-[10px] font-black tracking-widest text-teal-400 uppercase">
                {currentTrack.format} •{" "}
                {t("reproductor_bit_perfect", "OBOE DSP")}
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-24 h-24 rounded-3xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 items-center justify-center">
            <Music color={accentHex} size={38} />
          </View>
        )}

        {/* Track Info */}
        <View className="items-center mt-5 px-4 w-full">
          <Text
            className="text-xl font-black text-zinc-900 dark:text-white text-center tracking-tight"
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          <Text
            className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-1 text-center"
            numberOfLines={1}
          >
            {currentTrack.artist}
          </Text>

          {/* Active Shuffle Mode Status Pill */}
          {shuffleMode !== "off" && (
            <View className="mt-2 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30">
              <Text className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                {shuffleLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Playback Controls & Progress Bar */}
      <View className="px-6 pb-9">
        {/* Timeline Bar */}
        <View className="mb-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) setTimelineWidth(w);
            }}
            onPress={(e) => {
              if (durationMs <= 0) return;
              const touchX = e.nativeEvent.locationX;
              const targetMs = (touchX / Math.max(1, timelineWidth)) * durationMs;
              seekTo(Math.max(0, Math.min(targetMs, durationMs)));
            }}
            className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative"
          >
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-teal-500 rounded-full"
            />
          </TouchableOpacity>

          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
              {formatTime(positionMs)}
            </Text>
            <Text className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-500">
              {formatTime(durationMs)}
            </Text>
          </View>
        </View>

        {/* Transport Buttons: Shuffle (3-mode) | Prev | Play/Pause | Next | Repeat */}
        <View className="flex-row justify-between items-center px-1">
          <TouchableOpacity
            onPress={cycleShuffleMode}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={shuffleLabel}
            className={`p-2.5 rounded-2xl border items-center justify-center ${
              shuffleMode !== "off"
                ? "bg-teal-500/15 border-teal-500/40"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Shuffle
              color={shuffleMode !== "off" ? accentHex : mutedHex}
              size={20}
            />
            {shuffleMode === "full" && (
              <Text className="text-[8px] font-black text-teal-600 dark:text-teal-400 -mt-0.5">
                ∞
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={previousTrack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_prev", "Anterior")}
            className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
          >
            <SkipBack color={mutedHex} size={23} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying
                ? t("voz_pause", "Pausar")
                : t("reproductor_play_now", "Reproducir")
            }
            className="w-16 h-16 rounded-3xl bg-teal-600 dark:bg-teal-500 items-center justify-center shadow-lg"
          >
            {isPlaying ? (
              <Pause color="#09090b" size={28} />
            ) : (
              <Play color="#09090b" size={28} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => nextTrack(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_next", "Siguiente")}
            className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
          >
            <SkipForward color={mutedHex} size={23} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cycleRepeatMode}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("reproductor_repeat", "Repetir")}
            className={`p-2.5 rounded-2xl border items-center justify-center ${
              repeatMode !== "off"
                ? "bg-teal-500/15 border-teal-500/40"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {repeatMode === "one" ? (
              <Repeat1 color={accentHex} size={20} />
            ) : (
              <Repeat
                color={repeatMode === "all" ? accentHex : mutedHex}
                size={20}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Drawer Toggles */}
        <View className="flex-row justify-center gap-2.5 mt-6">
          <TouchableOpacity
            onPress={() => setExplorerModalVisible(true)}
            className="flex-row items-center px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl"
          >
            <FolderOpen color="#2DD4BF" size={14} />
            <Text className="text-zinc-200 font-bold text-xs ml-1.5">
              {t("reproductor_scan_music", "Explorar Audio")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPlaylistModalVisible(true)}
            className="flex-row items-center px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl"
          >
            <Music color="#A1A1AA" size={14} />
            <Text className="text-zinc-200 font-bold text-xs ml-1.5">
              {t("reproductor_playlist", "Lista")} ({playlist.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEqModalVisible(true)}
            className="flex-row items-center px-3.5 py-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl"
          >
            <Sparkles color={accentHex} size={14} />
            <Text className="text-teal-700 dark:text-teal-400 font-bold text-xs uppercase ml-1.5">
              {t("reproductor_dsp_eq", "DSP EQ (5 Bandas)")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleep Timer Modal */}
      <Modal
        visible={sleepModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSleepModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-6">
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Moon color="#2DD4BF" size={20} />
                <Text className="text-lg font-black text-white ml-2">
                  {t("reproductor_sleep_timer", "Temporizador de Apagado")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSleepModalVisible(false)}
                className="p-2 bg-zinc-800 rounded-full"
              >
                <X color="#A1A1AA" size={18} />
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              {[null, 15, 30, 45, 60].map((mins) => (
                <TouchableOpacity
                  key={String(mins)}
                  onPress={() => {
                    setSleepTimer(mins);
                    setSleepModalVisible(false);
                  }}
                  className="py-3 px-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex-row justify-between items-center"
                >
                  <Text className="text-white font-bold text-sm">
                    {mins === null
                      ? t("reproductor_sleep_off", "Desactivado")
                      : `${mins} min`}
                  </Text>
                  {mins === null && sleepTimerEndAt === null && (
                    <Text className="text-teal-400 text-xs font-bold">●</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ecualizador Paramétrico de 5 Bandas */}
      <Modal
        visible={eqModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEqModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-6 pt-6 pb-14 max-h-[82%]">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-lg font-black text-white">
                  {t("reproductor_eq", "Ecualizador Paramétrico")}
                </Text>
                <Text className="text-xs text-zinc-400">
                  {t(
                    "reproductor_biquad_subtitle",
                    "Filtros Biquad C++ • Tiempo Real • Sin Pérdida",
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEqModalVisible(false)}
                className="p-2 bg-zinc-800 rounded-full"
              >
                <X color="#A1A1AA" size={18} />
              </TouchableOpacity>
            </View>

            {/* Presets (Audífonos, Parlante Celular, Carro / Android Auto, Bluetooth, etc.) */}
            <Text className="text-xs font-bold text-zinc-400 mb-2 uppercase">
              {t("reproductor_presets", "Perfiles de Audio")}
            </Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              className="mb-5"
            >
              <View className="flex-row gap-2">
                {DEFAULT_EQ_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => applyProfile(preset.id)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      currentProfileId === preset.id
                        ? "bg-teal-500/20 border-teal-500"
                        : "bg-zinc-800/80 border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        currentProfileId === preset.id
                          ? "text-teal-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Classic 5-Band Vertical Console EQ */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-mono text-zinc-400">
                +15 dB  •  0 dB (Centro)  •  -15 dB
              </Text>
              <TouchableOpacity
                onPress={() => applyProfile("flat")}
                className="flex-row items-center px-2.5 py-1 bg-zinc-800 rounded-lg"
              >
                <RotateCcw color="#2DD4BF" size={12} />
                <Text className="text-[10px] font-bold text-teal-400 ml-1">
                  {t("reproductor_eq_reset", "Plano (0 dB)")}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <View className="flex-row justify-between items-end h-52">
                {bands.map((band, idx) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, ((band.gainDb + 15) / 30) * 100),
                  );
                  const freqLabel =
                    band.frequencyHz >= 1000
                      ? `${band.frequencyHz / 1000}kHz`
                      : `${band.frequencyHz}Hz`;
                  return (
                    <View
                      key={band.id}
                      className="flex-1 items-center h-full justify-between"
                    >
                      <Text className="text-[10px] font-mono font-bold text-teal-400 mb-1">
                        {band.gainDb > 0
                          ? `+${band.gainDb.toFixed(0)}`
                          : band.gainDb.toFixed(0)}
                      </Text>

                      {/* Interactive Vertical Fader Track */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={(e) => {
                          const trackH = 140;
                          const y = Math.max(
                            0,
                            Math.min(trackH, e.nativeEvent.locationY),
                          );
                          const rawGain = 15 - (y / trackH) * 30;
                          const snapped = Math.round(rawGain * 2) / 2; // 0.5 dB steps
                          setBandGain(idx, Math.max(-15, Math.min(15, snapped)));
                        }}
                        style={{ height: 140 }}
                        className="w-10 items-center justify-center relative"
                      >
                        {/* 0 dB center tick */}
                        <View className="absolute left-1 right-1 h-[1px] bg-zinc-700" />
                        {/* Vertical rail */}
                        <View className="w-2.5 h-full bg-zinc-800 rounded-full overflow-hidden justify-end">
                          <View
                            style={{ height: `${pct}%` }}
                            className="w-full bg-teal-500 rounded-full"
                          />
                        </View>
                        {/* Fader knob */}
                        <View
                          style={{ bottom: `${pct}%`, marginBottom: -8 }}
                          className="absolute w-5 h-4 rounded-md bg-teal-300 border-2 border-zinc-950"
                        />
                      </TouchableOpacity>

                      {/* Fine +/- buttons */}
                      <View className="flex-row gap-1 mt-1.5">
                        <TouchableOpacity
                          onPress={() =>
                            setBandGain(idx, Math.max(-15, band.gainDb - 1.5))
                          }
                          className="w-5 h-5 bg-zinc-800 rounded items-center justify-center"
                        >
                          <Text className="text-zinc-300 text-xs font-bold">
                            -
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setBandGain(idx, Math.min(15, band.gainDb + 1.5))
                          }
                          className="w-5 h-5 bg-zinc-800 rounded items-center justify-center"
                        >
                          <Text className="text-zinc-300 text-xs font-bold">
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text className="text-[10px] font-bold text-zinc-400 mt-1">
                        {freqLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* DSP Extras: Normalizar Volumen + Mixer Fade */}
            <View className="mt-4 gap-2.5">
              <View className="flex-row items-center justify-between bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3">
                <View className="flex-1 mr-3">
                  <Text className="text-xs font-black text-white">
                    {t("reproductor_normalize", "Normalizar Volumen")}
                  </Text>
                  <Text className="text-[10px] text-zinc-400">
                    {t(
                      "reproductor_normalize_desc",
                      "Nivela el volumen entre canciones (-14 dBFS)",
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setNormalizationEnabled(!normalizationEnabled)}
                  className={`px-3.5 py-1.5 rounded-xl border ${
                    normalizationEnabled
                      ? "bg-teal-500/20 border-teal-500"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-black ${
                      normalizationEnabled ? "text-teal-400" : "text-zinc-400"
                    }`}
                  >
                    {normalizationEnabled ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3">
                <View className="flex-1 mr-3">
                  <Text className="text-xs font-black text-white">
                    {t("reproductor_mixer", "Mixer Suave (Fade + Sin Silencios)")}
                  </Text>
                  <Text className="text-[10px] text-zinc-400">
                    {t(
                      "reproductor_mixer_desc",
                      "Fade-in/out suave y omite silencios iniciales",
                    )}
                  </Text>
                </View>
                <View className="flex-row gap-1">
                  {([0, 3, 5] as const).map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      onPress={() => setMixerFadeSeconds(sec)}
                      className={`px-2.5 py-1.5 rounded-lg border ${
                        mixerFadeSeconds === sec
                          ? "bg-teal-500/20 border-teal-500"
                          : "bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          mixerFadeSeconds === sec
                            ? "text-teal-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {sec === 0 ? "Off" : `${sec}s`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Lista de Pistas (Virtualized FlatList) */}
      <Modal
        visible={playlistModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPlaylistModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/70"
        >
          <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-6 pt-6 pb-14 max-h-[75%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-lg font-black text-white">
                  {t("reproductor_queue", "Cola de Reproducción")}
                </Text>
                <Text className="text-xs text-zinc-400">
                  {playlist.length} {t("reproductor_tracks", "pistas")}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setPlaylistModalVisible(false);
                    setExplorerModalVisible(true);
                  }}
                  className="flex-row items-center px-3 py-2 bg-teal-500 rounded-xl"
                >
                  <FolderOpen color="#09090b" size={14} />
                  <Text className="text-zinc-950 font-black text-xs ml-1.5">
                    {t("reproductor_add_local", "+ Importar")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPlaylistModalVisible(false)}
                  className="p-2 bg-zinc-800 rounded-full"
                >
                  <X color="#A1A1AA" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            {playlist.length > 0 && (
              <View className="flex-row items-center gap-2 mb-3">
                <TextInput
                  value={saveListName}
                  onChangeText={setSaveListName}
                  placeholder={t(
                    "reproductor_save_queue_placeholder",
                    "Nombre para guardar esta lista...",
                  )}
                  placeholderTextColor="#71717A"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs"
                />
                <TouchableOpacity
                  onPress={() => {
                    const name = saveListName.trim();
                    if (!name) return;
                    createSavedPlaylist(name, playlist);
                    setSaveListName("");
                    Alert.alert(
                      t("reproductor_list_saved", "Lista guardada"),
                      `"${name}" (${playlist.length})`,
                    );
                  }}
                  className="px-3.5 py-2.5 bg-teal-500/20 border border-teal-500/40 rounded-xl"
                >
                  <Text className="text-teal-300 font-bold text-xs">
                    {t("save", "Guardar")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={playlist}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View className="py-12 items-center justify-center">
                  <Music color="#52525B" size={40} />
                  <Text className="text-zinc-400 text-xs mt-2">
                    {t("reproductor_empty", "Sin pistas de audio en cola")}
                  </Text>
                </View>
              }
              renderItem={({ item: track, index: idx }) => (
                <View
                  className={`p-3.5 rounded-2xl mb-2 flex-row justify-between items-center ${
                    currentTrackIndex === idx
                      ? "bg-teal-500/20 border border-teal-500/40"
                      : "bg-zinc-950 border border-zinc-800/80"
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => {
                      useAudioPlayerStore.getState().loadTrack(idx);
                      setPlaylistModalVisible(false);
                    }}
                    className="flex-1 mr-3"
                  >
                    <Text
                      className={`text-sm font-bold ${
                        currentTrackIndex === idx
                          ? "text-teal-400"
                          : "text-white"
                      }`}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-2">
                    <Text className="text-[10px] font-mono font-bold text-zinc-500">
                      {track.format} • {formatTime(track.durationMs)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeTrack(track.id)}
                      className="p-2 bg-zinc-900 rounded-lg"
                    >
                      <Trash2 color="#71717A" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FileExplorerModal
        visible={explorerModalVisible}
        onClose={() => setExplorerModalVisible(false)}
      />

      <BluetoothProfilesModal
        visible={btModalVisible}
        onClose={() => setBtModalVisible(false)}
      />

      <SettingsModal4All
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        appName={t("reproductor_title", "Reproductor 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
      />
    </SafeAreaView>
  );
}

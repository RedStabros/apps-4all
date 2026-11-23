import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Vibration,
  AppState,
  AppStateStatus,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import {
  Play,
  Pause,
  RotateCcw,
  Info,
  X,
  Sliders,
  Volume2,
  Flame,
  CheckCircle2,
  Settings,
  Tag,
  Share2,
} from "lucide-react-native";
import { useTimerStore, AmbientSoundType } from "../store/useTimerStore";
import { Button4All, SettingsModal4All } from "@apps4all/ui-components";
import {
  playChimeSound,
  playAmbientSound,
  stopAmbientSound,
} from "../utils/ambientAudio";

type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

const SOUND_PRESETS: Array<{
  type: AmbientSoundType;
  labelKey: string;
  fallback: string;
  icon: string;
}> = [
  { type: "none", labelKey: "enfoque_sound_none", fallback: "Silencio", icon: "🔕" },
  { type: "rain", labelKey: "enfoque_sound_rain", fallback: "Lluvia", icon: "🌧️" },
  {
    type: "whitenoise",
    labelKey: "enfoque_sound_white",
    fallback: "Ruido Blanco",
    icon: "📻",
  },
  { type: "waves", labelKey: "enfoque_sound_waves", fallback: "Olas", icon: "🌊" },
  { type: "cafe", labelKey: "enfoque_sound_cafe", fallback: "Café", icon: "☕" },
];

export default function MainScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#FBBF24" : "#B45309";
  const mutedHex = isDark ? "#A1A1AA" : "#71717A";

  const {
    completedToday,
    lastCompletedDate,
    incrementCompleted,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    setIntervals,
    ambientSound,
    setAmbientSound,
    currentTask,
    setCurrentTask,
    weeklyHistory,
    recentSessions,
  } = useTimerStore();

  const effectiveTodayCount =
    lastCompletedDate === new Date().toDateString() ? completedToday : 0;

  const [mode, setMode] = useState<TimerMode>("FOCUS");
  const [isActive, setIsActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettingsVisible, setAppSettingsVisible] = useState(false);

  // Settings Temp State
  const [inputFocus, setInputFocus] = useState(focusMinutes.toString());
  const [inputShort, setInputShort] = useState(shortBreakMinutes.toString());
  const [inputLong, setInputLong] = useState(longBreakMinutes.toString());

  const MODES = useMemo(
    () => ({
      FOCUS: focusMinutes * 60,
      SHORT_BREAK: shortBreakMinutes * 60,
      LONG_BREAK: longBreakMinutes * 60,
    }),
    [focusMinutes, shortBreakMinutes, longBreakMinutes],
  );

  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(MODES[mode]);
    }
  }, [MODES, mode, isActive]);

  const endTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          if (isActive && endTimeRef.current) {
            const now = Date.now();
            const remaining = Math.round((endTimeRef.current - now) / 1000);

            if (remaining <= 0) {
              handleTimerComplete();
            } else {
              setTimeLeft(remaining);
            }
          }
        } else if (nextAppState.match(/inactive|background/)) {
          if (isActive) {
            endTimeRef.current = Date.now() + timeLeft * 1000;
          }
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [isActive, timeLeft]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      endTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isActive && mode === "FOCUS" && ambientSound !== "none") {
      playAmbientSound(ambientSound);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isActive, mode, ambientSound]);

  const handleTimerComplete = () => {
    setIsActive(false);
    endTimeRef.current = null;
    stopAmbientSound();
    Vibration.vibrate([0, 500, 200, 500]);
    playChimeSound();

    if (mode === "FOCUS") {
      incrementCompleted(currentTask);
      const nextCount = effectiveTodayCount + 1;
      const nextBreakMode: TimerMode =
        nextCount % 4 === 0 ? "LONG_BREAK" : "SHORT_BREAK";
      setMode(nextBreakMode);
      setTimeLeft(MODES[nextBreakMode]);
    } else {
      setMode("FOCUS");
      setTimeLeft(MODES.FOCUS);
    }
  };

  const toggleTimer = () => {
    if (!isActive) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    endTimeRef.current = null;
    setTimeLeft(MODES[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    endTimeRef.current = null;
    setMode(newMode);
    setTimeLeft(MODES[newMode]);
  };

  const handleSaveIntervals = () => {
    const f = parseInt(inputFocus, 10) || 25;
    const s = parseInt(inputShort, 10) || 5;
    const l = parseInt(inputLong, 10) || 15;
    setIntervals(f, s, l);
    setShowSettings(false);
  };

  const handleExportStats = async () => {
    try {
      const exportPayload = {
        app: "enfoque-4all",
        exportedAt: new Date().toISOString(),
        intervals: { focusMinutes, shortBreakMinutes, longBreakMinutes },
        weeklyHistory,
        recentSessions: recentSessions || [],
      };
      await Share.share({
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const { last7Days, currentStreak } = useMemo(() => {
    const days = [];
    const today = new Date();
    let streak = 0;
    let streakBroken = false;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const count = weeklyHistory[iso] || 0;
      const dayName = ["D", "L", "M", "M", "J", "V", "S"][d.getDay()];

      days.push({
        iso,
        dayName,
        count,
        isToday: i === 0,
      });
    }

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const count = weeklyHistory[iso] || 0;

      if (count > 0 && !streakBroken) {
        streak++;
      } else if (i > 0 && count === 0) {
        streakBroken = true;
      }
    }

    return { last7Days: days, currentStreak: streak };
  }, [weeklyHistory]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      {/* Header */}
      <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-2">
            <Text className="text-base">🍅</Text>
          </View>
          <Text
            className="text-xl font-black text-zinc-900 dark:text-white"
            numberOfLines={1}
          >
            {t("enfoque_title", "Enfoque 4All")}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => {
              setInputFocus(focusMinutes.toString());
              setInputShort(shortBreakMinutes.toString());
              setInputLong(longBreakMinutes.toString());
              setShowSettings(true);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t(
              "enfoque_custom_intervals",
              "Intervalos Personalizados",
            )}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Sliders color={accentHex} size={19} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowInfo(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("enfoque_info_title", "¿Qué es Pomodoro?")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Info color={mutedHex} size={19} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAppSettingsVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("settings", "Configuración")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Settings color={accentHex} size={19} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingVertical: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Streak & Today Summary Bar */}
        <View className="w-full px-6 flex-row justify-between items-center mb-4">
          <View className="flex-row items-center bg-amber-500/10 dark:bg-amber-400/10 px-4 py-2 rounded-2xl border border-amber-500/20">
            <Flame color={accentHex} size={18} />
            <Text className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase ml-1.5">
              {t("enfoque_streak", "Racha")}: {currentStreak}d
            </Text>
          </View>

          <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl">
            <CheckCircle2 color="#10b981" size={16} />
            <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1.5">
              {t("enfoque_completed_today", "Completados Hoy: ")}
              <Text className="font-black text-amber-700 dark:text-amber-400">
                {effectiveTodayCount}
              </Text>
            </Text>
          </View>
        </View>

        {/* Active Task Tag Input */}
        <View className="w-full px-6 mb-5">
          <View className="flex-row items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5">
            <Tag color={accentHex} size={16} />
            <TextInput
              value={currentTask}
              onChangeText={setCurrentTask}
              placeholder={t(
                "enfoque_task_ph",
                "¿En qué te vas a enfocar? (opcional)",
              )}
              placeholderTextColor="#a1a1aa"
              className="flex-1 ml-2.5 text-sm text-zinc-900 dark:text-white font-medium"
            />
            {currentTask.length > 0 && (
              <TouchableOpacity
                onPress={() => setCurrentTask("")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("clear", "Borrar")}
                className="p-1"
              >
                <X color={mutedHex} size={15} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mode Selector */}
        <View className="flex-row bg-white dark:bg-zinc-900 p-1.5 rounded-full mb-7 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => switchMode("FOCUS")}
            className={`px-4 py-2.5 rounded-full ${
              mode === "FOCUS"
                ? "bg-amber-700 dark:bg-amber-400"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                mode === "FOCUS"
                  ? "text-white dark:text-zinc-950"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {t("enfoque_work", "Enfoque")} ({focusMinutes}m)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchMode("SHORT_BREAK")}
            className={`px-3.5 py-2.5 rounded-full ${
              mode === "SHORT_BREAK"
                ? "bg-amber-700 dark:bg-amber-400"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                mode === "SHORT_BREAK"
                  ? "text-white dark:text-zinc-950"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {t("enfoque_short_break", "Descanso Corto")} ({shortBreakMinutes}m)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchMode("LONG_BREAK")}
            className={`px-3.5 py-2.5 rounded-full ${
              mode === "LONG_BREAK"
                ? "bg-amber-700 dark:bg-amber-400"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                mode === "LONG_BREAK"
                  ? "text-white dark:text-zinc-950"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {t("enfoque_long_break", "Descanso Largo")} ({longBreakMinutes}m)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Big Timer Hero Ring */}
        <View className="w-68 h-68 rounded-full border-[12px] border-amber-500/20 dark:border-amber-400/15 items-center justify-center bg-white dark:bg-zinc-900 shadow-lg mb-7 px-8 py-12">
          <Text className="text-7xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </Text>
          <Text className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400 tracking-widest mt-1">
            {mode === "FOCUS"
              ? t("enfoque_work", "Enfoque")
              : mode === "SHORT_BREAK"
                ? t("enfoque_short_break", "Descanso Corto")
                : t("enfoque_long_break", "Descanso Largo")}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row items-center justify-center gap-6 mb-7">
          <TouchableOpacity
            onPress={resetTimer}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("enfoque_reset", "Reiniciar")}
            className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <RotateCcw color={mutedHex} size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTimer}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isActive
                ? t("enfoque_pause", "Pausar")
                : t("enfoque_start", "Iniciar")
            }
            className={`w-24 h-24 rounded-full items-center justify-center shadow-xl ${
              isActive ? "bg-red-500" : "bg-amber-700 dark:bg-amber-400"
            }`}
          >
            {isActive ? (
              <Pause color="#fff" size={38} fill="#fff" />
            ) : (
              <Play
                color={isDark ? "#09090b" : "#fff"}
                size={38}
                fill={isDark ? "#09090b" : "#fff"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Ambient Sound Bar */}
        <View className="w-full px-6 mb-7">
          <View className="flex-row items-center mb-2 px-1">
            <Volume2 color={accentHex} size={16} />
            <Text className="text-xs uppercase font-bold text-zinc-400 tracking-wider ml-1.5">
              {t("enfoque_ambient_sound", "Sonido de Concentración")}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {SOUND_PRESETS.map((snd) => (
              <TouchableOpacity
                key={snd.type}
                onPress={() => setAmbientSound(snd.type)}
                className={`px-3.5 py-2 rounded-2xl flex-row items-center border ${
                  ambientSound === snd.type
                    ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text className="mr-1.5 text-sm">{snd.icon}</Text>
                <Text
                  className={`text-xs font-bold ${
                    ambientSound === snd.type
                      ? "text-white dark:text-zinc-950"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t(snd.labelKey, snd.fallback)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Weekly Consistency Matrix + Export JSON Backup */}
        <View className="w-full px-6 mb-6">
          <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                {t("enfoque_weekly_matrix", "Consistencia Semanal")}
              </Text>
              <TouchableOpacity
                onPress={handleExportStats}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("enfoque_export_json", "Exportar JSON")}
                className="flex-row items-center px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <Share2 color={accentHex} size={12} />
                <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-400 ml-1">
                  {t("enfoque_export_json", "Exportar JSON")}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center">
              {last7Days.map((day) => {
                const bgLevel =
                  day.count === 0
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : day.count <= 2
                      ? "bg-amber-400/40"
                      : day.count <= 4
                        ? "bg-amber-500"
                        : "bg-amber-700";

                return (
                  <View key={day.iso} className="items-center">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center mb-1.5 ${bgLevel} ${
                        day.isToday ? "border-2 border-amber-600" : ""
                      }`}
                    >
                      <Text
                        className={`font-black text-xs ${
                          day.count > 2
                            ? "text-white"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {day.count}
                      </Text>
                    </View>
                    <Text
                      className={`text-xs font-bold ${
                        day.isToday
                          ? "text-amber-700 dark:text-amber-400 font-black"
                          : "text-zinc-400"
                      }`}
                    >
                      {day.dayName}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Recent Tagged Sessions */}
            {recentSessions && recentSessions.length > 0 && (
              <View className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Text className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  {t("enfoque_recent_sessions", "Sesiones Recientes")}
                </Text>
                {recentSessions.slice(0, 4).map((ses) => (
                  <View
                    key={ses.id}
                    className="flex-row items-center justify-between py-1"
                  >
                    <Text
                      className="text-xs text-zinc-700 dark:text-zinc-300 font-medium flex-1 mr-2"
                      numberOfLines={1}
                    >
                      • {ses.task || t("enfoque_work", "Enfoque")}
                    </Text>
                    <Text className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                      {ses.minutes}m
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Interval Customization Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-zinc-900 dark:text-white">
                {t("enfoque_custom_intervals", "Intervalos Personalizados")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                className="p-2"
              >
                <X color={mutedHex} size={22} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs uppercase font-bold text-zinc-500 mb-1">
              {t("enfoque_work", "Enfoque")} ({t("enfoque_minutes", "Minutos")})
            </Text>
            <TextInput
              value={inputFocus}
              onChangeText={setInputFocus}
              keyboardType="numeric"
              className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-lg font-bold text-zinc-900 dark:text-white mb-4 font-mono"
            />

            <Text className="text-xs uppercase font-bold text-zinc-500 mb-1">
              {t("enfoque_short_break", "Descanso Corto")} (
              {t("enfoque_minutes", "Minutos")})
            </Text>
            <TextInput
              value={inputShort}
              onChangeText={setInputShort}
              keyboardType="numeric"
              className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-lg font-bold text-zinc-900 dark:text-white mb-4 font-mono"
            />

            <Text className="text-xs uppercase font-bold text-zinc-500 mb-1">
              {t("enfoque_long_break", "Descanso Largo")} (
              {t("enfoque_minutes", "Minutos")})
            </Text>
            <TextInput
              value={inputLong}
              onChangeText={setInputLong}
              keyboardType="numeric"
              className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-lg font-bold text-zinc-900 dark:text-white mb-6 font-mono"
            />

            <Button4All
              label={t("enfoque_save_intervals", "Guardar Tiempos")}
              onPress={handleSaveIntervals}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowInfo(false)}
      >
        <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black text-amber-700 dark:text-amber-400">
              {t("enfoque_info_title", "¿Qué es Pomodoro?")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowInfo(false)}
              className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full"
            >
              <X color={mutedHex} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View className="bg-white dark:bg-zinc-900 p-5 rounded-2xl mb-4 border border-zinc-200 dark:border-zinc-800">
              <Text className="font-bold text-lg text-zinc-900 dark:text-white mb-2">
                {t("enfoque_info_1_title", "¿Qué es?")}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 leading-6">
                {t("enfoque_info_1_desc")}
              </Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 p-5 rounded-2xl mb-4 border border-zinc-200 dark:border-zinc-800">
              <Text className="font-bold text-lg text-zinc-900 dark:text-white mb-2">
                {t("enfoque_info_2_title", "¿Por qué funciona?")}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 leading-6">
                {t("enfoque_info_2_desc")}
              </Text>
            </View>

            <View className="bg-white dark:bg-zinc-900 p-5 rounded-2xl mb-4 border border-zinc-200 dark:border-zinc-800">
              <Text className="font-bold text-lg text-zinc-900 dark:text-white mb-2">
                {t("enfoque_info_3_title", "¿Cómo usarlo?")}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 leading-6">
                {t("enfoque_info_3_desc")}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowInfo(false)}
            className="w-full py-4 rounded-2xl bg-amber-700 dark:bg-amber-400 items-center mt-4 mb-2 shadow-sm"
          >
            <Text className="text-white dark:text-zinc-950 font-black text-lg">
              {t("enfoque_close", "Cerrar")}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <SettingsModal4All
        visible={appSettingsVisible}
        onClose={() => setAppSettingsVisible(false)}
        appName={t("enfoque_title", "Enfoque 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
      />
    </SafeAreaView>
  );
}

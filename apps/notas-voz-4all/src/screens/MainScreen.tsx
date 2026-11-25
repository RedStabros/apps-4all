import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import {
  useAudioRecorder,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  AudioPlayer,
} from "expo-audio";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  useAudioStore,
  AudioRecord,
  VoiceCategory,
} from "../store/useAudioStore";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Share,
  Clock,
  Edit3,
  Scissors,
  X,
  Settings,
  Search,
  Tag,
} from "lucide-react-native";

type CategoryFilter = "all" | VoiceCategory;

const CATEGORIES: { id: VoiceCategory; labelKey: string; fallback: string }[] =
  [
    { id: "general", labelKey: "voz_cat_general", fallback: "General" },
    { id: "work", labelKey: "voz_cat_work", fallback: "Trabajo" },
    { id: "ideas", labelKey: "voz_cat_ideas", fallback: "Ideas" },
    { id: "personal", labelKey: "voz_cat_personal", fallback: "Personal" },
  ];

export default function MainScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";
  const mutedIconHex = isDark ? "#a1a1aa" : "#71717a";

  const {
    recordings,
    saveRecording,
    deleteRecording,
    renameRecording,
    updateTrim,
  } = useAudioStore();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const playerRef = useRef<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Search & category filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("all");

  // Rename / edit category modal
  const [editingRecord, setEditingRecord] = useState<AudioRecord | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [editCategory, setEditCategory] = useState<VoiceCategory>("general");

  // Trim modal
  const [trimmingRecord, setTrimmingRecord] = useState<AudioRecord | null>(
    null,
  );
  const [trimStartSec, setTrimStartSec] = useState("0");
  const [trimEndSec, setTrimEndSec] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch {
        // Audio mode will be configured on demand
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("voz_perm_title", "Permiso de micrófono"),
          t(
            "voz_permission",
            "Necesitamos permiso para usar el micrófono.",
          ),
        );
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
        setPlayingId(null);
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      startTimer();
    } catch {
      Alert.alert(
        t("voz_err_record_title", "No se pudo iniciar la grabación"),
        t(
          "voz_err_record_desc",
          "Verifica que el micrófono no esté siendo usado por otra aplicación.",
        ),
      );
    }
  };

  const togglePauseRecording = async () => {
    if (!isRecording) return;

    try {
      if (isPaused) {
        audioRecorder.record();
        setIsPaused(false);
        startTimer();
      } else {
        audioRecorder.pause();
        setIsPaused(true);
        stopTimer();
      }
    } catch {
      Alert.alert(
        t("voz_err_pause_title", "No se pudo pausar"),
        t(
          "voz_err_pause_desc",
          "Tu dispositivo no permitió pausar esta grabación. Puedes detenerla para guardarla.",
        ),
      );
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      stopTimer();
      setIsRecording(false);
      setIsPaused(false);

      const statusBeforeStop = audioRecorder.getStatus();
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const finalDurationMs =
        statusBeforeStop?.durationMillis && statusBeforeStop.durationMillis > 0
          ? statusBeforeStop.durationMillis
          : recordingDuration * 1000;

      setRecordingDuration(0);

      if (uri) {
        const defaultCategory: VoiceCategory =
          selectedFilter === "all" ? "general" : selectedFilter;
        const saved = await saveRecording(uri, finalDurationMs, defaultCategory);
        if (!saved) {
          Alert.alert(
            t("voz_err_save_title", "No se pudo guardar"),
            t(
              "voz_err_save_desc",
              "Revisa el espacio disponible en tu dispositivo e intenta de nuevo.",
            ),
          );
        }
      }
    } catch {
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      Alert.alert(
        t("voz_err_save_title", "No se pudo guardar"),
        t(
          "voz_err_save_desc",
          "Revisa el espacio disponible en tu dispositivo e intenta de nuevo.",
        ),
      );
    }
  };

  const togglePlayback = async (rec: AudioRecord, customStartMs?: number) => {
    try {
      if (playingId === rec.id && playerRef.current) {
        playerRef.current.pause();
        setPlayingId(null);
      } else {
        if (playerRef.current) {
          try {
            playerRef.current.pause();
            playerRef.current.remove();
          } catch {
            // ignore
          }
          playerRef.current = null;
        }

        const startPosSec = (customStartMs ?? (rec.trimStartMs || 0)) / 1000;
        const endPosSec = rec.trimEndMs ? rec.trimEndMs / 1000 : null;

        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        }).catch(() => {});

        const player = createAudioPlayer({ uri: rec.uri });
        let didSeekStart = false;

        player.addListener("playbackStatusUpdate", (status) => {
          if (status.isLoaded) {
            if (!didSeekStart && startPosSec > 0) {
              didSeekStart = true;
              player.seekTo(startPosSec).catch(() => {});
              return;
            }
            if (
              status.didJustFinish ||
              (endPosSec !== null && status.currentTime >= endPosSec)
            ) {
              setPlayingId(null);
              try {
                player.pause();
              } catch {
                // ignore
              }
            }
          }
        });

        try {
          player.setPlaybackRate(playbackSpeed, "high");
        } catch {
          // Device may not support pitch correction on all codecs
        }

        player.play();
        playerRef.current = player;
        setPlayingId(rec.id);
      }
    } catch {
      setPlayingId(null);
      Alert.alert(
        t("voz_err_play_title", "No se pudo reproducir"),
        t(
          "voz_err_play_desc",
          "El archivo de audio podría haberse movido o dañado.",
        ),
      );
    }
  };

  const changeSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(speed, "high");
      } catch {
        // Ignored if unloaded
      }
    }
  };

  const handleShare = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          t("voz_err_share_title", "No disponible"),
          t(
            "voz_err_share_desc",
            "Tu dispositivo no permite compartir archivos en este momento.",
          ),
        );
      }
    } catch {
      Alert.alert(
        t("voz_err_share_title", "No disponible"),
        t(
          "voz_err_share_desc",
          "Tu dispositivo no permite compartir archivos en este momento.",
        ),
      );
    }
  };

  const confirmDelete = (rec: AudioRecord) => {
    Alert.alert(
      t("voz_delete_title", "Eliminar grabación"),
      t(
        "voz_delete_confirm",
        "¿Deseas eliminar esta nota de voz de forma permanente?",
      ),
      [
        { text: t("cancel", "Cancelar"), style: "cancel" },
        {
          text: t("delete", "Eliminar"),
          style: "destructive",
          onPress: async () => {
            if (playingId === rec.id && playerRef.current) {
              try {
                playerRef.current.pause();
                playerRef.current.remove();
              } catch {
                // ignore
              }
              playerRef.current = null;
              setPlayingId(null);
            }
            await deleteRecording(rec.id);
          },
        },
      ],
    );
  };

  const handleSaveRename = () => {
    if (editingRecord && editTitleInput.trim()) {
      renameRecording(editingRecord.id, editTitleInput.trim(), editCategory);
      setEditingRecord(null);
      setEditTitleInput("");
    }
  };

  const handleApplyTrim = async () => {
    if (!trimmingRecord) return;
    const startSec = Math.max(0, parseFloat(trimStartSec) || 0);
    const startMs = startSec * 1000;
    const parsedEndSec = parseFloat(trimEndSec);
    const endMs =
      !isNaN(parsedEndSec) && parsedEndSec > startSec
        ? parsedEndSec * 1000
        : undefined;

    updateTrim(trimmingRecord.id, startMs > 0 ? startMs : undefined, endMs);
    const updatedRec: AudioRecord = {
      ...trimmingRecord,
      trimStartMs: startMs > 0 ? startMs : undefined,
      trimEndMs: endMs,
    };
    setTrimmingRecord(null);
    await togglePlayback(updatedRec, startMs);
    Alert.alert(
      t("voz_trim_applied", "Recorte guardado"),
      t(
        "voz_trim_desc",
        "La reproducción respetará los límites de inicio y fin seleccionados.",
      ),
    );
  };

  const handleResetTrim = () => {
    if (!trimmingRecord) return;
    updateTrim(trimmingRecord.id, undefined, undefined);
    setTrimmingRecord(null);
  };

  const formatTime = (seconds: number) => {
    const safeSec = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getCategoryLabel = (cat?: VoiceCategory) => {
    const found = CATEGORIES.find((c) => c.id === (cat || "general"));
    return found ? t(found.labelKey, found.fallback) : "";
  };

  const filteredRecordings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recordings.filter((rec) => {
      const cat = rec.category || "general";
      if (selectedFilter !== "all" && cat !== selectedFilter) return false;
      if (q && !rec.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [recordings, searchQuery, selectedFilter]);

  const renderRecordingItem = ({ item: rec }: { item: AudioRecord }) => {
    const hasTrim =
      (rec.trimStartMs && rec.trimStartMs > 0) || Boolean(rec.trimEndMs);
    const cat = rec.category || "general";

    return (
      <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center justify-between mb-1.5">
          {/* Title and rename button */}
          <TouchableOpacity
            onPress={() => {
              setEditingRecord(rec);
              setEditTitleInput(rec.title);
              setEditCategory(cat);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("voz_rename", "Renombrar Grabación")}
            className="flex-row items-center flex-1 mr-3 py-1"
          >
            <Text
              className="text-zinc-900 dark:text-white font-bold text-base flex-1 mr-2"
              numberOfLines={1}
            >
              {rec.title}
            </Text>
            <Edit3 color={accentHex} size={15} />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Clock color="#a1a1aa" size={13} />
            <Text className="text-zinc-400 font-mono text-xs ml-1">
              {formatTime(Math.round(rec.durationMs / 1000))}
            </Text>
          </View>
        </View>

        {/* Category & Trim badges */}
        {(cat !== "general" || hasTrim) && (
          <View className="flex-row items-center gap-2 mb-2">
            {cat !== "general" && (
              <View className="flex-row items-center bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
                <Tag color={accentHex} size={11} />
                <Text className="text-blue-600 dark:text-blue-400 text-[11px] font-bold ml-1">
                  {getCategoryLabel(cat)}
                </Text>
              </View>
            )}
            {hasTrim && (
              <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                <Scissors color={mutedIconHex} size={11} />
                <Text className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono ml-1">
                  {Math.round((rec.trimStartMs || 0) / 1000)}s–
                  {rec.trimEndMs
                    ? `${Math.round(rec.trimEndMs / 1000)}s`
                    : `${Math.round(rec.durationMs / 1000)}s`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons Row */}
        <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Play / Pause */}
          <TouchableOpacity
            onPress={() => togglePlayback(rec)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              playingId === rec.id
                ? t("voz_pause", "Pausar")
                : t("voz_play", "Reproducir")
            }
            className="bg-blue-50 dark:bg-blue-950/40 px-4 py-2.5 rounded-xl flex-row items-center border border-blue-500/20"
          >
            {playingId === rec.id ? (
              <>
                <Pause color={accentHex} size={16} />
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs ml-1.5">
                  {t("voz_pause", "Pausar")}
                </Text>
              </>
            ) : (
              <>
                <Play color={accentHex} size={16} />
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs ml-1.5">
                  {t("voz_play", "Reproducir")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {/* Trim Silences Button */}
            <TouchableOpacity
              onPress={() => {
                setTrimmingRecord(rec);
                setTrimStartSec(
                  rec.trimStartMs ? (rec.trimStartMs / 1000).toString() : "0",
                );
                setTrimEndSec(
                  rec.trimEndMs
                    ? (rec.trimEndMs / 1000).toString()
                    : Math.max(1, Math.round(rec.durationMs / 1000)).toString(),
                );
              }}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("voz_trim", "Ajustar / Recortar")}
            >
              <Scissors color={hasTrim ? accentHex : mutedIconHex} size={17} />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={() => handleShare(rec.uri)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("share", "Compartir")}
            >
              <Share color={mutedIconHex} size={17} />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => confirmDelete(rec)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("delete", "Eliminar")}
            >
              <Trash2 color="#ef4444" size={17} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      {/* Header */}
      <View className="py-3.5 px-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex-row justify-between items-center">
        <View className="flex-row items-center flex-1 mr-2">
          <Mic color={accentHex} size={23} />
          <Text
            className="text-xl font-black text-zinc-900 dark:text-white ml-2"
            numberOfLines={1}
          >
            {t("voz_title", "Notas de Voz 4All")}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Global Playback Speed Selector */}
          <View className="flex-row bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {[1.0, 1.5, 2.0].map((spd) => (
              <TouchableOpacity
                key={spd}
                onPress={() => changeSpeed(spd)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${t("voz_speed", "Velocidad")} ${spd}x`}
                className={`px-2 py-1.5 rounded-lg ${
                  playbackSpeed === spd ? "bg-blue-600" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    playbackSpeed === spd
                      ? "text-white"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {spd}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("settings", "Configuración")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Settings color={accentHex} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recording Controller Hero */}
      <View className="py-5 px-6 items-center bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <Text className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-5 font-mono">
          {formatTime(recordingDuration)}
        </Text>

        <View className="flex-row items-center justify-center gap-5">
          {isRecording && (
            <TouchableOpacity
              onPress={togglePauseRecording}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                isPaused
                  ? t("voz_resume", "Reanudar")
                  : t("voz_pause", "Pausar")
              }
              className="w-14 h-14 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              {isPaused ? (
                <Play color={accentHex} size={24} />
              ) : (
                <Pause color={accentHex} size={24} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording ? t("voz_stop", "Detener") : t("voz_record", "Grabar")
            }
            className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${
              isRecording ? "bg-red-500" : "bg-blue-600 dark:bg-blue-500"
            }`}
          >
            {isRecording ? (
              <Square color="#fff" size={30} />
            ) : (
              <Mic color="#fff" size={34} />
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-4 font-bold uppercase tracking-wider text-center">
          {isRecording
            ? isPaused
              ? t("voz_status_paused", "Grabación en pausa")
              : t("voz_status_recording", "Grabando audio en segundo plano")
            : t("voz_status_idle", "Toca el micrófono para comenzar")}
        </Text>
      </View>

      {/* Search & Category Filter Bar */}
      {recordings.length > 0 && (
        <View className="px-5 pt-3 pb-1">
          <View className="flex-row items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2 mb-2.5">
            <Search color="#a1a1aa" size={16} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("voz_search_ph", "Buscar grabaciones...")}
              placeholderTextColor="#a1a1aa"
              className="flex-1 ml-2 text-sm text-zinc-900 dark:text-white py-0.5"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("clear", "Borrar")}
                className="p-1"
              >
                <X color="#a1a1aa" size={16} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedFilter("all")}
              className={`px-3.5 py-1.5 rounded-full border ${
                selectedFilter === "all"
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedFilter === "all"
                    ? "text-white"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {t("voz_cat_all", "Todas")}
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  selectedFilter === cat.id
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedFilter === cat.id
                      ? "text-white"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {t(cat.labelKey, cat.fallback)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recordings List (Virtualized FlatList) */}
      <FlatList
        data={filteredRecordings}
        keyExtractor={(item) => item.id}
        renderItem={renderRecordingItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Mic size={44} color="#a1a1aa" />
            <Text className="text-zinc-400 dark:text-zinc-500 text-sm font-medium text-center mt-3">
              {recordings.length === 0
                ? t("voz_empty", "Aún no hay grabaciones.")
                : t(
                    "voz_no_results",
                    "No hay grabaciones que coincidan con tu filtro.",
                  )}
            </Text>
          </View>
        }
      />

      {/* RENAME & CATEGORY MODAL */}
      <Modal
        visible={!!editingRecord}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingRecord(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/60 items-center justify-center p-6"
        >
          <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-zinc-900 dark:text-white">
                {t("voz_rename", "Renombrar Grabación")}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingRecord(null)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("cancel", "Cancelar")}
                className="p-2"
              >
                <X color={mutedIconHex} size={20} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={editTitleInput}
              onChangeText={setEditTitleInput}
              placeholder={t("voz_rename_ph", "Nombre (ej. Entrevista Laboral)")}
              placeholderTextColor="#a1a1aa"
              className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium mb-4"
              autoFocus
            />

            <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">
              {t("voz_category_label", "Etiqueta")}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setEditCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    editCategory === cat.id
                      ? "bg-blue-600 border-blue-600"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      editCategory === cat.id
                        ? "text-white"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {t(cat.labelKey, cat.fallback)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSaveRename}
              className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center"
            >
              <Text className="text-white font-bold text-sm">
                {t("save", "Guardar")}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* TRIM / ADJUST SILENCES MODAL */}
      <Modal
        visible={!!trimmingRecord}
        transparent={true}
        statusBarTranslucent={true}
        animationType="slide"
        onRequestClose={() => setTrimmingRecord(null)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 bg-black/70 justify-end"
        >
          <View
            className="bg-white dark:bg-zinc-900 rounded-t-3xl px-6 pt-6"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 48) }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-black text-zinc-900 dark:text-white">
                {t("voz_trim", "Ajustar / Recortar")}
              </Text>
              <TouchableOpacity
                onPress={() => setTrimmingRecord(null)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("cancel", "Cancelar")}
                className="p-2"
              >
                <X color={mutedIconHex} size={20} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-4">
              {t(
                "voz_trim_helper",
                "Recorte de reproducción local para omitir silencios al inicio o final (el archivo original compartido se conserva intacto):",
              )}
            </Text>

            <View className="flex-row gap-4 mb-5">
              <View className="flex-1">
                <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                  {t("voz_trim_start", "Inicio (seg)")}
                </Text>
                <TextInput
                  value={trimStartSec}
                  onChangeText={setTrimStartSec}
                  keyboardType="numeric"
                  className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl font-mono text-center text-zinc-900 dark:text-white font-bold"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                  {t("voz_trim_end", "Fin (seg)")}
                </Text>
                <TextInput
                  value={trimEndSec}
                  onChangeText={setTrimEndSec}
                  keyboardType="numeric"
                  className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl font-mono text-center text-zinc-900 dark:text-white font-bold"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleResetTrim}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
              >
                <Text className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                  {t("voz_trim_reset", "Restablecer")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyTrim}
                className="flex-[2] py-3.5 rounded-2xl bg-blue-600 items-center justify-center"
              >
                <Text className="text-white font-bold text-sm">
                  {t("voz_trim_apply_btn", "Aplicar y Reproducir")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SettingsModal4All
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        appName={t("voz_title", "Notas de Voz 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
      />
    </SafeAreaView>
  );
}

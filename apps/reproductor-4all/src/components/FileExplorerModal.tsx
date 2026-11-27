import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  FolderOpen,
  FolderPlus,
  Music,
  Check,
  X,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  EyeOff,
  Play,
  ListMusic,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useAudioPlayerStore, Track } from "../store/useAudioPlayerStore";
import { AudioEngine } from "../../modules/audio-engine";

interface FileExplorerModalProps {
  visible: boolean;
  onClose: () => void;
}

const JUNK_PATH_PATTERNS = [
  "whatsapp",
  "ptt-",
  "aud-20",
  "call",
  "callrecord",
  "recordings",
  "voice recorder",
  "voicerecorder",
  "telegram",
  "ringtones",
  "notifications",
  "alarms",
  "miui/sound_recorder",
  "soundrecorder",
  "record/",
];

function extractFolderName(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const cleaned = decoded.replace(/^file:\/\//, "");
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
  } catch {
    // Fallback below
  }
  return "Music";
}

function isJunkAudio(uri: string, filename: string): boolean {
  const haystack = `${decodeURIComponent(uri).toLowerCase()} ${filename.toLowerCase()}`;
  return JUNK_PATH_PATTERNS.some((pattern) => haystack.includes(pattern));
}

export const FileExplorerModal: React.FC<FileExplorerModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const {
    playlist,
    savedPlaylists,
    addTracks,
    addTrackAndPlay,
    setPlaylist,
    createSavedPlaylist,
    deleteSavedPlaylist,
    loadSavedPlaylist,
    excludeJunkAudio,
    minDurationSec,
    excludedFolders,
    setExcludeJunkAudio,
    setMinDurationSec,
    toggleExcludedFolder,
  } = useAudioPlayerStore();

  const [activeTab, setActiveTab] = useState<"folders" | "songs" | "playlists">(
    "folders",
  );
  const [loading, setLoading] = useState(false);
  const [rawScannedFiles, setRawScannedFiles] = useState<Track[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [filteredJunkCount, setFilteredJunkCount] = useState(0);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleScanDevice = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "android") {
        const perm =
          typeof Platform.Version === "number" && Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const alreadyGranted = await PermissionsAndroid.check(perm);
        if (!alreadyGranted) {
          const status = await PermissionsAndroid.request(perm);
          const ok = status === PermissionsAndroid.RESULTS.GRANTED;
          setPermissionGranted(ok);
          if (!ok) {
            setLoading(false);
            return;
          }
        } else {
          setPermissionGranted(true);
        }
      }

      const scanned = await AudioEngine.scanDeviceAudio();
      const tracks: Track[] = (scanned || []).map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        uri: item.uri,
        durationMs: item.durationMs || 0,
        format: item.format || "MP3",
        folder: item.folder || "Music",
      }));

      setRawScannedFiles(tracks);
      setSelectedIds(new Set(tracks.map((tr) => tr.id)));
      if (tracks.length === 0) {
        Alert.alert(
          t("reproductor_no_music_title", "Sin archivos encontrados"),
          t(
            "reproductor_no_music_desc",
            "No se encontraron archivos de audio en la biblioteca del sistema. Prueba con 'Elegir Carpeta'.",
          ),
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      Alert.alert(
        t("reproductor_scan_err_title", "No se pudo escanear"),
        msg ||
          t(
            "reproductor_scan_err_desc",
            "Revisa los permisos de audio en tu dispositivo e intenta de nuevo.",
          ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePickFolder = async () => {
    setLoading(true);
    try {
      const picked = await AudioEngine.pickAndScanFolder();
      if (!picked) {
        setLoading(false);
        return;
      }
      const tracks: Track[] = (picked.tracks || []).map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        uri: item.uri,
        durationMs: item.durationMs || 0,
        format: item.format || "MP3",
        folder: item.folder || picked.folderName || "Carpeta",
      }));

      if (tracks.length === 0) {
        Alert.alert(
          t("reproductor_empty_folder_title", "Carpeta sin audio"),
          t(
            "reproductor_empty_folder_desc",
            "No se encontraron archivos MP3, FLAC, WAV, M4A u OGG en esa carpeta ni en sus subcarpetas.",
          ),
        );
        setLoading(false);
        return;
      }

      // Merge into scanned view and switch to Folders/Songs so user sees everything
      setRawScannedFiles((prev) => {
        const existingUris = new Set(prev.map((p) => p.uri));
        const merged = [...tracks, ...prev.filter((p) => !existingUris.has(p.uri))];
        return merged;
      });
      setSelectedIds(new Set(tracks.map((tr) => tr.id)));

      Alert.alert(
        picked.folderName,
        t("reproductor_folder_loaded_prompt", {
          count: tracks.length,
          defaultValue:
            "Se encontraron {{count}} canciones (incluyendo subcarpetas). ¿Qué deseas hacer?",
        }),
        [
          {
            text: t("reproductor_only_explore", "Ver en Explorador"),
            style: "cancel",
          },
          {
            text: t("reproductor_add_to_queue", "Sumar a la Cola"),
            onPress: () => {
              addTracks(tracks);
              onClose();
            },
          },
          {
            text: t("reproductor_play_folder", "Reproducir Todo"),
            onPress: async () => {
              await setPlaylist(tracks, 0);
              onClose();
            },
          },
        ],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      Alert.alert(
        t("reproductor_scan_err_title", "No se pudo leer la carpeta"),
        msg ||
          t(
            "reproductor_folder_err_desc",
            "Intenta seleccionar otra carpeta del almacenamiento.",
          ),
      );
    } finally {
      setLoading(false);
    }
  };

  // Apply anti-WhatsApp / anti-calls / minimum duration / manual hidden folders filter
  const visibleTracks = useMemo(() => {
    let junkCounter = 0;
    const result = rawScannedFiles.filter((track) => {
      const folder = track.folder || "Music";
      if (excludedFolders.includes(folder)) {
        junkCounter++;
        return false;
      }
      if (excludeJunkAudio && isJunkAudio(track.uri, track.title)) {
        junkCounter++;
        return false;
      }
      if (minDurationSec > 0 && track.durationMs > 0 && track.durationMs < minDurationSec * 1000) {
        junkCounter++;
        return false;
      }
      return true;
    });
    setFilteredJunkCount(junkCounter);
    return result;
  }, [rawScannedFiles, excludeJunkAudio, minDurationSec, excludedFolders]);

  // Group filtered tracks by folder
  const folderGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const tr of visibleTracks) {
      const key = tr.folder || "Music";
      const list = map.get(key) || [];
      list.push(tr);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([name, tracks]) => ({ name, tracks }))
      .sort((a, b) => b.tracks.length - a.tracks.length);
  }, [visibleTracks]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAddSelected = () => {
    const toAdd = visibleTracks.filter((tr) => selectedIds.has(tr.id));
    if (toAdd.length > 0) {
      addTracks(toAdd);
    }
    onClose();
  };

  const handlePlayFolder = async (tracks: Track[]) => {
    await setPlaylist(tracks, 0);
    onClose();
  };

  const handlePlayNow = async (track: Track) => {
    await addTrackAndPlay(track);
    onClose();
  };

  const handleSaveCurrentAsPlaylist = () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const sourceTracks = playlist.length > 0 ? playlist : visibleTracks;
    if (sourceTracks.length === 0) return;
    createSavedPlaylist(trimmed, sourceTracks);
    setNewPlaylistName("");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/75"
      >
        <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-5 pb-14 max-h-[88%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 items-center justify-center mr-2.5">
                <FolderOpen color="#2DD4BF" size={18} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-black text-white"
                  numberOfLines={1}
                >
                  {t("reproductor_library", "Biblioteca y Carpetas")}
                </Text>
                <Text className="text-[11px] text-zinc-400" numberOfLines={1}>
                  {t(
                    "reproductor_scan_desc",
                    "Almacenamiento local del dispositivo",
                  )}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("cancel", "Cancelar")}
              className="p-2 bg-zinc-800 rounded-full"
            >
              <X color="#A1A1AA" size={18} />
            </TouchableOpacity>
          </View>

          {/* Tabs: Carpetas | Canciones | Listas */}
          <View className="flex-row bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-3">
            {(
              [
                {
                  id: "folders",
                  label: `${t("reproductor_tab_folders", "Carpetas")} (${folderGroups.length})`,
                },
                {
                  id: "songs",
                  label: `${t("reproductor_tab_songs", "Canciones")} (${visibleTracks.length})`,
                },
                {
                  id: "playlists",
                  label: `${t("reproductor_tab_playlists", "Listas")} (${savedPlaylists.length})`,
                },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  activeTab === tab.id ? "bg-teal-600" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeTab === tab.id ? "text-white" : "text-zinc-400"
                  }`}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Anti-WhatsApp / Anti-Calls Filter Controls (on Folders & Songs tabs) */}
          {activeTab !== "playlists" && (
            <>
              <View className="flex-row items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 mb-3">
                <TouchableOpacity
                  onPress={() => setExcludeJunkAudio(!excludeJunkAudio)}
                  className="flex-row items-center flex-1 mr-2"
                >
                  <ShieldCheck
                    color={excludeJunkAudio ? "#2DD4BF" : "#71717A"}
                    size={16}
                  />
                  <Text
                    className={`text-[11px] font-bold ml-1.5 ${
                      excludeJunkAudio ? "text-teal-400" : "text-zinc-400"
                    }`}
                    numberOfLines={1}
                  >
                    {t(
                      "reproductor_filter_junk",
                      "Sin WhatsApp / Llamadas",
                    )}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const next =
                      minDurationSec === 30 ? 60 : minDurationSec === 60 ? 0 : 30;
                    setMinDurationSec(next);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800"
                >
                  <Text className="text-[10px] font-mono font-bold text-teal-400">
                    {minDurationSec > 0
                      ? `>= ${minDurationSec}s`
                      : t("reproductor_min_off", "Todo")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Scan Device & Pick Folder (Recursive) */}
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  onPress={handleScanDevice}
                  disabled={loading}
                  className="flex-1 flex-row items-center justify-center py-3 px-3 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20"
                >
                  {loading ? (
                    <ActivityIndicator color="#09090b" />
                  ) : (
                    <RefreshCw color="#09090b" size={15} />
                  )}
                  <Text
                    className="text-zinc-950 font-black text-xs ml-1.5"
                    numberOfLines={1}
                  >
                    {loading
                      ? t("reproductor_scanning", "Buscando...")
                      : t("reproductor_scan_short", "Escanear Todo")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickFolder}
                  disabled={loading}
                  className="flex-1 flex-row items-center justify-center py-3 px-3 bg-zinc-800 border border-teal-500/40 rounded-xl"
                >
                  <FolderPlus color="#2DD4BF" size={15} />
                  <Text
                    className="text-teal-300 font-black text-xs ml-1.5"
                    numberOfLines={1}
                  >
                    {t("reproductor_pick_folder", "Elegir Carpeta")}
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredJunkCount > 0 && (
                <Text className="text-[10px] text-zinc-400 mb-2 text-center">
                  {t("reproductor_filtered_notice", {
                    count: filteredJunkCount,
                    defaultValue:
                      "Se ocultaron {{count}} audios cortos o de WhatsApp/llamadas.",
                  })}
                </Text>
              )}

              {excludedFolders.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    excludedFolders.forEach((f) => toggleExcludedFolder(f))
                  }
                  className="mb-2 items-center"
                >
                  <Text className="text-[10px] text-teal-400 font-bold">
                    {t("reproductor_restore_folders", {
                      count: excludedFolders.length,
                      defaultValue:
                        "Restaurar {{count}} carpetas ocultas",
                    })}
                  </Text>
                </TouchableOpacity>
              )}

              {permissionGranted === false && (
                <View className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-3">
                  <Text className="text-red-400 text-xs font-bold">
                    {t(
                      "reproductor_permission_denied",
                      "Se requiere permiso de lectura de archivos de audio para importar música.",
                    )}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* TAB 1: FOLDERS */}
          {activeTab === "folders" && (
            <FlatList
              data={folderGroups}
              keyExtractor={(item) => item.name}
              className="mb-3"
              ListEmptyComponent={
                !loading ? (
                  <View className="py-10 items-center justify-center">
                    <HardDrive color="#52525B" size={38} />
                    <Text className="text-zinc-400 text-xs text-center px-6 mt-2">
                      {t(
                        "reproductor_no_files_yet",
                        "Pulsa 'Escanear Música' para importar tus archivos MP3, FLAC, WAV o M4A.",
                      )}
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <View className="p-3.5 rounded-2xl mb-2 bg-zinc-950 border border-zinc-800 flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => handlePlayFolder(item.tracks)}
                    className="flex-row items-center flex-1 mr-2"
                  >
                    <FolderOpen color="#2DD4BF" size={20} />
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-white text-sm font-bold"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-zinc-400 text-[11px] font-mono">
                        {item.tracks.length} {t("reproductor_tracks", "pistas")}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handlePlayFolder(item.tracks)}
                      className="px-3 py-2 bg-teal-500/20 border border-teal-500/40 rounded-xl flex-row items-center"
                    >
                      <Play color="#2DD4BF" size={13} />
                      <Text className="text-teal-400 text-xs font-bold ml-1">
                        {t("reproductor_play_now", "Reproducir")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => toggleExcludedFolder(item.name)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        "reproductor_hide_folder",
                        "Ocultar carpeta",
                      )}
                      className="p-2 bg-zinc-800 rounded-xl"
                    >
                      <EyeOff color="#A1A1AA" size={15} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* TAB 2: SONGS */}
          {activeTab === "songs" && (
            <>
              <FlatList
                data={visibleTracks}
                keyExtractor={(item) => item.id}
                className="mb-3"
                ListEmptyComponent={
                  !loading ? (
                    <View className="py-10 items-center justify-center">
                      <HardDrive color="#52525B" size={38} />
                      <Text className="text-zinc-400 text-xs text-center px-6 mt-2">
                        {t(
                          "reproductor_no_files_yet",
                          "Pulsa 'Escanear Música' para importar tus archivos MP3, FLAC, WAV o M4A.",
                        )}
                      </Text>
                    </View>
                  ) : null
                }
                renderItem={({ item }) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <View
                      className={`p-3 rounded-xl mb-2 flex-row justify-between items-center border ${
                        isSelected
                          ? "bg-teal-500/10 border-teal-500/40"
                          : "bg-zinc-950 border-zinc-800"
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => toggleSelect(item.id)}
                        className="flex-row items-center flex-1 mr-2"
                      >
                        <View
                          className={`w-5 h-5 rounded items-center justify-center mr-3 border ${
                            isSelected
                              ? "bg-teal-500 border-teal-500"
                              : "bg-zinc-800 border-zinc-700"
                          }`}
                        >
                          {isSelected && <Check color="#09090b" size={14} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-white text-xs font-bold"
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text
                            className="text-zinc-500 text-[10px] font-mono"
                            numberOfLines={1}
                          >
                            {item.folder} • {item.format} •{" "}
                            {formatTime(item.durationMs)}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handlePlayNow(item)}
                        className="px-2.5 py-1.5 bg-zinc-800 rounded-lg"
                      >
                        <Text className="text-teal-400 text-[11px] font-bold">
                          {t("reproductor_play_now", "Reproducir")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />

              {visibleTracks.length > 0 && (
                <View className="flex-row gap-3 pt-2 border-t border-zinc-800">
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedIds.size >= visibleTracks.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(visibleTracks.map((f) => f.id)));
                      }
                    }}
                    className="py-2.5 px-4 bg-zinc-800 rounded-xl justify-center items-center"
                  >
                    <Text className="text-zinc-300 font-bold text-xs">
                      {selectedIds.size >= visibleTracks.length
                        ? t("reproductor_deselect_all", "Deseleccionar")
                        : t("reproductor_select_all", "Todos")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddSelected}
                    disabled={selectedIds.size === 0}
                    className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
                      selectedIds.size > 0 ? "bg-teal-500" : "bg-zinc-800"
                    }`}
                  >
                    <Text className="text-zinc-950 font-black text-xs">
                      {t("reproductor_add_to_playlist", "Agregar a Lista")} (
                      {visibleTracks.filter((tr) => selectedIds.has(tr.id)).length}
                      )
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* TAB 3: SAVED PLAYLISTS */}
          {activeTab === "playlists" && (
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-3">
                <TextInput
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholder={t(
                    "reproductor_new_playlist_ph",
                    "Nombre de lista (ej. Viaje Toyota)",
                  )}
                  placeholderTextColor="#71717A"
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-white text-xs px-3.5 py-2.5 rounded-xl"
                />
                <TouchableOpacity
                  onPress={handleSaveCurrentAsPlaylist}
                  disabled={
                    !newPlaylistName.trim() ||
                    (playlist.length === 0 && visibleTracks.length === 0)
                  }
                  className={`px-3.5 py-2.5 rounded-xl flex-row items-center ${
                    newPlaylistName.trim() &&
                    (playlist.length > 0 || visibleTracks.length > 0)
                      ? "bg-teal-500"
                      : "bg-zinc-800"
                  }`}
                >
                  <Plus color="#09090b" size={16} />
                  <Text className="text-zinc-950 font-black text-xs ml-1">
                    {t("save", "Guardar")}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={savedPlaylists}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View className="py-10 items-center justify-center">
                    <ListMusic color="#52525B" size={38} />
                    <Text className="text-zinc-400 text-xs text-center px-6 mt-2">
                      {t(
                        "reproductor_no_playlists",
                        "Guarda tu cola actual como lista personalizada para cargarla en un toque.",
                      )}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View className="p-3.5 rounded-2xl mb-2 bg-zinc-950 border border-zinc-800 flex-row items-center justify-between">
                    <TouchableOpacity
                      onPress={async () => {
                        await loadSavedPlaylist(item.id);
                        onClose();
                      }}
                      className="flex-row items-center flex-1 mr-2"
                    >
                      <Music color="#2DD4BF" size={18} />
                      <View className="ml-3 flex-1">
                        <Text
                          className="text-white text-sm font-bold"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-400 text-[11px] font-mono">
                          {item.tracks.length} {t("reproductor_tracks", "pistas")}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteSavedPlaylist(item.id)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t("delete", "Eliminar")}
                      className="p-2 bg-zinc-800 rounded-xl"
                    >
                      <Trash2 color="#ef4444" size={15} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

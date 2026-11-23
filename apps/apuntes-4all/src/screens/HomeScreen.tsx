import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import { useNotesStore, Folder } from "../store/useNotesStore";
import {
  FolderPlus,
  ChevronRight,
  Search,
  Download,
  Upload,
  Lock,
  X,
  Settings,
  Trash2,
} from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";
  const { folders, notes, addFolder, deleteFolder, importBackup } =
    useNotesStore();

  const [globalSearch, setGlobalSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [isFolderPrivate, setIsFolderPrivate] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const privateFolderIds = useMemo(
    () => new Set(folders.filter((f) => f.isPrivate).map((f) => f.id)),
    [folders],
  );

  const publicNotesCount = useMemo(
    () => notes.filter((n) => !n.folderId || !privateFolderIds.has(n.folderId)).length,
    [notes, privateFolderIds],
  );

  // Global search results across all public notes (excludes private biometric folders)
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const query = globalSearch.toLowerCase();
    return notes.filter(
      (n) =>
        (!n.folderId || !privateFolderIds.has(n.folderId)) &&
        (n.title.toLowerCase().includes(query) ||
          n.textContent.toLowerCase().includes(query)),
    );
  }, [notes, privateFolderIds, globalSearch]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), newFolderIcon, isFolderPrivate);
      setNewFolderName("");
      setNewFolderIcon("📁");
      setIsFolderPrivate(false);
      setIsModalVisible(false);
    }
  };

  // Open folder with fail-closed biometric check if private
  const handleOpenFolder = async (folder: Folder) => {
    if (folder.isPrivate) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: t(
              "apuntes_auth_prompt",
              "Autentícate para acceder a esta carpeta privada",
            ),
            fallbackLabel: t("apuntes_auth_fallback", "Usar código"),
          });

          if (!auth.success) {
            Alert.alert(
              t("apuntes_auth_denied", "Acceso Denegado"),
              t("apuntes_auth_failed", "Autenticación requerida para acceder."),
            );
            return;
          }
        }
      } catch {
        Alert.alert(
          t("apuntes_auth_denied", "Acceso Denegado"),
          t(
            "apuntes_auth_error",
            "No se pudo verificar tu identidad. Intenta nuevamente.",
          ),
        );
        return;
      }
    }

    navigation.navigate("NotesList", {
      folderId: folder.id,
      folderName: folder.name,
    });
  };

  // Delete folder with fail-closed biometric guard if private
  const handleDeleteFolder = async (folder: Folder) => {
    if (folder.isPrivate) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: t(
              "apuntes_auth_delete",
              "Autentícate para eliminar esta carpeta privada",
            ),
            fallbackLabel: t("apuntes_auth_fallback", "Usar código"),
          });

          if (!auth.success) {
            Alert.alert(
              t("apuntes_auth_denied", "Acceso Denegado"),
              t("apuntes_auth_failed", "Autenticación requerida para eliminar."),
            );
            return;
          }
        }
      } catch {
        return;
      }
    }

    Alert.alert(
      t("delete_folder", "Eliminar Carpeta"),
      t(
        "delete_folder_confirm",
        `¿Estás seguro de que deseas eliminar la carpeta "${folder.name}" y sus notas?`,
      ),
      [
        { text: t("cancel", "Cancelar"), style: "cancel" },
        {
          text: t("delete_folder", "Eliminar Carpeta"),
          style: "destructive",
          onPress: () => deleteFolder(folder.id),
        },
      ],
    );
  };

  // Export local backup (.json) — excludes private encrypted folders for safety
  const handleExportBackup = async () => {
    try {
      const publicFolders = folders.filter((f) => !f.isPrivate);
      const publicNotes = notes.filter(
        (n) => !n.folderId || !privateFolderIds.has(n.folderId),
      );

      const backupData = {
        app: "apuntes-4all",
        exportedAt: new Date().toISOString(),
        version: "1.0",
        folders: publicFolders,
        notes: publicNotes,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const filename = `apuntes_backup_${Date.now()}.json`;
      const path = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(path, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert(
          t("apuntes_backup_saved", "Respaldo guardado"),
          filename,
        );
      }
    } catch {
      Alert.alert(
        t("apuntes_backup_error_title", "No se pudo exportar"),
        t(
          "apuntes_backup_error_desc",
          "Verifica el espacio disponible en tu dispositivo e intenta de nuevo.",
        ),
      );
    }
  };

  // Import local backup (.json) without duplicating existing folders/notes
  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed?.folders) || !Array.isArray(parsed?.notes)) {
        Alert.alert(
          t("apuntes_import_invalid_title", "Archivo no compatible"),
          t(
            "apuntes_import_invalid_desc",
            "Selecciona un archivo .json exportado previamente desde Apuntes 4All.",
          ),
        );
        return;
      }

      const { addedFolders, addedNotes } = importBackup(
        parsed.folders,
        parsed.notes,
      );

      Alert.alert(
        t("apuntes_import_success_title", "Respaldo restaurado"),
        t(
          "apuntes_import_success_desc",
          `Se importaron ${addedFolders} carpetas y ${addedNotes} notas nuevas.`,
          { folders: addedFolders, notes: addedNotes },
        ),
      );
    } catch {
      Alert.alert(
        t("apuntes_import_error_title", "No se pudo importar"),
        t(
          "apuntes_import_error_desc",
          "El archivo está dañado o no es un respaldo JSON válido de Apuntes 4All.",
        ),
      );
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <View className="pt-3 pb-4 px-6 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Text className="text-3xl font-black text-zinc-900 dark:text-white">
            {t("apuntes_folders", "Carpetas")}
          </Text>

          <View className="flex-row items-center gap-2">
            {/* Import Backup Button */}
            <TouchableOpacity
              onPress={handleImportBackup}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t(
                "apuntes_import_backup",
                "Importar respaldo JSON",
              )}
              className="bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-full border border-zinc-200 dark:border-zinc-700"
            >
              <Upload color={accentHex} size={20} />
            </TouchableOpacity>

            {/* Export Backup Button */}
            <TouchableOpacity
              onPress={handleExportBackup}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t(
                "apuntes_export_backup",
                "Exportar copia de seguridad local",
              )}
              className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-full border border-blue-500/20"
            >
              <Download color={accentHex} size={20} />
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Ajustes")}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <Settings color={accentHex} size={20} />
            </TouchableOpacity>

            {/* New Folder Button */}
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("apuntes_new_folder", "Nueva Carpeta")}
              className="bg-blue-600 p-2.5 rounded-full shadow-sm"
            >
              <FolderPlus color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Live Search Bar */}
        <View className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2 border border-zinc-200 dark:border-zinc-700">
            <Search color="#a1a1aa" size={18} />
            <TextInput
              value={globalSearch}
              onChangeText={setGlobalSearch}
              placeholder={t("apuntes_search", "Buscar en todas las notas...")}
              placeholderTextColor="#a1a1aa"
              className="flex-1 ml-2 text-zinc-900 dark:text-white font-medium text-sm py-1"
            />
            {globalSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => setGlobalSearch("")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("clear", "Borrar")}
                className="p-1"
              >
                <X color="#a1a1aa" size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* SEARCH RESULTS VIEW */}
          {globalSearch.trim().length > 0 ? (
            <View className="mb-6">
              <Text className="text-xs uppercase font-bold text-zinc-400 mb-3 tracking-wider">
                {t("apuntes_search_results", "Resultados ({{count}})", {
                  count: searchResults.length,
                })}
              </Text>
              {searchResults.length === 0 ? (
                <Text className="text-zinc-400 text-center py-6">
                  {t(
                    "apuntes_no_search_results",
                    `No se encontraron notas con "${globalSearch}"`,
                    { query: globalSearch },
                  )}
                </Text>
              ) : (
                searchResults.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    onPress={() =>
                      navigation.navigate("Editor", {
                        noteId: note.id,
                        folderId: note.folderId,
                      })
                    }
                    className="bg-white dark:bg-zinc-900 p-4 rounded-2xl mb-2.5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <Text className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                      {note.title || t("apuntes_untitled", "Sin Título")}
                    </Text>
                    <Text className="text-zinc-500 text-xs" numberOfLines={2}>
                      {note.textContent}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            <>
              {/* All Notes Folder (Virtual) */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("NotesList", {
                    folderId: null,
                    folderName: t("apuntes_all", "Todas las Notas"),
                  })
                }
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_all", "Todas las Notas")}
                className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-5 flex-row items-center border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <View className="bg-blue-50 dark:bg-blue-950/40 w-12 h-12 rounded-2xl items-center justify-center mr-4 border border-blue-500/20">
                  <Text className="text-2xl">📝</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-zinc-900 dark:text-white">
                    {t("apuntes_all", "Todas las Notas")}
                  </Text>
                  <Text className="text-zinc-400 text-xs">
                    {publicNotesCount} {t("apuntes_title", "Notas")}
                  </Text>
                </View>
                <ChevronRight color="#a1a1aa" size={22} />
              </TouchableOpacity>

              <Text className="text-zinc-400 font-bold mb-3 uppercase text-xs tracking-wider">
                {t("apuntes_folders", "Carpetas")}
              </Text>

              {folders.map((folder) => {
                const count = notes.filter(
                  (n) => n.folderId === folder.id,
                ).length;
                return (
                  <TouchableOpacity
                    key={folder.id}
                    onPress={() => handleOpenFolder(folder)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={folder.name}
                    className="bg-white dark:bg-zinc-900 p-4 rounded-2xl mb-2.5 flex-row items-center justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{folder.icon}</Text>
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="text-base font-bold text-zinc-900 dark:text-white mr-1.5">
                            {folder.name}
                          </Text>
                          {folder.isPrivate && (
                            <Lock color={accentHex} size={14} />
                          )}
                        </View>
                        <Text className="text-zinc-400 text-xs">
                          {count} {t("apuntes_title", "Notas")}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteFolder(folder)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t("delete_folder", "Eliminar Carpeta")}
                      className="p-2.5"
                    >
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <View className="h-12" />
        </ScrollView>

        {/* New Folder Modal */}
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/60 justify-center items-center p-6">
            <View className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-black text-zinc-900 dark:text-white">
                  {t("apuntes_new_folder", "Nueva Carpeta")}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("cancel", "Cancelar")}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <View className="flex-row mb-4">
                <TextInput
                  value={newFolderIcon}
                  onChangeText={setNewFolderIcon}
                  className="bg-zinc-100 dark:bg-zinc-800 w-14 h-14 rounded-2xl text-center text-2xl mr-3 border border-zinc-200 dark:border-zinc-700"
                  maxLength={2}
                />
                <TextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder={t("apuntes_new_folder", "Nombre")}
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-800 flex-1 px-4 rounded-2xl text-zinc-900 dark:text-white font-bold text-base border border-zinc-200 dark:border-zinc-700"
                />
              </View>

              {/* Biometric + Encryption Toggle */}
              <View className="flex-row items-center justify-between py-3 mb-6 border-t border-b border-zinc-100 dark:border-zinc-800">
                <View className="flex-row items-center flex-1 mr-2">
                  <Lock color={accentHex} size={18} className="mr-2" />
                  <View className="flex-1">
                    <Text className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                      {t("apuntes_folder_private", "Carpeta Privada")}
                    </Text>
                    <Text className="text-zinc-400 text-[10px]">
                      {t(
                        "apuntes_folder_private_desc",
                        "Cifrado local + bloqueo con Face ID / Huella",
                      )}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isFolderPrivate}
                  onValueChange={setIsFolderPrivate}
                  trackColor={{ false: "#71717a", true: "#2563EB" }}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateFolder}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-base">
                  {t("save", "Crear Carpeta")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName="Apuntes 4All"
          accentColor="#2563EB"
          i18nInstance={i18n}
        />
      </View>
    </SafeAreaView>
  );
}

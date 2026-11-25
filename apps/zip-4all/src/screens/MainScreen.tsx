import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  zip,
  unzip,
  zipWithPassword,
  unzipWithPassword,
  listContents,
  EncryptionMethods,
  ZipEntry,
} from "react-native-zip-archive";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { useZipStore } from "../store/useZipStore";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  FileArchive,
  ArchiveRestore,
  History,
  Share as ShareIcon,
  Lock,
  ShieldOff,
  TrendingDown,
  Eye,
  FileText,
  Image as ImageIcon,
  FileQuestion,
  X,
  Copy,
  Settings,
  CheckSquare,
  Square,
  FolderDown,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

interface CompressionMetrics {
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
}

interface PreviewFile {
  uri: string;
  name: string;
  type: "image" | "text" | "other";
  textContent?: string;
}

interface PendingZipInspect {
  uri: string;
  name: string;
  entries: ZipEntry[];
}

export default function MainScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";
  const mutedHex = isDark ? "#a1a1aa" : "#71717a";

  const { logs, addLog, clearLogs } = useZipStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Results
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);
  const [outputZip, setOutputZip] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CompressionMetrics | null>(null);

  // Selective extraction inspector modal
  const [pendingInspect, setPendingInspect] =
    useState<PendingZipInspect | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // Preview Modal
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const saveZipToDeviceStorage = async (sourceUri: string) => {
    try {
      const fileName = sourceUri.split("/").pop() || `archive_${Date.now()}.zip`;
      if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
        const perm =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) return;

        const base64 = await FileSystem.readAsStringAsync(sourceUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const destUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            perm.directoryUri,
            fileName,
            "application/zip",
          );
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert(
          t("zip_success", "¡Guardado!"),
          t(
            "zip_saved_device_ok",
            "Archivo guardado en la carpeta elegida de tu teléfono ({{name}}).",
            { name: fileName },
          ),
        );
      } else {
        await Sharing.shareAsync(sourceUri);
      }
    } catch {
      Alert.alert(
        t("zip_err_save_title", "No se pudo guardar en carpeta"),
        t(
          "zip_err_save_desc",
          "Intenta elegir la carpeta Descargas o Documentos, o usa Compartir.",
        ),
      );
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(
      sizes.length - 1,
      Math.floor(Math.log(bytes) / Math.log(k)),
    );
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleCompress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      setIsProcessing(true);
      setExtractedFiles([]);
      setOutputZip(null);
      setMetrics(null);

      let totalOriginalBytes = 0;
      for (const asset of result.assets) {
        if (asset.size) {
          totalOriginalBytes += asset.size;
        } else {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info.exists && info.size) totalOriginalBytes += info.size;
        }
      }

      const tempFolder = `${FileSystem.cacheDirectory}zip_temp_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(tempFolder, { intermediates: true });

      for (let idx = 0; idx < result.assets.length; idx++) {
        const asset = result.assets[idx];
        const safeName = asset.name || `file_${idx + 1}`;
        await FileSystem.copyAsync({
          from: asset.uri,
          to: `${tempFolder}${safeName}`,
        });
      }

      const zipFileName = `archive_${Date.now()}.zip`;
      const targetPath = `${FileSystem.documentDirectory}${zipFileName}`;

      if (password.trim().length > 0) {
        await zipWithPassword(
          tempFolder,
          targetPath,
          password,
          EncryptionMethods.AES_256,
        );
      } else {
        await zip(tempFolder, targetPath);
      }

      await FileSystem.deleteAsync(tempFolder, { idempotent: true });

      const zipInfo = await FileSystem.getInfoAsync(targetPath);
      const zipBytes = zipInfo.exists && zipInfo.size ? zipInfo.size : 0;

      const savedPercent =
        totalOriginalBytes > 0 && zipBytes > 0
          ? Math.max(
              0,
              Math.round(
                ((totalOriginalBytes - zipBytes) / totalOriginalBytes) * 100,
              ),
            )
          : 0;

      setMetrics({
        originalBytes: totalOriginalBytes,
        compressedBytes: zipBytes,
        savingsPercent: savedPercent,
      });

      setOutputZip(targetPath);
      addLog("COMPRESS", zipFileName);
      Alert.alert(
        t("zip_success", "¡Éxito!"),
        t("zip_compress_done_desc", "Archivo ZIP creado correctamente."),
      );
    } catch {
      Alert.alert(
        t("zip_err_compress_title", "No se pudo comprimir"),
        t(
          "zip_err_compress_desc",
          "Verifica el espacio disponible en tu dispositivo e intenta con otros archivos.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const executeExtraction = async (
    sourceZip: string,
    zipName: string,
    onlyEntries?: string[],
  ) => {
    try {
      setIsProcessing(true);
      setExtractedFiles([]);
      setOutputZip(null);
      setMetrics(null);

      const targetFolder = `${FileSystem.documentDirectory}extraido_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(targetFolder, {
        intermediates: true,
      });

      const hasPass = password.trim().length > 0;
      if (hasPass) {
        if (onlyEntries && onlyEntries.length > 0) {
          await unzipWithPassword(
            sourceZip,
            targetFolder,
            password,
            onlyEntries,
          );
        } else {
          await unzipWithPassword(sourceZip, targetFolder, password);
        }
      } else {
        if (onlyEntries && onlyEntries.length > 0) {
          await unzip(sourceZip, targetFolder, onlyEntries);
        } else {
          await unzip(sourceZip, targetFolder);
        }
      }

      const getAllFiles = async (dir: string): Promise<string[]> => {
        try {
          const entries = await FileSystem.readDirectoryAsync(dir);
          let results: string[] = [];
          for (const entry of entries) {
            const fullPath = `${dir}${entry}`;
            const info = await FileSystem.getInfoAsync(fullPath);
            if (info.isDirectory) {
              const nested = await getAllFiles(`${fullPath}/`);
              results = results.concat(nested);
            } else {
              results.push(fullPath);
            }
          }
          return results;
        } catch {
          return [];
        }
      };

      const fullPaths = await getAllFiles(targetFolder);
      setExtractedFiles(fullPaths);
      addLog("DECOMPRESS", zipName);
      Alert.alert(
        t("zip_success", "¡Éxito!"),
        t("zip_extract_done_desc", {
          count: fullPaths.length,
          defaultValue: "Se extrajeron {{count}} archivos correctamente.",
        }),
      );
    } catch {
      Alert.alert(
        t("zip_err_extract_title", "No se pudo descomprimir"),
        t(
          "zip_err_extract_desc",
          "El archivo puede estar dañado o requerir una contraseña diferente.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const inspectOrExtractZip = useCallback(
    async (sourceZip: string, zipName: string) => {
      try {
        const allEntries = await listContents(sourceZip);
        const fileEntries = allEntries.filter((e) => !e.isDirectory);
        if (fileEntries.length > 1) {
          setPendingInspect({
            uri: sourceZip,
            name: zipName,
            entries: fileEntries,
          });
          setSelectedPaths(fileEntries.map((e) => e.path));
          return;
        }
      } catch {
        // Fallback to direct full extraction if listing isn't supported for this archive
      }
      await executeExtraction(sourceZip, zipName);
    },
    [],
  );

  // Auto-open incoming .zip when user taps a ZIP in WhatsApp/Files and chooses "ZIP 4All"
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const checkIncomingZip = async () => {
      try {
        const intent = await NativeModules.ZipIntent4All?.getInitialZipIntent?.();
        if (intent?.uri) {
          await inspectOrExtractZip(intent.uri, intent.name || "archivo.zip");
        }
      } catch {}
    };
    checkIncomingZip();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkIncomingZip();
    });
    return () => sub.remove();
  }, [inspectOrExtractZip]);

  const handleDecompress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      const sourceZip = result.assets[0].uri;
      const zipName = result.assets[0].name || "archive.zip";

      await inspectOrExtractZip(sourceZip, zipName);
    } catch {
      Alert.alert(
        t("zip_err_extract_title", "No se pudo descomprimir"),
        t(
          "zip_err_extract_desc",
          "El archivo puede estar dañado o requerir una contraseña diferente.",
        ),
      );
    }
  };

  const toggleEntrySelection = (entryPath: string) => {
    setSelectedPaths((prev) =>
      prev.includes(entryPath)
        ? prev.filter((p) => p !== entryPath)
        : [...prev, entryPath],
    );
  };

  const handleConfirmSelectiveExtract = async () => {
    if (!pendingInspect || selectedPaths.length === 0) return;
    const { uri, name, entries } = pendingInspect;
    const isAllSelected = selectedPaths.length === entries.length;
    setPendingInspect(null);
    await executeExtraction(
      uri,
      name,
      isAllSelected ? undefined : selectedPaths,
    );
  };

  const shareFile = async (uri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      // User dismissed share sheet
    }
  };

  const handlePreview = async (uri: string) => {
    const filename = uri.split("/").pop() || "file";
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const imageExtensions = ["png", "jpg", "jpeg", "webp", "gif"];
    const textExtensions = [
      "txt",
      "json",
      "csv",
      "md",
      "js",
      "ts",
      "html",
      "xml",
      "log",
    ];

    if (imageExtensions.includes(ext)) {
      setPreviewFile({
        uri,
        name: filename,
        type: "image",
      });
    } else if (textExtensions.includes(ext)) {
      try {
        const content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setPreviewFile({
          uri,
          name: filename,
          type: "text",
          textContent: content.slice(0, 15000),
        });
      } catch {
        shareFile(uri);
      }
    } else {
      shareFile(uri);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="py-3.5 px-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <FileArchive color={accentHex} size={23} />
              <Text
                className="text-xl font-black text-zinc-900 dark:text-white ml-2"
                numberOfLines={1}
              >
                {t("zip_title", "ZIP 4All")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Configuración")}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <Settings color={accentHex} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-5"
          keyboardShouldPersistTaps="handled"
        >
          {/* Password Security Input */}
          <View className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-3xl mb-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex-row items-center">
            {password ? (
              <Lock color={accentHex} size={20} />
            ) : (
              <ShieldOff color="#a1a1aa" size={20} />
            )}
            <TextInput
              className="flex-1 text-zinc-900 dark:text-white font-mono text-sm ml-3 py-1"
              placeholder={t("zip_password", "Contraseña (Opcional)")}
              placeholderTextColor="#71717a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {password.length > 0 && (
              <TouchableOpacity
                onPress={() => setPassword("")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("clear", "Borrar")}
                className="p-1.5"
              >
                <X color={mutedHex} size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-6 gap-3">
            <TouchableOpacity
              onPress={handleCompress}
              disabled={isProcessing}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("zip_compress", "Comprimir")}
              className={`flex-1 py-6 rounded-3xl items-center border-2 border-teal-700 dark:border-teal-500 ${
                isProcessing
                  ? "bg-zinc-200 dark:bg-zinc-800 border-transparent"
                  : "bg-teal-500/10 dark:bg-teal-400/10"
              }`}
            >
              <FileArchive
                color={isProcessing ? "#a1a1aa" : accentHex}
                size={36}
              />
              <Text
                className={`font-black text-base mt-2 ${
                  isProcessing
                    ? "text-zinc-500"
                    : "text-teal-800 dark:text-teal-400"
                }`}
              >
                {t("zip_compress", "Comprimir")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecompress}
              disabled={isProcessing}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("zip_decompress", "Descomprimir")}
              className={`flex-1 py-6 rounded-3xl items-center border-2 border-zinc-300 dark:border-zinc-700 ${
                isProcessing
                  ? "bg-zinc-200 dark:bg-zinc-800 border-transparent"
                  : "bg-white dark:bg-zinc-900"
              }`}
            >
              <ArchiveRestore
                color={isProcessing ? "#a1a1aa" : mutedHex}
                size={36}
              />
              <Text
                className={`font-black text-base mt-2 ${
                  isProcessing
                    ? "text-zinc-500"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("zip_decompress", "Descomprimir")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          {isProcessing && (
            <View className="items-center mb-6">
              <ActivityIndicator size="large" color={accentHex} />
              <Text className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium text-sm">
                {t("zip_processing", "Procesando archivo ZIP...")}
              </Text>
            </View>
          )}

          {/* COMPRESSION PERFORMANCE METRICS CARD */}
          {metrics && (
            <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs uppercase font-black text-teal-700 dark:text-teal-400 tracking-wider">
                  {t("zip_perf_title", "Rendimiento de Compresión")}
                </Text>
                {metrics.savingsPercent > 0 && (
                  <View className="bg-teal-500/10 dark:bg-teal-400/10 px-2.5 py-1 rounded-full border border-teal-500/20 flex-row items-center">
                    <TrendingDown color={accentHex} size={12} />
                    <Text className="text-teal-800 dark:text-teal-400 font-black text-xs ml-1">
                      -{metrics.savingsPercent}%
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
                  {t("zip_orig_size", "Tamaño Original")}:
                </Text>
                <Text className="font-bold text-zinc-800 dark:text-zinc-200 text-sm font-mono">
                  {formatBytes(metrics.originalBytes)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
                  {t("zip_final_size", "Tamaño ZIP")}:
                </Text>
                <Text className="font-black text-teal-700 dark:text-teal-400 text-sm font-mono">
                  {formatBytes(metrics.compressedBytes)}
                </Text>
              </View>

              {outputZip && (
                <View className="mt-4 gap-2.5">
                  <TouchableOpacity
                    onPress={() => saveZipToDeviceStorage(outputZip)}
                    className="w-full py-3.5 rounded-2xl bg-teal-700 dark:bg-teal-600 flex-row items-center justify-center shadow-sm"
                  >
                    <FolderDown color="#fff" size={16} />
                    <Text className="text-white font-bold text-sm ml-2">
                      {t("zip_save_to_phone", "Guardar en Carpeta del Teléfono")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => shareFile(outputZip)}
                    className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-row items-center justify-center"
                  >
                    <ShareIcon color={accentHex} size={16} />
                    <Text className="text-zinc-900 dark:text-white font-bold text-sm ml-2">
                      {t("zip_share_file", "Compartir Archivo ZIP")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Results View: Extracted Files List with PREVIEWS */}
          {extractedFiles.length > 0 && !isProcessing && (
            <View className="mb-6">
              <Text className="font-black text-base text-zinc-900 dark:text-white mb-3">
                {t("zip_extracted_files", {
                  count: extractedFiles.length,
                  defaultValue: "Archivos Extraídos ({{count}})",
                })}
              </Text>
              {extractedFiles.map((uri, idx) => {
                const filename = uri.split("/").pop() || "";
                const ext = filename.split(".").pop()?.toLowerCase() || "";
                const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(
                  ext,
                );
                const isText = [
                  "txt",
                  "json",
                  "csv",
                  "md",
                  "js",
                  "ts",
                  "html",
                  "xml",
                  "log",
                ].includes(ext);

                return (
                  <View
                    key={`${uri}-${idx}`}
                    className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl mb-2 flex-row justify-between items-center shadow-sm border border-zinc-200 dark:border-zinc-800"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      {isImage ? (
                        <ImageIcon color={accentHex} size={20} />
                      ) : isText ? (
                        <FileText color={accentHex} size={20} />
                      ) : (
                        <FileQuestion color={mutedHex} size={20} />
                      )}
                      <Text
                        className="text-zinc-800 dark:text-zinc-200 font-medium text-sm flex-1 ml-2.5"
                        numberOfLines={1}
                      >
                        {filename}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      {(isImage || isText) && (
                        <TouchableOpacity
                          onPress={() => handlePreview(uri)}
                          className="bg-teal-500/10 dark:bg-teal-400/10 px-3 py-2 rounded-xl border border-teal-500/20 flex-row items-center"
                        >
                          <Eye color={accentHex} size={14} />
                          <Text className="text-teal-800 dark:text-teal-400 font-bold text-xs ml-1">
                            {t("zip_preview", "Vista Previa")}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => shareFile(uri)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t("share", "Compartir")}
                        className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                      >
                        <ShareIcon color={mutedHex} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* History Log */}
          <View className="mt-2 mb-12">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <History color={mutedHex} size={18} />
                <Text className="font-bold text-base text-zinc-900 dark:text-white ml-2">
                  {t("zip_history", "Historial")}
                </Text>
              </View>
              {logs.length > 0 && (
                <TouchableOpacity onPress={clearLogs} className="p-1.5">
                  <Text className="text-red-500 font-bold text-xs">
                    {t("clear", "Borrar")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {logs.length === 0 ? (
              <Text className="text-zinc-400 dark:text-zinc-500 text-xs py-2">
                {t("zip_no_history", "Sin actividad reciente")}
              </Text>
            ) : (
              logs.map((log) => (
                <View
                  key={log.id}
                  className="mb-2 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                  <View className="flex-row items-center mb-1">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${
                        log.action === "COMPRESS"
                          ? "bg-teal-600"
                          : "bg-amber-500"
                      }`}
                    />
                    <Text className="font-bold text-zinc-700 dark:text-zinc-300 text-xs">
                      {log.action === "COMPRESS"
                        ? t("zip_compress", "Comprimir")
                        : t("zip_decompress", "Descomprimir")}
                    </Text>
                    <Text className="text-zinc-400 text-[10px] ml-auto font-mono">
                      {formatDate(log.timestamp)}
                    </Text>
                  </View>
                  <Text
                    className="text-zinc-500 dark:text-zinc-400 text-xs pl-4 font-mono"
                    numberOfLines={1}
                  >
                    {log.filename}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* SELECTIVE EXTRACTION INSPECTOR MODAL */}
        <Modal
          visible={!!pendingInspect}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPendingInspect(null)}
        >
          <View className="flex-1 bg-black/75 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-5 pt-5 pb-14 max-h-[82%] border-t border-zinc-200 dark:border-zinc-800">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="font-black text-base text-zinc-900 dark:text-white flex-1 mr-2"
                  numberOfLines={1}
                >
                  {t("zip_select_files_title", "Seleccionar archivos a extraer")}
                </Text>
                <TouchableOpacity
                  onPress={() => setPendingInspect(null)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("cancel", "Cancelar")}
                  className="p-2"
                >
                  <X color={mutedHex} size={20} />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="text-xs text-zinc-500 dark:text-zinc-400 font-mono flex-1 mr-2"
                  numberOfLines={1}
                >
                  {pendingInspect?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!pendingInspect) return;
                    if (
                      selectedPaths.length === pendingInspect.entries.length
                    ) {
                      setSelectedPaths([]);
                    } else {
                      setSelectedPaths(
                        pendingInspect.entries.map((e) => e.path),
                      );
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
                >
                  <Text className="text-xs font-bold text-teal-700 dark:text-teal-400">
                    {pendingInspect &&
                    selectedPaths.length === pendingInspect.entries.length
                      ? t("zip_deselect_all", "Ninguno")
                      : t("zip_select_all", "Todos")}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={pendingInspect?.entries || []}
                keyExtractor={(item) => item.path}
                className="mb-4"
                renderItem={({ item }) => {
                  const isChecked = selectedPaths.includes(item.path);
                  const shortName = item.path.split("/").pop() || item.path;
                  return (
                    <TouchableOpacity
                      onPress={() => toggleEntrySelection(item.path)}
                      className="flex-row items-center py-3 px-3 mb-1.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60"
                    >
                      {isChecked ? (
                        <CheckSquare color={accentHex} size={18} />
                      ) : (
                        <Square color={mutedHex} size={18} />
                      )}
                      <View className="flex-1 ml-3 mr-2">
                        <Text
                          className="text-sm font-semibold text-zinc-900 dark:text-white"
                          numberOfLines={1}
                        >
                          {shortName}
                        </Text>
                        <Text className="text-[11px] text-zinc-400 font-mono">
                          {formatBytes(item.size)}
                        </Text>
                      </View>
                      {item.isEncrypted && <Lock color={accentHex} size={14} />}
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                onPress={handleConfirmSelectiveExtract}
                disabled={selectedPaths.length === 0}
                className={`w-full py-3.5 rounded-2xl items-center justify-center ${
                  selectedPaths.length === 0
                    ? "bg-zinc-300 dark:bg-zinc-800"
                    : "bg-teal-700 dark:bg-teal-600"
                }`}
              >
                <Text className="text-white font-bold text-sm">
                  {t("zip_extract_selected_btn", {
                    count: selectedPaths.length,
                    defaultValue: "Extraer ({{count}})",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EXTRACTED FILE PREVIEW MODAL */}
        <Modal
          visible={!!previewFile}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPreviewFile(null)}
        >
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-14 max-h-[85%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className="font-black text-base text-zinc-900 dark:text-white flex-1 mr-2"
                  numberOfLines={1}
                >
                  {previewFile?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setPreviewFile(null)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("cancel", "Cancelar")}
                  className="p-2"
                >
                  <X color={mutedHex} size={22} />
                </TouchableOpacity>
              </View>

              {/* Image Preview */}
              {previewFile?.type === "image" && (
                <View className="items-center justify-center bg-black/90 rounded-2xl p-2 mb-4 h-72">
                  <Image
                    source={{ uri: previewFile.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Text Preview */}
              {previewFile?.type === "text" && (
                <ScrollView className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl mb-4 max-h-80">
                  <Text className="font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-5">
                    {previewFile.textContent}
                  </Text>
                </ScrollView>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (previewFile) shareFile(previewFile.uri);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-teal-700 dark:bg-teal-600 flex-row items-center justify-center"
                >
                  <ShareIcon color="#fff" size={16} />
                  <Text className="text-white font-bold text-sm ml-2">
                    {t("share", "Compartir")}
                  </Text>
                </TouchableOpacity>

                {previewFile?.type === "text" && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (previewFile.textContent) {
                        await Clipboard.setStringAsync(previewFile.textContent);
                        Alert.alert(
                          t("copied", "¡Copiado!"),
                          t(
                            "zip_clipboard_copied",
                            "Texto copiado al portapapeles.",
                          ),
                        );
                      }
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("copy", "Copiar")}
                    className="px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200 dark:border-zinc-700"
                  >
                    <Copy color={accentHex} size={18} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName={t("zip_title", "ZIP 4All")}
          accentColor={accentHex}
          i18nInstance={i18n}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

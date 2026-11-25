import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useQRStore, QRRecord } from "../store/useQRStore";
import {
  ChevronLeft,
  Trash2,
  Share as ShareIcon,
  Link as LinkIcon,
  QrCode,
  Wifi,
  User,
  MessageSquare,
  Coins,
  Mail,
  Phone,
  X,
  Download,
  Upload,
  Pencil,
} from "lucide-react-native";
import FramedQRCode from "../components/FramedQRCode";

export default function HistoryScreen({
  navigation,
}: {
  navigation: { goBack: () => void; navigate: (screen: string, params?: any) => void };
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";
  const mutedHex = isDark ? "#a1a1aa" : "#71717a";

  const {
    history,
    savedQRs,
    deleteRecord,
    deleteCreatedQR,
    clearHistory,
    clearSavedQRs,
    importSavedQRs,
  } = useQRStore();

  const [activeTab, setActiveTab] = useState<"saved" | "scanned">("saved");
  const [previewQR, setPreviewQR] = useState<QRRecord | null>(null);

  const confirmClear = () => {
    Alert.alert(
      activeTab === "saved"
        ? t("qr_clear_saved_title", "Vaciar Mis QR")
        : t("cuentas_clear_all", "Borrar Historial"),
      t("qr_clear_confirm", "¿Estás seguro de que deseas vaciar este listado?"),
      [
        { text: t("cancel", "Cancelar"), style: "cancel" },
        {
          text: t("delete", "Eliminar"),
          style: "destructive",
          onPress: () => {
            if (activeTab === "scanned") clearHistory();
            else clearSavedQRs();
          },
        },
      ],
    );
  };

  const handleShare = async (data: string) => {
    try {
      await Share.share({ message: data });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleExportBackup = async () => {
    if (savedQRs.length === 0) return;
    try {
      const payload = {
        app: "qr-4all",
        version: 1,
        exportedAt: new Date().toISOString(),
        savedQRs,
      };
      const fileUri = `${FileSystem.cacheDirectory}qr4all_backup_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(payload, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 },
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: t("qr_export_backup", "Exportar Respaldo JSON"),
        });
      } else {
        Alert.alert(
          t("qr_backup_saved", "Respaldo generado"),
          fileUri,
        );
      }
    } catch {
      Alert.alert(
        t("qr_err_backup_title", "No se pudo exportar"),
        t(
          "qr_err_backup_desc",
          "Verifica el espacio disponible en tu dispositivo e intenta de nuevo.",
        ),
      );
    }
  };

  const handleImportBackup = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const raw = await FileSystem.readAsStringAsync(res.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw) as { savedQRs?: QRRecord[] } | QRRecord[];
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.savedQRs)
          ? parsed.savedQRs
          : null;

      if (!records) {
        Alert.alert(
          t("qr_import_invalid_title", "Archivo no compatible"),
          t(
            "qr_import_invalid_desc",
            "Selecciona un archivo .json exportado previamente desde QR 4All.",
          ),
        );
        return;
      }

      const addedCount = importSavedQRs(records);
      Alert.alert(
        t("qr_import_ok_title", "Respaldo restaurado"),
        t("qr_import_ok_desc", {
          count: addedCount,
          defaultValue: "Se importaron {{count}} códigos QR nuevos.",
        }),
      );
    } catch {
      Alert.alert(
        t("qr_import_invalid_title", "Archivo no compatible"),
        t(
          "qr_import_invalid_desc",
          "Selecciona un archivo .json exportado previamente desde QR 4All.",
        ),
      );
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "wifi":
        return <Wifi color={accentHex} size={16} />;
      case "whatsapp":
        return <MessageSquare color={accentHex} size={16} />;
      case "vcard":
        return <User color={accentHex} size={16} />;
      case "bitcoin":
        return <Coins color={accentHex} size={16} />;
      case "email":
        return <Mail color={accentHex} size={16} />;
      case "phone":
        return <Phone color={accentHex} size={16} />;
      default:
        return <LinkIcon color={accentHex} size={16} />;
    }
  };

  const currentList = activeTab === "saved" ? savedQRs : history;

  const renderRecordItem = ({ item: record }: { item: QRRecord }) => (
    <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <View className="flex-row items-center mb-2">
        {renderTypeIcon(record.type)}
        <Text
          className="text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-wider ml-2 flex-1 mr-2"
          numberOfLines={1}
        >
          {record.title || record.type}
        </Text>
        <Text className="text-zinc-400 text-xs font-mono">
          {new Date(record.timestamp).toLocaleDateString()}
        </Text>
      </View>

      <Text
        className="text-zinc-900 dark:text-white font-medium text-base mb-3 font-mono"
        numberOfLines={2}
      >
        {record.data}
      </Text>

      <View className="flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-3">
        {/* View QR Code Button */}
        <TouchableOpacity
          onPress={() => setPreviewQR(record)}
          className="bg-teal-50 dark:bg-teal-950/40 px-3.5 py-2 rounded-xl flex-row items-center border border-teal-500/20"
        >
          <QrCode color={accentHex} size={14} />
          <Text className="text-teal-800 dark:text-teal-400 font-bold text-xs ml-1.5">
            {t("qr_view_qr", "Ver QR")}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          {activeTab === "saved" && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Generator", { editRecord: record })
              }
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("edit", "Editar")}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
            >
              <Pencil color={accentHex} size={17} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleShare(record.data)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("qr_share", "Compartir")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
          >
            <ShareIcon color={mutedHex} size={17} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (activeTab === "saved") deleteCreatedQR(record.id);
              else deleteRecord(record.id);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("delete", "Eliminar")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
          >
            <Trash2 color="#ef4444" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      {/* Header */}
      <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("back", "Volver")}
          className="mr-3 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <ChevronLeft color={accentHex} size={22} />
        </TouchableOpacity>
        <Text
          className="flex-1 text-xl font-black text-zinc-900 dark:text-white"
          numberOfLines={1}
        >
          {t("qr_library_title", "Biblioteca QR")}
        </Text>
        {currentList.length > 0 && (
          <TouchableOpacity onPress={confirmClear} className="p-2">
            <Text className="text-red-500 font-bold text-xs">
              {t("clear", "Borrar")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row p-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => setActiveTab("saved")}
          className={`flex-1 py-2.5 items-center rounded-xl ${
            activeTab === "saved"
              ? "bg-teal-700 dark:bg-teal-600"
              : "bg-transparent"
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              activeTab === "saved"
                ? "text-white"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {t("qr_my_qrs", "Mis Códigos QR")} ({savedQRs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("scanned")}
          className={`flex-1 py-2.5 items-center rounded-xl ${
            activeTab === "scanned"
              ? "bg-teal-700 dark:bg-teal-600"
              : "bg-transparent"
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              activeTab === "scanned"
                ? "text-white"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {t("qr_tab_scanned", "Escaneados")} ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Local JSON Backup / Restore Bar (Saved Tab) */}
      {activeTab === "saved" && (
        <View className="flex-row px-5 pt-3 pb-1 gap-2.5">
          <TouchableOpacity
            onPress={handleImportBackup}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-row items-center justify-center gap-1.5"
          >
            <Upload color={accentHex} size={15} />
            <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
              {t("qr_import_backup", "Importar JSON")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportBackup}
            disabled={savedQRs.length === 0}
            className={`flex-1 py-2.5 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
              savedQRs.length === 0
                ? "bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-50"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Download color={accentHex} size={15} />
            <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
              {t("qr_export_backup", "Exportar JSON")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Virtualized List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderRecordItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <QrCode size={48} color="#a1a1aa" />
            <Text className="text-zinc-400 dark:text-zinc-500 text-sm font-medium text-center mt-3 px-6">
              {activeTab === "saved"
                ? t(
                    "qr_saved_empty",
                    "Aún no tienes códigos QR guardados. Genera uno y guárdalo aquí.",
                  )
                : t("qr_empty", "No hay códigos escaneados.")}
            </Text>
          </View>
        }
      />

      {/* QR Code Quick Display Modal */}
      <Modal
        visible={!!previewQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewQR(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-white dark:bg-zinc-900 p-6 rounded-3xl items-center shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800">
            <View className="w-full flex-row justify-between items-center mb-4">
              <Text
                className="font-bold text-base text-zinc-900 dark:text-white flex-1 mr-2"
                numberOfLines={1}
              >
                {previewQR?.title || previewQR?.type.toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewQR(null)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("cancel", "Cancelar")}
                className="p-2"
              >
                <X color={mutedHex} size={20} />
              </TouchableOpacity>
            </View>

            {previewQR && (
              <View className="bg-white p-4 rounded-2xl border border-zinc-100 mb-4 shadow-sm items-center justify-center">
                <FramedQRCode
                  value={previewQR.data}
                  size={190}
                  styleConfig={
                    previewQR.style || {
                      fgColor: "#09090b",
                      bgColor: "#ffffff",
                      isGradient: false,
                      gradientColors: ["#2563eb", "#0d9488"],
                      logoUri: null,
                      presetIcon: null,
                      frameType: "none",
                      frameText: t("qr_frame_default_text", "¡Escanéame!"),
                    }
                  }
                />
              </View>
            )}

            <Text
              className="text-zinc-400 text-xs text-center font-mono mb-4 px-2"
              numberOfLines={2}
            >
              {previewQR?.data}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (previewQR) handleShare(previewQR.data);
              }}
              className="w-full py-3.5 rounded-2xl bg-teal-700 dark:bg-teal-600 items-center"
            >
              <Text className="text-white font-bold text-sm">
                {t("qr_share_content", "Compartir Contenido")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

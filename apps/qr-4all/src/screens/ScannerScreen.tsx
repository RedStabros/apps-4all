import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import {
  CameraView,
  BarcodeType,
  useCameraPermissions,
  scanFromURLAsync,
} from "expo-camera";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import { useQRStore } from "../store/useQRStore";
import {
  History as HistoryIcon,
  ScanLine,
  X,
  Copy,
  Image as ImageIcon,
  Zap,
  ZapOff,
  Settings,
  PlusSquare,
  ExternalLink,
  Barcode,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";

const QR_ONLY_TYPES: BarcodeType[] = ["qr"];
const ALL_BARCODE_TYPES: BarcodeType[] = [
  "qr",
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "pdf417",
  "aztec",
];

export default function ScannerScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { saveRecord } = useQRStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [includeBarcodes, setIncludeBarcodes] = useState(true);

  // Modal for showing scan result
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedFormat, setScannedFormat] = useState<string>("QR");
  const [copied, setCopied] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scannedData) return;
    const fmt = (type || "qr").toUpperCase();
    saveRecord({
      type: fmt === "QR" ? "scan" : fmt.toLowerCase(),
      title: fmt !== "QR" ? fmt : undefined,
      data,
    });
    setScannedFormat(fmt);
    setScannedData(data);
  };

  const handleScanFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        let barcodes = await scanFromURLAsync(
          imageUri,
          includeBarcodes ? ALL_BARCODE_TYPES : QR_ONLY_TYPES,
        );

        // Retry explicitly with QR-only if multi-barcode scan returned empty
        if ((!barcodes || barcodes.length === 0) && includeBarcodes) {
          barcodes = await scanFromURLAsync(imageUri, QR_ONLY_TYPES);
        }

        if (barcodes && barcodes.length > 0) {
          const data = barcodes[0].data;
          const fmt = (barcodes[0].type || "qr").toUpperCase();
          saveRecord({ type: "scan", data });
          setScannedFormat(fmt);
          setScannedData(data);
          return;
        }

        Alert.alert(
          t("qr_gallery_scan", "Escanear desde galería"),
          t(
            "qr_err_gallery_desc",
            "No se detectó ningún código QR en la imagen seleccionada. Prueba recortar la imagen para que el QR se vea más grande y nítido.",
          ),
        );
      }
    } catch {
      Alert.alert(
        t("qr_err_gallery_title", "No se pudo leer la imagen"),
        t(
          "qr_err_gallery_desc",
          "Selecciona una imagen nítida con un código QR visible o usa la cámara en vivo.",
        ),
      );
    }
  };

  const isLink = (text: string) => {
    const trimmed = text.trim().toLowerCase();
    return (
      trimmed.startsWith("https://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:") ||
      trimmed.startsWith("sms:")
    );
  };

  const handleOpenLink = async () => {
    if (!scannedData || !isLink(scannedData)) return;
    const url = scannedData.trim();
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          t("qr_scanned", "Código Escaneado"),
          t(
            "qr_link_unsupported",
            "No hay una aplicación instalada para abrir este enlace. Puedes copiarlo manualmente.",
          ),
        );
        return;
      }
      await Linking.openURL(url);
      setScannedData(null);
    } catch {
      Alert.alert(
        t("qr_scanned", "Código Escaneado"),
        t(
          "qr_link_error",
          "Intenta copiar el contenido y abrirlo manualmente en tu navegador.",
        ),
      );
    }
  };

  const handleCopy = async () => {
    if (scannedData) {
      await Clipboard.setStringAsync(scannedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#09090b" }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6"
      >
        <Text className="text-xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
          {t(
            "qr_camera_permission",
            "Necesitamos tu permiso para usar la cámara",
          )}
        </Text>
        <TouchableOpacity
          className="bg-teal-700 px-6 py-3.5 rounded-full"
          onPress={() => {
            requestPermission().catch(() => {});
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("qr_grant_permission", "Conceder Permiso")}
        >
          <Text className="text-white font-bold">
            {t("qr_grant_permission", "Conceder Permiso")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <CameraView
        key="qr-camera-active"
        style={{ flex: 1 }}
        facing="back"
        mode="picture"
        active={isFocused && !scannedData}
        enableTorch={torchEnabled}
        onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: includeBarcodes ? ALL_BARCODE_TYPES : QR_ONLY_TYPES,
        }}
      />

      {/* Overlay Container */}
      <View
        style={StyleSheet.absoluteFillObject}
        pointerEvents="box-none"
      >

      {/* Top Controls: Brand + Barcode Toggle + Torch + Settings */}
      <SafeAreaView edges={["top", "bottom"]} className="z-10">
        <View className="pt-2 px-5 flex-row justify-between items-center">
          <Text className="text-white/90 font-black text-lg tracking-wider">
            {t("qr_title", "QR 4All")}
          </Text>

          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={() => setIncludeBarcodes(!includeBarcodes)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("qr_barcode_toggle", "Alternar códigos de barras")}
              className={`px-3 py-2 rounded-full border flex-row items-center gap-1.5 ${
                includeBarcodes
                  ? "bg-teal-700/80 border-teal-400/50"
                  : "bg-black/50 border-white/20"
              }`}
            >
              <Barcode color="#fff" size={16} />
              <Text className="text-white text-[11px] font-bold">
                {includeBarcodes
                  ? t("qr_mode_all", "QR + Barras")
                  : t("qr_mode_qr_only", "Solo QR")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTorchEnabled(!torchEnabled)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("qr_torch", "Linterna")}
              className="p-2.5 bg-black/50 rounded-full border border-white/20"
            >
              {torchEnabled ? (
                <Zap color="#facc15" size={20} fill="#facc15" />
              ) : (
                <ZapOff color="#fff" size={20} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Configuración")}
              className="p-2.5 bg-black/50 rounded-full border border-white/20"
            >
              <Settings color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Target Framing Overlay */}
      <View className="flex-1 items-center justify-center pointer-events-none">
        <View className="w-64 h-64 border-2 border-white/40 rounded-3xl items-center justify-center relative">
          <View className="w-10 h-10 border-t-4 border-l-4 border-teal-400 absolute top-0 left-0 rounded-tl-2xl" />
          <View className="w-10 h-10 border-t-4 border-r-4 border-teal-400 absolute top-0 right-0 rounded-tr-2xl" />
          <View className="w-10 h-10 border-b-4 border-l-4 border-teal-400 absolute bottom-0 left-0 rounded-bl-2xl" />
          <View className="w-10 h-10 border-b-4 border-r-4 border-teal-400 absolute bottom-0 right-0 rounded-br-2xl" />
          <ScanLine color="rgba(255,255,255,0.3)" size={64} />
        </View>
        <Text className="text-white mt-6 font-bold text-xs bg-black/60 px-4 py-1.5 rounded-full tracking-wider">
          {includeBarcodes
            ? t("qr_aim_all", "Apunta al código QR o código de barras")
            : t("qr_aim_qr", "Apunta al código QR")}
        </Text>
      </View>

      {/* Bottom Nav Bar */}
      <View
        style={{ bottom: Math.max(insets.bottom + 18, 28) }}
        className="absolute flex-row w-full justify-evenly items-center px-6"
      >
        {/* History / Library */}
        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("qr_library_title", "Biblioteca QR")}
          className="bg-black/70 p-4 rounded-full border border-white/20 shadow-lg"
        >
          <HistoryIcon color="#fff" size={26} />
        </TouchableOpacity>

        {/* Scan from Gallery */}
        <TouchableOpacity
          onPress={handleScanFromGallery}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("qr_scan_gallery", "Escanear desde Galería")}
          className="bg-teal-700 p-5 rounded-full border-2 border-white/40 shadow-xl"
        >
          <ImageIcon color="#fff" size={28} />
        </TouchableOpacity>

        {/* Create / Generate QR */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Generator")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("qr_generate", "Generar")}
          className="bg-black/70 p-4 rounded-full border border-white/20 shadow-lg"
        >
          <PlusSquare color="#fff" size={26} />
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <Modal
        visible={!!scannedData}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setScannedData(null)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-black text-zinc-900 dark:text-white">
                  {t("qr_scanned", "Código Escaneado")}
                </Text>
                <View className="bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                    {scannedFormat}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setScannedData(null)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("cancel", "Cancelar")}
                className="p-2"
              >
                <X color="#a1a1aa" size={22} />
              </TouchableOpacity>
            </View>

            <View className="bg-zinc-100 dark:bg-zinc-800/70 p-4 rounded-2xl mb-6">
              <Text
                className="text-zinc-800 dark:text-zinc-200 text-base font-mono"
                numberOfLines={6}
              >
                {scannedData}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCopy}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 py-3.5 rounded-2xl flex-row items-center justify-center border border-zinc-200 dark:border-zinc-700"
              >
                <Copy color={accentHex} size={18} />
                <Text className="text-zinc-900 dark:text-white font-bold text-sm ml-2">
                  {copied ? t("copied", "¡Copiado!") : t("qr_copy", "Copiar")}
                </Text>
              </TouchableOpacity>

              {scannedData && isLink(scannedData) && (
                <TouchableOpacity
                  onPress={handleOpenLink}
                  className="flex-1 bg-teal-700 py-3.5 rounded-2xl flex-row items-center justify-center shadow-sm"
                >
                  <ExternalLink color="#fff" size={18} />
                  <Text className="text-white font-bold text-sm ml-2">
                    {t("qr_open_link", "Abrir Link")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <SettingsModal4All
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        appName={t("qr_title", "QR 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
      />
      </View>
    </View>
  );
}

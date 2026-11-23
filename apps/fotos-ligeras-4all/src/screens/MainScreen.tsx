import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  Image as ImageIcon,
  Zap,
  TrendingDown,
  SplitSquareVertical,
  Trash2,
  Settings,
  X,
  RotateCw,
  ShieldCheck,
} from "lucide-react-native";
import Slider from "@react-native-community/slider";

type PresetType = "whatsapp" | "email" | "max" | "balanced";

export default function MainScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";

  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Settings
  const [quality, setQuality] = useState<number>(0.7);
  const [maxWidth, setMaxWidth] = useState<string>("1280");
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [format, setFormat] = useState<ImageManipulator.SaveFormat>(
    ImageManipulator.SaveFormat.JPEG,
  );
  const [activePreset, setActivePreset] = useState<PresetType>("whatsapp");

  // Interactive Comparison state for the primary preview image
  const [previewCompressedUri, setPreviewCompressedUri] = useState<
    string | null
  >(null);
  const [originalSizeStr, setOriginalSizeStr] = useState<string>("");
  const [compressedSizeStr, setCompressedSizeStr] = useState<string>("");
  const [savingsPercent, setSavingsPercent] = useState<number>(0);
  const [comparisonSplit, setComparisonSplit] = useState<number>(50);

  // Apply Presets
  const applyPreset = (preset: PresetType) => {
    setActivePreset(preset);
    if (preset === "whatsapp") {
      setQuality(0.65);
      setMaxWidth("1280");
      setFormat(ImageManipulator.SaveFormat.JPEG);
    } else if (preset === "email") {
      setQuality(0.5);
      setMaxWidth("1024");
      setFormat(ImageManipulator.SaveFormat.JPEG);
    } else if (preset === "max") {
      setQuality(0.35);
      setMaxWidth("800");
      setFormat(ImageManipulator.SaveFormat.JPEG);
    } else if (preset === "balanced") {
      setQuality(0.85);
      setMaxWidth("");
      setFormat(ImageManipulator.SaveFormat.JPEG);
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

  const buildActions = (imgWidth: number): ImageManipulator.Action[] => {
    const actions: ImageManipulator.Action[] = [];
    if (rotationDeg !== 0) {
      actions.push({ rotate: rotationDeg });
    }
    const parsedWidth = parseInt(maxWidth, 10);
    if (!isNaN(parsedWidth) && parsedWidth > 0 && parsedWidth < imgWidth) {
      actions.push({ resize: { width: parsedWidth } });
    }
    return actions;
  };

  // Generate comparison preview whenever primary image or settings change (debounced)
  useEffect(() => {
    if (selectedImages.length === 0) {
      setPreviewCompressedUri(null);
      return;
    }

    let isMounted = true;
    const primary = selectedImages[0];

    const timer = setTimeout(async () => {
      try {
        let origBytes = primary.fileSize || 0;
        if (!origBytes) {
          const info = await FileSystem.getInfoAsync(primary.uri);
          if (info.exists && info.size) origBytes = info.size;
        }
        if (isMounted) setOriginalSizeStr(formatBytes(origBytes));

        const actions = buildActions(primary.width);
        const compResult = await ImageManipulator.manipulateAsync(
          primary.uri,
          actions,
          { compress: quality, format },
        );

        const compInfo = await FileSystem.getInfoAsync(compResult.uri);
        const compBytes = compInfo.exists && compInfo.size ? compInfo.size : 0;

        if (isMounted) {
          setPreviewCompressedUri(compResult.uri);
          setCompressedSizeStr(formatBytes(compBytes));
          if (origBytes > 0 && compBytes > 0) {
            const saved = Math.max(
              0,
              Math.round(((origBytes - compBytes) / origBytes) * 100),
            );
            setSavingsPercent(saved);
          } else {
            setSavingsPercent(0);
          }
        }
      } catch {
        // Silent fallback on preview
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedImages, quality, maxWidth, format, rotationDeg]);

  const pickImages = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("fotos_perm_title", "Permiso de galería"),
          t(
            "fotos_perm_desc",
            "Autoriza el acceso a tus fotos para comprimirlas y guardarlas.",
          ),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImages((prev) => [...prev, ...result.assets]);
      }
    } catch {
      Alert.alert(
        t("fotos_err_pick_title", "No se pudieron abrir tus fotos"),
        t(
          "fotos_err_pick_desc",
          "Revisa los permisos de galería en tu dispositivo e intenta de nuevo.",
        ),
      );
    }
  };

  const processImages = async () => {
    if (selectedImages.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const albumName = "Fotos Ligeras";

    try {
      let album = await MediaLibrary.getAlbumAsync(albumName);

      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        const actions = buildActions(img.width);

        const manipResult = await ImageManipulator.manipulateAsync(
          img.uri,
          actions,
          { compress: quality, format },
        );

        const asset = await MediaLibrary.createAssetAsync(manipResult.uri);
        if (album == null) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        setProgress(Math.round(((i + 1) / selectedImages.length) * 100));
      }

      Alert.alert(
        t("zip_success", "¡Éxito!"),
        t("fotos_done", "¡Listo! Guardado en Álbum: Fotos Ligeras"),
      );
      setSelectedImages([]);
      setRotationDeg(0);
    } catch {
      Alert.alert(
        t("fotos_err_compress_title", "No se pudieron comprimir las fotos"),
        t(
          "fotos_err_compress_desc",
          "Verifica el espacio disponible en tu galería e intenta con menos fotos a la vez.",
        ),
      );
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const windowWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="py-3.5 px-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <ImageIcon color={accentHex} size={23} />
            <Text
              className="text-xl font-black text-zinc-900 dark:text-white ml-2"
              numberOfLines={1}
            >
              {t("fotos_title", "Fotos Ligeras 4All")}
            </Text>
          </View>
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

        <ScrollView
          className="flex-1 px-5 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* EXIF Privacy Shield Banner */}
          <View className="flex-row items-center bg-teal-50 dark:bg-teal-950/30 border border-teal-500/20 px-3.5 py-2.5 rounded-2xl mb-4">
            <ShieldCheck color={accentHex} size={18} />
            <Text className="text-xs font-semibold text-teal-800 dark:text-teal-300 ml-2 flex-1">
              {t(
                "fotos_exif_privacy",
                "Privacidad EXIF activa: ubicación GPS y datos de cámara se eliminan al comprimir.",
              )}
            </Text>
          </View>

          {/* Preset Profiles Bar */}
          <Text className="text-xs uppercase font-bold text-zinc-400 mb-2 tracking-wider">
            {t("fotos_presets_label", "Perfiles Predefinidos")}
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() => applyPreset("whatsapp")}
              className={`px-3.5 py-2 rounded-2xl border flex-row items-center ${
                activePreset === "whatsapp"
                  ? "bg-teal-700 border-teal-700"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  activePreset === "whatsapp"
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("fotos_preset_whatsapp", "Para WhatsApp")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => applyPreset("email")}
              className={`px-3.5 py-2 rounded-2xl border flex-row items-center ${
                activePreset === "email"
                  ? "bg-teal-700 border-teal-700"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  activePreset === "email"
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("fotos_preset_email", "Para Correo (<2MB)")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => applyPreset("max")}
              className={`px-3.5 py-2 rounded-2xl border flex-row items-center ${
                activePreset === "max"
                  ? "bg-teal-700 border-teal-700"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  activePreset === "max"
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("fotos_preset_max", "Máximo Ahorro")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => applyPreset("balanced")}
              className={`px-3.5 py-2 rounded-2xl border flex-row items-center ${
                activePreset === "balanced"
                  ? "bg-teal-700 border-teal-700"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  activePreset === "balanced"
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("fotos_preset_balanced", "Alta Calidad")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* INTERACTIVE BEFORE / AFTER COMPARISON PREVIEW */}
          {selectedImages.length > 0 && previewCompressedUri && (
            <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <SplitSquareVertical color={accentHex} size={18} />
                  <Text className="font-bold text-zinc-900 dark:text-white text-xs uppercase tracking-wider ml-1.5">
                    {t("fotos_comparison", "Comparador Antes / Después")}
                  </Text>
                </View>

                {savingsPercent > 0 && (
                  <View className="bg-teal-500/10 dark:bg-teal-400/10 px-2.5 py-1 rounded-full border border-teal-500/20 flex-row items-center">
                    <TrendingDown color={accentHex} size={12} />
                    <Text className="text-teal-800 dark:text-teal-400 font-black text-xs ml-1">
                      -{savingsPercent}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Side by Side Preview Container */}
              <View className="h-56 w-full rounded-2xl overflow-hidden bg-black flex-row relative mb-3">
                {/* Left Side: Original */}
                <View
                  style={{ width: `${comparisonSplit}%` }}
                  className="h-full overflow-hidden relative"
                >
                  <Image
                    source={{ uri: selectedImages[0].uri }}
                    style={{ width: windowWidth - 72, height: 224 }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 left-2 bg-black/65 px-2 py-0.5 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">
                      {t("fotos_original", "Original")}: {originalSizeStr}
                    </Text>
                  </View>
                </View>

                {/* Split Line Indicator */}
                <View className="w-1 h-full bg-white z-10 shadow-lg" />

                {/* Right Side: Compressed */}
                <View
                  style={{ width: `${100 - comparisonSplit}%` }}
                  className="h-full overflow-hidden relative"
                >
                  <Image
                    source={{ uri: previewCompressedUri }}
                    style={{
                      width: windowWidth - 72,
                      height: 224,
                      position: "absolute",
                      right: 0,
                    }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 right-2 bg-teal-800/85 px-2 py-0.5 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">
                      {t("fotos_compressed", "Comprimida")}: {compressedSizeStr}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Split Slider */}
              <View className="flex-row items-center">
                <Text className="text-zinc-400 font-bold text-[10px] uppercase mr-2">
                  {t("fotos_original", "Original")}
                </Text>
                <Slider
                  style={{ flex: 1, height: 30 }}
                  minimumValue={10}
                  maximumValue={90}
                  value={comparisonSplit}
                  onValueChange={setComparisonSplit}
                  minimumTrackTintColor={accentHex}
                  maximumTrackTintColor="#52525b"
                  thumbTintColor="#2DD4BF"
                />
                <Text className="text-teal-700 dark:text-teal-400 font-bold text-[10px] uppercase ml-2">
                  {t("fotos_compressed", "Comprimida")}
                </Text>
              </View>
            </View>
          )}

          {/* Custom Controls (Quality / Width / Rotate / Format) */}
          <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl mb-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs uppercase font-bold text-zinc-400">
                {t("fotos_quality", "Calidad")}
              </Text>
              <Text className="text-teal-700 dark:text-teal-400 font-black text-sm">
                {Math.round(quality * 100)}%
              </Text>
            </View>

            <Slider
              style={{ width: "100%", height: 36 }}
              minimumValue={0.2}
              maximumValue={0.95}
              step={0.05}
              value={quality}
              onValueChange={setQuality}
              minimumTrackTintColor={accentHex}
              maximumTrackTintColor="#52525b"
              thumbTintColor="#2DD4BF"
            />

            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Text className="text-xs uppercase font-bold text-zinc-400">
                {t("fotos_width", "Ancho (px)")}
              </Text>
              <TextInput
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-1.5 rounded-xl font-mono text-center border border-zinc-200 dark:border-zinc-700 text-xs w-28"
                placeholder={t("fotos_original", "Original")}
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                value={maxWidth}
                onChangeText={setMaxWidth}
              />
            </View>

            {/* Quick 90° Rotation */}
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Text className="text-xs uppercase font-bold text-zinc-400">
                {t("fotos_rotate", "Rotación")}
              </Text>
              <TouchableOpacity
                onPress={() => setRotationDeg((prev) => (prev + 90) % 360)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("fotos_rotate_90", "Rotar 90°")}
                className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700"
              >
                <RotateCw color={accentHex} size={14} />
                <Text className="text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-1.5 font-mono">
                  {rotationDeg}°
                </Text>
              </TouchableOpacity>
            </View>

            {/* Output Format Selector */}
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Text className="text-xs uppercase font-bold text-zinc-400">
                {t("fotos_format", "Formato")}
              </Text>
              <View className="flex-row bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {[
                  { label: "JPG", val: ImageManipulator.SaveFormat.JPEG },
                  { label: "PNG", val: ImageManipulator.SaveFormat.PNG },
                  { label: "WEBP", val: ImageManipulator.SaveFormat.WEBP },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => setFormat(item.val)}
                    className={`px-3 py-1.5 rounded-lg ${
                      format === item.val ? "bg-teal-700" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        format === item.val
                          ? "text-white"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Photo Selection Box */}
          <TouchableOpacity
            onPress={pickImages}
            className="border-2 border-dashed border-teal-700/50 rounded-3xl p-6 items-center bg-teal-500/5 dark:bg-teal-400/5 mb-6"
          >
            <ImageIcon color={accentHex} size={40} />
            <Text className="text-teal-800 dark:text-teal-400 font-bold text-base mt-2">
              {t("fotos_select", "Seleccionar Fotos")}
            </Text>
            <Text className="text-zinc-400 text-xs mt-1 text-center">
              {t("fotos_offline_note", "Procesamiento 100% offline y local")}
            </Text>
          </TouchableOpacity>

          {/* Selected Photos Grid */}
          {selectedImages.length > 0 && (
            <View className="mb-28">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-zinc-900 dark:text-white text-sm">
                  {t("fotos_selected", "Seleccionadas: ")}
                  {selectedImages.length}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImages([]);
                    setRotationDeg(0);
                  }}
                  className="flex-row items-center p-1"
                >
                  <Trash2 color="#ef4444" size={14} />
                  <Text className="text-red-500 font-bold text-xs ml-1">
                    {t("fotos_clear", "Limpiar")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {selectedImages.slice(0, 10).map((img, i) => (
                  <View key={`${img.uri}-${i}`} className="relative">
                    <Image
                      source={{ uri: img.uri }}
                      className="w-14 h-14 rounded-xl"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedImages((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={t("delete", "Eliminar")}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 border border-white dark:border-zinc-900"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X color="#fff" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length > 10 && (
                  <View className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
                    <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs">
                      +{selectedImages.length - 10}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Compress Action Floating Bottom Bar */}
        {selectedImages.length > 0 && (
          <View className="absolute bottom-0 w-full p-5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <TouchableOpacity
              onPress={processImages}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl items-center flex-row justify-center shadow-md ${
                isProcessing
                  ? "bg-zinc-300 dark:bg-zinc-800"
                  : "bg-teal-700 dark:bg-teal-600"
              }`}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator color={accentHex} />
                  <Text className="text-zinc-600 dark:text-zinc-400 font-bold text-base ml-2">
                    {t("fotos_processing", "Procesando...")} {progress}%
                  </Text>
                </>
              ) : (
                <>
                  <Zap color="#fff" size={20} />
                  <Text className="text-white font-bold text-base ml-2">
                    {t("fotos_compress", "Comprimir Todas")} (
                    {selectedImages.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName={t("fotos_title", "Fotos Ligeras 4All")}
          accentColor={accentHex}
          i18nInstance={i18n}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

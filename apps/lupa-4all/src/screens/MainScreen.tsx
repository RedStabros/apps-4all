import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Camera, CameraView } from "expo-camera";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import Slider from "@react-native-community/slider";
import {
  Flashlight,
  FlashlightOff,
  Camera as CameraIcon,
  Play,
  Download,
  Eye,
  Check,
  Settings,
} from "lucide-react-native";
import * as MediaLibrary from "expo-media-library";

type AccessFilter = "normal" | "invert" | "yellow" | "mono";

const ZOOM_PRESETS = [
  { label: "1x", value: 0 },
  { label: "2x", value: 0.2 },
  { label: "3x", value: 0.4 },
  { label: "4x", value: 0.6 },
];

export default function MainScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [torch, setTorch] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<AccessFilter>("normal");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const toggleFreeze = async () => {
    if (isCapturing) return;

    if (isFrozen) {
      setFrozenUri(null);
      setIsFrozen(false);
      try {
        cameraRef.current?.resumePreview();
      } catch {
        // Already active
      }
      return;
    }

    if (!cameraRef.current) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      if (photo?.uri) {
        setFrozenUri(photo.uri);
        setIsFrozen(true);
      } else {
        cameraRef.current.pausePreview();
        setIsFrozen(true);
      }
    } catch {
      try {
        cameraRef.current.pausePreview();
        setIsFrozen(true);
      } catch {
        // Ignore if camera busy
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSaveCapture = async () => {
    if (isCapturing) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("lupa_perm_gallery_title", "Permiso de galería"),
          t(
            "lupa_perm_gallery_desc",
            "Autoriza el acceso a tus fotos para guardar la captura ampliada.",
          ),
        );
        return;
      }

      let uriToSave = frozenUri;

      if (!uriToSave && cameraRef.current) {
        setIsCapturing(true);
        if (isFrozen) {
          cameraRef.current.resumePreview();
        }
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: true,
        });
        uriToSave = photo?.uri || null;
        if (isFrozen) {
          cameraRef.current.pausePreview();
        }
      }

      if (uriToSave) {
        await MediaLibrary.saveToLibraryAsync(uriToSave);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
        Alert.alert(
          t("lupa_saved_title", "¡Guardado!"),
          t("lupa_saved_success", "¡Captura guardada en tu Galería!"),
        );
      }
    } catch {
      Alert.alert(
        t("lupa_err_capture_title", "No se pudo guardar la captura"),
        t(
          "lupa_err_capture_desc",
          "Asegúrate de tener buena iluminación y espacio disponible en tu dispositivo.",
        ),
      );
    } finally {
      setIsCapturing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#2DD4BF" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <Text className="text-xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
          {t(
            "lupa_camera_permission",
            "Necesitamos tu permiso para usar la cámara.",
          )}
        </Text>
        <TouchableOpacity
          className="bg-teal-700 dark:bg-teal-600 px-6 py-3.5 rounded-full"
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("lupa_grant_permission", "Conceder Permiso")}
        >
          <Text className="text-white font-bold">
            {t("lupa_grant_permission", "Conceder Permiso")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Accessibility Overlay Tint Filter styles
  const renderFilterOverlay = () => {
    if (currentFilter === "normal") return null;

    if (currentFilter === "invert") {
      return (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          className="bg-white/40"
        />
      );
    }

    if (currentFilter === "yellow") {
      return (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          className="bg-yellow-400/35"
        />
      );
    }

    if (currentFilter === "mono") {
      return (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
          className="bg-black/25"
        />
      );
    }

    return null;
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        zoom={zoom}
        enableTorch={torch}
      />

      {/* Crisp Frozen Frame Overlay */}
      {isFrozen && frozenUri && (
        <Image
          source={{ uri: frozenUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {/* Optical Filter Simulation Overlay */}
      {renderFilterOverlay()}

      {/* Top Bar: Accessibility Filter Chips */}
      <SafeAreaView edges={["top"]} className="absolute top-0 w-full z-10">
        <View className="pt-2 px-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Eye color="#fff" size={16} />
              <Text className="text-white text-xs font-black uppercase tracking-wider bg-black/55 px-2.5 py-1 rounded-full ml-2">
                {t("lupa_filters", "Filtros de Accesibilidad")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Configuración")}
              className="p-2.5 bg-black/60 rounded-full border border-white/20"
            >
              <Settings color="#2DD4BF" size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setCurrentFilter("normal")}
              className={`px-3.5 py-1.5 rounded-full border ${
                currentFilter === "normal"
                  ? "bg-teal-700 border-teal-500"
                  : "bg-black/60 border-white/20"
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {t("lupa_filter_normal", "Natural")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentFilter("yellow")}
              className={`px-3.5 py-1.5 rounded-full border ${
                currentFilter === "yellow"
                  ? "bg-yellow-500 border-yellow-300"
                  : "bg-black/60 border-white/20"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  currentFilter === "yellow" ? "text-black" : "text-white"
                }`}
              >
                {t("lupa_filter_yellow", "Amarillo/Negro")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentFilter("invert")}
              className={`px-3.5 py-1.5 rounded-full border ${
                currentFilter === "invert"
                  ? "bg-white border-zinc-200"
                  : "bg-black/60 border-white/20"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  currentFilter === "invert" ? "text-black" : "text-white"
                }`}
              >
                {t("lupa_filter_invert", "Invertido")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentFilter("mono")}
              className={`px-3.5 py-1.5 rounded-full border ${
                currentFilter === "mono"
                  ? "bg-zinc-700 border-zinc-500"
                  : "bg-black/60 border-white/20"
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {t("lupa_filter_mono", "Escala de Grises")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Controls Overlay */}
      <View className="absolute bottom-0 w-full bg-zinc-950/88 rounded-t-3xl px-6 pt-5 pb-9 border-t border-zinc-800 shadow-2xl">
        {/* One-Hand Quick Zoom Presets */}
        <View className="flex-row justify-between gap-2 mb-3">
          {ZOOM_PRESETS.map((preset) => {
            const isActive = Math.abs(zoom - preset.value) < 0.05;
            return (
              <TouchableOpacity
                key={preset.label}
                onPress={() => setZoom(preset.value)}
                disabled={isFrozen}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${t("lupa_zoom", "Zoom")} ${preset.label}`}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  isActive
                    ? "bg-teal-700 border-teal-500"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Text
                  className={`text-xs font-black font-mono ${
                    isActive ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Zoom Slider */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-white font-black text-sm w-16 uppercase tracking-wider">
            {t("lupa_zoom", "Zoom")}
          </Text>
          <Slider
            style={{ flex: 1, height: 38 }}
            minimumValue={0}
            maximumValue={0.6}
            value={zoom}
            disabled={isFrozen}
            onValueChange={setZoom}
            minimumTrackTintColor="#0F766E"
            maximumTrackTintColor="#52525b"
            thumbTintColor="#2DD4BF"
          />
          <Text className="text-teal-400 font-mono font-bold text-xs w-12 text-right">
            {(1 + zoom * 5).toFixed(1)}x
          </Text>
        </View>

        {/* Buttons Row */}
        <View className="flex-row justify-evenly items-center">
          {/* Torch Button */}
          <TouchableOpacity
            onPress={() => setTorch(!torch)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              torch
                ? t("lupa_torch_off", "Apagar linterna")
                : t("lupa_torch_on", "Encender linterna")
            }
            className={`w-16 h-16 rounded-full items-center justify-center border-2 ${
              torch
                ? "bg-yellow-500/20 border-yellow-400"
                : "bg-zinc-900 border-zinc-800"
            }`}
          >
            {torch ? (
              <Flashlight color="#facc15" size={26} />
            ) : (
              <FlashlightOff color="#a1a1aa" size={26} />
            )}
          </TouchableOpacity>

          {/* Freeze / Resume Button */}
          <TouchableOpacity
            onPress={toggleFreeze}
            disabled={isCapturing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isFrozen
                ? t("lupa_unfreeze", "Descongelar")
                : t("lupa_freeze", "Congelar")
            }
            className={`w-20 h-20 rounded-full items-center justify-center border-4 shadow-xl ${
              isFrozen
                ? "bg-teal-700 border-teal-400"
                : "bg-zinc-900 border-zinc-700"
            }`}
          >
            {isFrozen ? (
              <Play color="#fff" size={32} />
            ) : (
              <CameraIcon color="#fff" size={32} />
            )}
          </TouchableOpacity>

          {/* Save Capture Button */}
          <TouchableOpacity
            onPress={handleSaveCapture}
            disabled={isCapturing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("lupa_save_capture", "Guardar Captura")}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-800 items-center justify-center shadow-md"
          >
            {savedSuccess ? (
              <Check color="#10b981" size={26} />
            ) : (
              <Download color="#2DD4BF" size={26} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <SettingsModal4All
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        appName={t("lupa_title", "Lupa y Linterna 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
      />
    </View>
  );
}

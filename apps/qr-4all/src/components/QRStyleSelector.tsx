import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  Sparkles,
  Palette,
  Image as ImageIcon,
  LayoutTemplate,
  Trash2,
  Check,
  Globe,
  Wifi,
  MessageSquare,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Star,
} from "lucide-react-native";
import { QRStyleConfig } from "../store/useQRStore";

interface Props {
  styleConfig: QRStyleConfig;
  onChange: (config: QRStyleConfig) => void;
}

const SOLID_COLORS = [
  { id: "black", hex: "#09090b" },
  { id: "blue", hex: "#2563eb" },
  { id: "teal", hex: "#0f766e" },
  { id: "amber", hex: "#b45309" },
  { id: "emerald", hex: "#059669" },
  { id: "violet", hex: "#7c3aed" },
  { id: "crimson", hex: "#e11d48" },
  { id: "zinc", hex: "#3f3f46" },
];

const GRADIENTS: { name: string; colors: [string, string] }[] = [
  { name: "Aurora", colors: ["#2563eb", "#0d9488"] },
  { name: "Sunset", colors: ["#7c3aed", "#e11d48"] },
  { name: "Forest", colors: ["#059669", "#10b981"] },
  { name: "Golden", colors: ["#d97706", "#f59e0b"] },
  { name: "Cyber", colors: ["#0284c7", "#a855f7"] },
];

const BG_COLORS = [
  { id: "white", hex: "#ffffff" },
  { id: "amber", hex: "#fef3c7" },
  { id: "blue", hex: "#dbeafe" },
  { id: "mint", hex: "#ccfbf1" },
  { id: "rose", hex: "#fce7f3" },
  { id: "violet", hex: "#ede9fe" },
  { id: "zinc", hex: "#e4e4e7" },
];

const PRESET_ICONS = [
  { id: "url", labelKey: "qr_type_url", fallback: "Enlace", icon: Globe },
  { id: "wifi", labelKey: "qr_type_wifi", fallback: "Wi-Fi", icon: Wifi },
  {
    id: "whatsapp",
    labelKey: "qr_type_whatsapp",
    fallback: "WhatsApp",
    icon: MessageSquare,
  },
  { id: "user", labelKey: "qr_type_vcard", fallback: "Contacto", icon: User },
  { id: "mail", labelKey: "qr_type_email", fallback: "Correo", icon: Mail },
  { id: "phone", labelKey: "qr_type_phone", fallback: "Llamada", icon: Phone },
  { id: "pin", labelKey: "qr_icon_location", fallback: "Ubicación", icon: MapPin },
  { id: "pay", labelKey: "qr_icon_pay", fallback: "Pago", icon: CreditCard },
  { id: "lock", labelKey: "qr_icon_secure", fallback: "Seguro", icon: Lock },
  { id: "star", labelKey: "qr_icon_star", fallback: "Favorito", icon: Star },
];

export default function QRStyleSelector({ styleConfig, onChange }: Props) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";
  const mutedHex = isDark ? "#a1a1aa" : "#71717a";

  const handlePickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        let finalUri = pickedUri;

        // Copy to persistent documentDirectory so saved QRs keep their logo
        try {
          const logosDir = `${FileSystem.documentDirectory}qr_logos/`;
          await FileSystem.makeDirectoryAsync(logosDir, {
            intermediates: true,
          });
          const destUri = `${logosDir}logo_${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: pickedUri, to: destUri });
          finalUri = destUri;
        } catch {
          // Fallback to pickedUri if copy fails
        }

        onChange({
          ...styleConfig,
          logoUri: finalUri,
          presetIcon: null,
        });
      }
    } catch {
      Alert.alert(
        t("qr_err_logo_title", "No se pudo cargar el logotipo"),
        t(
          "qr_err_logo_desc",
          "Intenta seleccionar otra imagen JPG o PNG desde tu galería.",
        ),
      );
    }
  };

  const handleRemoveLogo = () => {
    onChange({
      ...styleConfig,
      logoUri: null,
      presetIcon: null,
    });
  };

  return (
    <View className="gap-5">
      {/* ── 1. COLORES Y GRADIENTES ── */}
      <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Palette size={18} color={accentHex} />
            <Text className="text-sm font-bold text-zinc-900 dark:text-white">
              {t("qr_style_colors", "Colores del Código")}
            </Text>
          </View>

          {/* Solid vs Gradient switch */}
          <View className="flex-row bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <TouchableOpacity
              onPress={() => onChange({ ...styleConfig, isGradient: false })}
              className={`px-3 py-1 rounded-lg ${
                !styleConfig.isGradient
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  !styleConfig.isGradient
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {t("qr_style_solid", "Color Sólido")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange({ ...styleConfig, isGradient: true })}
              className={`px-3 py-1 rounded-lg flex-row items-center gap-1 ${
                styleConfig.isGradient
                  ? "bg-white dark:bg-zinc-700 shadow-sm"
                  : ""
              }`}
            >
              <Sparkles
                size={12}
                color={styleConfig.isGradient ? accentHex : mutedHex}
              />
              <Text
                className={`text-xs font-semibold ${
                  styleConfig.isGradient
                    ? "text-teal-700 dark:text-teal-300"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {t("qr_style_gradient", "Gradiente")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Solid Color Palette */}
        {!styleConfig.isGradient ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-1"
          >
            <View className="flex-row gap-3">
              {SOLID_COLORS.map((col) => {
                const isSelected =
                  styleConfig.fgColor.toLowerCase() === col.hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={col.hex}
                    onPress={() =>
                      onChange({ ...styleConfig, fgColor: col.hex })
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={col.id}
                    className="items-center"
                  >
                    <View
                      style={{ backgroundColor: col.hex }}
                      className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                        isSelected
                          ? "border-teal-600 dark:border-teal-400"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {isSelected && (
                        <Check size={16} color="#ffffff" strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* Gradient Presets */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-1"
          >
            <View className="flex-row gap-3">
              {GRADIENTS.map((grad) => {
                const isSelected =
                  styleConfig.gradientColors[0] === grad.colors[0] &&
                  styleConfig.gradientColors[1] === grad.colors[1];
                return (
                  <TouchableOpacity
                    key={grad.name}
                    onPress={() =>
                      onChange({
                        ...styleConfig,
                        isGradient: true,
                        gradientColors: grad.colors,
                      })
                    }
                    className="items-center"
                  >
                    <View
                      style={{ backgroundColor: grad.colors[0] }}
                      className={`w-12 h-10 rounded-2xl items-center justify-center overflow-hidden border-2 ${
                        isSelected
                          ? "border-teal-600 dark:border-teal-400"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <View
                        style={{
                          backgroundColor: grad.colors[1],
                          width: "50%",
                          height: "100%",
                          alignSelf: "flex-end",
                          opacity: 0.9,
                        }}
                      />
                      {isSelected && (
                        <View className="absolute inset-0 items-center justify-center">
                          <Check size={16} color="#ffffff" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      {grad.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Background Colors */}
        <View className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
            {t("qr_style_bg", "Fondo")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {BG_COLORS.map((bg) => {
                const isSelected =
                  styleConfig.bgColor.toLowerCase() === bg.hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={bg.hex}
                    onPress={() =>
                      onChange({ ...styleConfig, bgColor: bg.hex })
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={bg.id}
                    className="items-center"
                  >
                    <View
                      style={{ backgroundColor: bg.hex }}
                      className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                        isSelected
                          ? "border-teal-600 dark:border-teal-400"
                          : "border-zinc-300 dark:border-zinc-700 shadow-sm"
                      }`}
                    >
                      {isSelected && (
                        <Check size={14} color="#09090b" strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── 2. LOGO / ICONO CENTRAL ── */}
      <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <ImageIcon size={18} color={accentHex} />
            <Text className="text-sm font-bold text-zinc-900 dark:text-white">
              {t("qr_style_logo", "Logotipo / Icono Central")}
            </Text>
          </View>

          {(styleConfig.logoUri || styleConfig.presetIcon) && (
            <TouchableOpacity
              onPress={handleRemoveLogo}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40"
            >
              <Trash2 size={12} color="#DC2626" />
              <Text className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                {t("qr_logo_remove", "Quitar Icono")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gallery Upload + Active Preview */}
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            onPress={handlePickLogo}
            className="flex-1 py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-700 flex-row items-center justify-center gap-2"
          >
            <ImageIcon size={18} color={mutedHex} />
            <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t("qr_logo_upload", "Subir Imagen")}
            </Text>
          </TouchableOpacity>

          {styleConfig.logoUri && (
            <View className="w-12 h-12 rounded-xl overflow-hidden border-2 border-teal-600 dark:border-teal-400 shadow-sm">
              <Image
                source={{ uri: styleConfig.logoUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        {/* Quick Presets */}
        <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
          {t("qr_logo_presets", "Iconos Rápidos")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {PRESET_ICONS.map((p) => {
              const isSelected =
                styleConfig.presetIcon === p.id && !styleConfig.logoUri;
              const IconComp = p.icon;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() =>
                    onChange({
                      ...styleConfig,
                      presetIcon: isSelected ? null : p.id,
                      logoUri: null,
                    })
                  }
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-950/50 border-teal-600 dark:border-teal-400"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <IconComp size={14} color={isSelected ? accentHex : mutedHex} />
                  <Text
                    className={`text-xs font-medium ${
                      isSelected
                        ? "text-teal-800 dark:text-teal-300 font-bold"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {t(p.labelKey, p.fallback)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── 3. MARCO / PLANTILLA (FRAMES) ── */}
      <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center gap-2 mb-4">
          <LayoutTemplate size={18} color={accentHex} />
          <Text className="text-sm font-bold text-zinc-900 dark:text-white">
            {t("qr_style_frame", "Marco / Plantilla")}
          </Text>
        </View>

        {/* Frame Template Selector Grid */}
        <View className="flex-row gap-2 mb-4">
          {(
            [
              { id: "none", label: t("qr_frame_none", "Solo QR") },
              {
                id: "scanme-top",
                label: t("qr_frame_scanme_top", "Escanéame (Arriba)"),
              },
              {
                id: "scanme-bottom",
                label: t("qr_frame_scanme_bottom", "Escanéame (Abajo)"),
              },
              { id: "card", label: t("qr_frame_card", "Tarjeta Elegante") },
            ] as const
          ).map((f) => {
            const isSelected = styleConfig.frameType === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => onChange({ ...styleConfig, frameType: f.id })}
                className={`flex-1 py-2.5 px-2 rounded-2xl border items-center justify-center ${
                  isSelected
                    ? "bg-teal-50 dark:bg-teal-950/50 border-teal-600 dark:border-teal-400"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold text-center ${
                    isSelected
                      ? "text-teal-800 dark:text-teal-300 font-bold"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Frame Text Customization (when frame is active) */}
        {styleConfig.frameType !== "none" && (
          <View className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              {t("qr_frame_text_label", "Texto del Marco")}
            </Text>
            <TextInput
              value={styleConfig.frameText}
              onChangeText={(text) =>
                onChange({ ...styleConfig, frameText: text })
              }
              placeholder={t("qr_frame_default_text", "¡Escanéame!")}
              placeholderTextColor="#a1a1aa"
              maxLength={24}
              className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl text-zinc-900 dark:text-white font-medium text-sm border border-zinc-200 dark:border-zinc-700"
            />
          </View>
        )}
      </View>
    </View>
  );
}

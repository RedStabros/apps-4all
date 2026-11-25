import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Globe,
  Wifi,
  MessageSquare,
  User,
  FileText,
  Mail,
  Phone,
  MessageCircle,
  Coins,
  CreditCard,
  Download,
  Share2,
  BookmarkPlus,
  Check,
  Palette,
} from "lucide-react-native";
import { useQRStore, QRStyleConfig, QRRecord } from "../store/useQRStore";
import FramedQRCode, { FramedQRCodeRef } from "../components/FramedQRCode";
import QRStyleSelector from "../components/QRStyleSelector";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

type QRType =
  | "url"
  | "wifi"
  | "whatsapp"
  | "vcard"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "bitcoin"
  | "paypal";

interface TypeConfig {
  type: QRType;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const QR_TYPES: TypeConfig[] = [
  { type: "url", labelKey: "qr_type_url", defaultLabel: "Enlace", icon: Globe },
  { type: "wifi", labelKey: "qr_type_wifi", defaultLabel: "Wi-Fi", icon: Wifi },
  {
    type: "whatsapp",
    labelKey: "qr_type_whatsapp",
    defaultLabel: "WhatsApp",
    icon: MessageSquare,
  },
  {
    type: "vcard",
    labelKey: "qr_type_vcard",
    defaultLabel: "Contacto",
    icon: User,
  },
  {
    type: "text",
    labelKey: "qr_type_text",
    defaultLabel: "Texto",
    icon: FileText,
  },
  {
    type: "email",
    labelKey: "qr_type_email",
    defaultLabel: "Correo",
    icon: Mail,
  },
  {
    type: "phone",
    labelKey: "qr_type_phone",
    defaultLabel: "Llamada",
    icon: Phone,
  },
  {
    type: "sms",
    labelKey: "qr_type_sms",
    defaultLabel: "SMS",
    icon: MessageCircle,
  },
  {
    type: "bitcoin",
    labelKey: "qr_type_bitcoin",
    defaultLabel: "Bitcoin",
    icon: Coins,
  },
  {
    type: "paypal",
    labelKey: "qr_type_paypal",
    defaultLabel: "PayPal",
    icon: CreditCard,
  },
];

export default function GeneratorScreen({
  navigation,
  route,
}: {
  navigation: { goBack: () => void; navigate: (screen: string, params?: any) => void };
  route?: { params?: { editRecord?: QRRecord } };
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#2DD4BF" : "#0F766E";

  const { saveCreatedQR, updateCreatedQR } = useQRStore();
  const editRecord = route?.params?.editRecord;
  const [editingId, setEditingId] = useState<string | null>(editRecord?.id || null);
  const [selectedType, setSelectedType] = useState<QRType>("url");

  // Form states
  const [url, setUrl] = useState("https://");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiSec, setWifiSec] = useState<"WPA" | "WEP" | "nopass">("WPA");

  const [waPhone, setWaPhone] = useState("");
  const [waMsg, setWaMsg] = useState("");

  const [vcardName, setVcardName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");

  const [plainText, setPlainText] = useState("");

  const [emailTo, setEmailTo] = useState("");
  const [emailSub, setEmailSub] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [phoneNum, setPhoneNum] = useState("");

  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");

  const [btcAddr, setBtcAddr] = useState("");
  const [btcAmount, setBtcAmount] = useState("");

  const [ppUser, setPpUser] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "design">("content");
  const [styleConfig, setStyleConfig] = useState<QRStyleConfig>({
    fgColor: "#09090b",
    bgColor: "#ffffff",
    isGradient: false,
    gradientColors: ["#2563eb", "#0d9488"],
    logoUri: null,
    presetIcon: null,
    frameType: "none",
    frameText: t("qr_frame_default_text", "¡Escanéame!"),
    frameColor: "#0f766e",
  });
  const qrSvgRef = useRef<FramedQRCodeRef>(null);

  // Hydrate form when editing an existing saved QR from History
  useEffect(() => {
    if (!editRecord) return;
    setEditingId(editRecord.id);
    if (editRecord.style) {
      setStyleConfig(editRecord.style);
    }
    const raw = editRecord.data || "";
    const recType = editRecord.type as QRType;
    if (recType === "wifi" && raw.startsWith("WIFI:")) {
      setSelectedType("wifi");
      const s = raw.match(/S:([^;]*)/)?.[1] || "";
      const p = raw.match(/P:([^;]*)/)?.[1] || "";
      const sec = (raw.match(/T:([^;]*)/)?.[1] || "WPA") as "WPA" | "WEP" | "nopass";
      setWifiSsid(s);
      setWifiPass(p);
      setWifiSec(sec);
    } else if (recType === "url" || raw.startsWith("http://") || raw.startsWith("https://")) {
      if (recType === "whatsapp" && raw.includes("wa.me/")) {
        setSelectedType("whatsapp");
        const phoneMatch = raw.match(/wa\.me\/(\d+)/)?.[1] || "";
        const msgMatch = raw.match(/text=([^&]*)/)?.[1] || "";
        setWaPhone(phoneMatch);
        setWaMsg(decodeURIComponent(msgMatch));
      } else if (recType === "paypal" && raw.includes("paypal.me/")) {
        setSelectedType("paypal");
        setPpUser(raw.replace(/^https?:\/\/(www\.)?paypal\.me\//, ""));
      } else {
        setSelectedType("url");
        setUrl(raw);
      }
    } else if (recType === "email" && raw.startsWith("mailto:")) {
      setSelectedType("email");
      const [toPart, query = ""] = raw.replace(/^mailto:/, "").split("?");
      setEmailTo(toPart || "");
      setEmailSub(decodeURIComponent(query.match(/subject=([^&]*)/)?.[1] || ""));
      setEmailBody(decodeURIComponent(query.match(/body=([^&]*)/)?.[1] || ""));
    } else if (recType === "phone" && raw.startsWith("tel:")) {
      setSelectedType("phone");
      setPhoneNum(raw.replace(/^tel:/, ""));
    } else if (recType === "sms" && raw.startsWith("smsto:")) {
      setSelectedType("sms");
      const parts = raw.replace(/^smsto:/, "").split(":");
      setSmsPhone(parts[0] || "");
      setSmsMsg(parts.slice(1).join(":"));
    } else if (recType === "bitcoin" && raw.startsWith("bitcoin:")) {
      setSelectedType("bitcoin");
      const [addr, q = ""] = raw.replace(/^bitcoin:/, "").split("?");
      setBtcAddr(addr || "");
      setBtcAmount(q.match(/amount=([^&]*)/)?.[1] || "");
    } else if (recType === "vcard" && raw.includes("BEGIN:VCARD")) {
      setSelectedType("vcard");
      setVcardName(raw.match(/FN:([^\n]*)/)?.[1] || "");
      setVcardPhone(raw.match(/TEL:([^\n]*)/)?.[1] || "");
      setVcardEmail(raw.match(/EMAIL:([^\n]*)/)?.[1] || "");
      setVcardOrg(raw.match(/ORG:([^\n]*)/)?.[1] || "");
    } else {
      setSelectedType("text");
      setPlainText(raw);
    }
  }, [editRecord]);

  // Compute standard static payload
  const qrData = useMemo(() => {
    switch (selectedType) {
      case "url":
        return url.trim() || "https://";
      case "wifi":
        return wifiSsid.trim()
          ? `WIFI:S:${wifiSsid};T:${wifiSec};P:${wifiPass};;`
          : "";
      case "whatsapp": {
        const cleanPhone = waPhone.replace(/\D/g, "");
        return cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`
          : "";
      }
      case "vcard":
        return vcardName.trim() || vcardPhone.trim() || vcardEmail.trim()
          ? `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nORG:${vcardOrg}\nEND:VCARD`
          : "";
      case "text":
        return plainText;
      case "email":
        return emailTo
          ? `mailto:${emailTo}?subject=${encodeURIComponent(emailSub)}&body=${encodeURIComponent(emailBody)}`
          : "";
      case "phone":
        return phoneNum ? `tel:${phoneNum}` : "";
      case "sms":
        return smsPhone ? `smsto:${smsPhone}:${smsMsg}` : "";
      case "bitcoin":
        return btcAddr
          ? `bitcoin:${btcAddr}${btcAmount ? "?amount=" + btcAmount : ""}`
          : "";
      case "paypal": {
        const cleanUser = ppUser.replace(
          /^(https?:\/\/)?(www\.)?paypal\.me\//,
          "",
        );
        return cleanUser ? `https://paypal.me/${cleanUser}` : "";
      }
      default:
        return "";
    }
  }, [
    selectedType,
    url,
    wifiSsid,
    wifiPass,
    wifiSec,
    waPhone,
    waMsg,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    plainText,
    emailTo,
    emailSub,
    emailBody,
    phoneNum,
    smsPhone,
    smsMsg,
    btcAddr,
    btcAmount,
    ppUser,
  ]);

  const isValid = qrData.length > 0 && qrData !== "https://";

  const exportQrPng = (): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!qrSvgRef.current) {
        reject(new Error("QR ref not ready"));
        return;
      }
      qrSvgRef.current.toDataURL(async (rawBase64: string) => {
        try {
          const cleanBase64 = (rawBase64 || "")
            .replace(/^data:image\/\w+;base64,/, "")
            .replace(/\s+/g, "");
          if (!cleanBase64 || cleanBase64.length < 32) {
            reject(new Error("Empty PNG data"));
            return;
          }
          const path = `${FileSystem.cacheDirectory}qr4all_${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(path, cleanBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          resolve(path);
        } catch (err) {
          reject(err);
        }
      });
    });

  // Save PNG Image to Device Gallery (write-only permission for Android 13+)
  const handleSaveToGallery = async () => {
    if (!qrSvgRef.current || !isValid) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== "granted") {
        Alert.alert(
          t("qr_perm_gallery_title", "Permiso de galería"),
          t(
            "qr_perm_gallery_desc",
            "Autoriza el acceso a tus fotos para guardar el código QR como imagen.",
          ),
        );
        return;
      }

      const path = await exportQrPng();
      await MediaLibrary.saveToLibraryAsync(path);
      Alert.alert(
        t("zip_success", "¡Éxito!"),
        t("qr_saved_gallery_success", "¡Código QR guardado en tu Galería!"),
      );
    } catch {
      Alert.alert(
        t("qr_err_save_title", "No se pudo guardar"),
        t(
          "qr_err_save_desc",
          "Verifica el espacio disponible y los permisos de fotos en tu dispositivo.",
        ),
      );
    }
  };

  // Share PNG Image (never falls back to sharing raw text)
  const handleShareImage = async () => {
    if (!qrSvgRef.current || !isValid) return;

    try {
      const path = await exportQrPng();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle: t("qr_share", "Compartir código QR"),
        });
      } else {
        Alert.alert(
          t("qr_err_save_title", "No se pudo compartir"),
          t("qr_err_save_desc", "Tu dispositivo no soporta compartir archivos."),
        );
      }
    } catch {
      Alert.alert(
        t("qr_err_save_title", "No se pudo generar la imagen QR"),
        t(
          "qr_err_save_desc",
          "Intenta nuevamente en un segundo para compartir el PNG.",
        ),
      );
    }
  };

  // Save or Update in Local Library
  const handleSaveToLibrary = () => {
    if (!isValid) return;

    let title = "";
    if (selectedType === "wifi") title = `Wi-Fi: ${wifiSsid || "SSID"}`;
    else if (selectedType === "whatsapp") title = `WhatsApp: ${waPhone}`;
    else if (selectedType === "vcard") title = vcardName || "vCard";
    else if (selectedType === "url") title = url;
    else title = `${selectedType.toUpperCase()}`;

    if (editingId) {
      updateCreatedQR(editingId, {
        type: selectedType,
        title,
        data: qrData,
        style: styleConfig,
      });
    } else {
      saveCreatedQR({
        type: selectedType,
        title,
        data: qrData,
        style: styleConfig,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
        <View className="py-3.5 px-5 flex-row items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-row items-center flex-1 mr-2">
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
              className="text-xl font-black text-zinc-900 dark:text-white"
              numberOfLines={1}
            >
              {t("qr_generate", "Generar")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("History")}
            className="bg-teal-500/10 dark:bg-teal-400/10 px-3.5 py-2 rounded-xl border border-teal-500/20"
          >
            <Text className="text-teal-800 dark:text-teal-400 font-bold text-xs">
              {t("qr_my_qrs", "Mis Códigos QR")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher: Contenido vs Personalizar Diseño */}
        <View className="flex-row px-4 pt-3 pb-2 gap-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => setActiveTab("content")}
            className={`flex-1 py-2.5 rounded-2xl items-center justify-center flex-row gap-2 border ${
              activeTab === "content"
                ? "bg-teal-700 dark:bg-teal-600 border-teal-700 dark:border-teal-600 shadow-sm"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <FileText
              size={16}
              color={activeTab === "content" ? "#ffffff" : "#71717a"}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === "content"
                  ? "text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t("qr_tab_content", "Contenido")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("design")}
            className={`flex-1 py-2.5 rounded-2xl items-center justify-center flex-row gap-2 border ${
              activeTab === "design"
                ? "bg-teal-700 dark:bg-teal-600 border-teal-700 dark:border-teal-600 shadow-sm"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Palette
              size={16}
              color={activeTab === "design" ? "#ffffff" : "#71717a"}
            />
            <Text
              className={`text-xs font-bold ${
                activeTab === "design"
                  ? "text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t("qr_tab_design", "Diseño")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {activeTab === "content" ? (
            <>
              {/* Template Type Selector Grid */}
              <View className="p-4">
                <Text className="text-xs uppercase font-bold text-zinc-400 mb-3 px-2 tracking-wider">
                  {t("qr_select_type", "Tipo de Código QR")}
                </Text>
                <View className="flex-row flex-wrap gap-2 justify-between">
                  {QR_TYPES.map((cfg) => {
                    const IconComp = cfg.icon;
                    const isSelected = selectedType === cfg.type;
                    return (
                      <TouchableOpacity
                        key={cfg.type}
                        onPress={() => setSelectedType(cfg.type)}
                        className={`w-[48%] p-3.5 rounded-2xl border flex-row items-center shadow-sm mb-1 ${
                          isSelected
                            ? "bg-teal-700 dark:bg-teal-600 border-teal-700"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <View
                          className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${
                            isSelected
                              ? "bg-white/20"
                              : "bg-teal-500/10 dark:bg-teal-400/10"
                          }`}
                        >
                          <IconComp
                            size={18}
                            color={isSelected ? "#fff" : accentHex}
                          />
                        </View>
                        <Text
                          className={`font-bold text-xs flex-1 ${
                            isSelected
                              ? "text-white"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                          numberOfLines={1}
                        >
                          {t(cfg.labelKey, cfg.defaultLabel)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Dynamic Form for Selected Template */}
              <View className="px-5 mb-6">
                <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  {/* 1. URL */}
                  {selectedType === "url" && (
                    <View>
                      <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                        {t("qr_field_url", "Enlace / Sitio Web")}
                      </Text>
                      <TextInput
                        value={url}
                        onChangeText={(text) => setUrl(text.replace(/\s+/g, ""))}
                        placeholder="https://ejemplo.com"
                        placeholderTextColor="#a1a1aa"
                        className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        keyboardType="url"
                        textContentType="URL"
                      />
                    </View>
                  )}

                  {/* 2. WI-FI */}
                  {selectedType === "wifi" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_wifi_ssid", "Nombre de la Red (SSID)")}
                        </Text>
                        <TextInput
                          value={wifiSsid}
                          onChangeText={setWifiSsid}
                          placeholder="Wi-Fi"
                          placeholderTextColor="#a1a1aa"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_wifi_password", "Contraseña")}
                        </Text>
                        <TextInput
                          value={wifiPass}
                          onChangeText={setWifiPass}
                          placeholder="••••••••"
                          placeholderTextColor="#a1a1aa"
                          secureTextEntry
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View className="flex-row gap-2 mt-1">
                        {(["WPA", "WEP", "nopass"] as const).map((sec) => (
                          <TouchableOpacity
                            key={sec}
                            onPress={() => setWifiSec(sec)}
                            className={`flex-1 py-2.5 items-center rounded-xl border ${
                              wifiSec === sec
                                ? "bg-teal-700 border-teal-700"
                                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                wifiSec === sec
                                  ? "text-white"
                                  : "text-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              {sec === "nopass"
                                ? t("qr_wifi_open", "Abierta")
                                : sec}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 3. WHATSAPP */}
                  {selectedType === "whatsapp" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_whatsapp_phone", "Número (ej. 573001234567)")}
                        </Text>
                        <TextInput
                          value={waPhone}
                          onChangeText={setWaPhone}
                          placeholder="573001234567"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="phone-pad"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium font-mono"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_whatsapp_msg", "Mensaje predeterminado")}
                        </Text>
                        <TextInput
                          value={waMsg}
                          onChangeText={setWaMsg}
                          placeholder={t("qr_generate_ph", "Ingresa texto o link...")}
                          placeholderTextColor="#a1a1aa"
                          multiline
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                    </View>
                  )}

                  {/* 4. VCARD */}
                  {selectedType === "vcard" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_name", "Nombre Completo")}
                        </Text>
                        <TextInput
                          value={vcardName}
                          onChangeText={setVcardName}
                          placeholder={t("qr_vcard_name", "Nombre Completo")}
                          placeholderTextColor="#a1a1aa"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_phone", "Teléfono")}
                        </Text>
                        <TextInput
                          value={vcardPhone}
                          onChangeText={setVcardPhone}
                          placeholder="+57 300 0000000"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="phone-pad"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_email", "Correo Electrónico")}
                        </Text>
                        <TextInput
                          value={vcardEmail}
                          onChangeText={setVcardEmail}
                          placeholder="name@example.com"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_org", "Empresa / Organización")}
                        </Text>
                        <TextInput
                          value={vcardOrg}
                          onChangeText={setVcardOrg}
                          placeholder={t("qr_vcard_org", "Empresa / Organización")}
                          placeholderTextColor="#a1a1aa"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                    </View>
                  )}

                  {/* 5. TEXT */}
                  {selectedType === "text" && (
                    <View>
                      <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                        {t("qr_type_text", "Texto")}
                      </Text>
                      <TextInput
                        value={plainText}
                        onChangeText={setPlainText}
                        placeholder={t("qr_generate_ph", "Ingresa texto o link...")}
                        placeholderTextColor="#a1a1aa"
                        multiline
                        numberOfLines={4}
                        className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                      />
                    </View>
                  )}

                  {/* 6. EMAIL */}
                  {selectedType === "email" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_email", "Correo Electrónico")}
                        </Text>
                        <TextInput
                          value={emailTo}
                          onChangeText={setEmailTo}
                          placeholder="name@example.com"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_email_subject", "Asunto")}
                        </Text>
                        <TextInput
                          value={emailSub}
                          onChangeText={setEmailSub}
                          placeholder={t("qr_email_subject", "Asunto")}
                          placeholderTextColor="#a1a1aa"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_email_body", "Mensaje")}
                        </Text>
                        <TextInput
                          value={emailBody}
                          onChangeText={setEmailBody}
                          placeholder={t("qr_email_body", "Mensaje")}
                          placeholderTextColor="#a1a1aa"
                          multiline
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                    </View>
                  )}

                  {/* 7. PHONE */}
                  {selectedType === "phone" && (
                    <View>
                      <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                        {t("qr_vcard_phone", "Teléfono")}
                      </Text>
                      <TextInput
                        value={phoneNum}
                        onChangeText={setPhoneNum}
                        placeholder="+57 300 1234567"
                        placeholderTextColor="#a1a1aa"
                        keyboardType="phone-pad"
                        className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium font-mono"
                      />
                    </View>
                  )}

                  {/* 8. SMS */}
                  {selectedType === "sms" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_vcard_phone", "Teléfono")}
                        </Text>
                        <TextInput
                          value={smsPhone}
                          onChangeText={setSmsPhone}
                          placeholder="+57 300 1234567"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="phone-pad"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium font-mono"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_email_body", "Mensaje")}
                        </Text>
                        <TextInput
                          value={smsMsg}
                          onChangeText={setSmsMsg}
                          placeholder={t("qr_email_body", "Mensaje")}
                          placeholderTextColor="#a1a1aa"
                          multiline
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                        />
                      </View>
                    </View>
                  )}

                  {/* 9. BITCOIN */}
                  {selectedType === "bitcoin" && (
                    <View className="gap-3">
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_crypto_address", "Dirección de Billetera")}
                        </Text>
                        <TextInput
                          value={btcAddr}
                          onChangeText={setBtcAddr}
                          placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                          placeholderTextColor="#a1a1aa"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium font-mono text-xs"
                          autoCapitalize="none"
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                          {t("qr_crypto_amount", "Monto (Opcional)")}
                        </Text>
                        <TextInput
                          value={btcAmount}
                          onChangeText={setBtcAmount}
                          placeholder="0.005"
                          placeholderTextColor="#a1a1aa"
                          keyboardType="numeric"
                          className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium font-mono"
                        />
                      </View>
                    </View>
                  )}

                  {/* 10. PAYPAL */}
                  {selectedType === "paypal" && (
                    <View>
                      <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                        {t("qr_paypal_user", "Usuario de PayPal (ej. paypal.me/usuario)")}
                      </Text>
                      <TextInput
                        value={ppUser}
                        onChangeText={setPpUser}
                        placeholder="username"
                        placeholderTextColor="#a1a1aa"
                        autoCapitalize="none"
                        className="bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium"
                      />
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View className="p-4">
              <QRStyleSelector
                styleConfig={styleConfig}
                onChange={setStyleConfig}
              />
            </View>
          )}

          {/* Visual QR Code Display Hero */}
          <View className="items-center px-6 mb-6 mt-2">
            <View
              className="p-6 rounded-3xl shadow-md border border-zinc-200 dark:border-zinc-800 items-center justify-center"
              style={{ backgroundColor: isValid ? (styleConfig.bgColor || "#ffffff") : (isDark ? "#18181b" : "#ffffff") }}
            >
              {isValid ? (
                <FramedQRCode
                  ref={qrSvgRef}
                  value={qrData}
                  size={210}
                  styleConfig={styleConfig}
                />
              ) : (
                <View className="w-52 h-52 items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl">
                  <Text className="text-zinc-400 text-xs text-center px-4 font-medium">
                    {t(
                      "qr_fill_fields_hint",
                      "Completa los campos arriba para generar tu código QR",
                    )}
                  </Text>
                </View>
              )}
            </View>

            {isValid && (
              <Text
                className="text-zinc-400 text-xs mt-3 text-center px-6 font-mono"
                numberOfLines={2}
              >
                {qrData}
              </Text>
            )}
          </View>

          {/* Action Buttons: Save, Gallery, Share */}
          {isValid && (
            <View className="px-6 mb-12 gap-3">
              {/* Save to Local Library Button */}
              <TouchableOpacity
                onPress={handleSaveToLibrary}
                className="w-full py-4 rounded-2xl bg-teal-700 dark:bg-teal-600 flex-row items-center justify-center shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <Check color="#fff" size={20} />
                    <Text className="text-white font-bold text-base ml-2">
                      {t("qr_saved_ok", "¡Guardado en Mis QR!")}
                    </Text>
                  </>
                ) : (
                  <>
                    <BookmarkPlus color="#fff" size={20} />
                    <Text className="text-white font-bold text-base ml-2">
                      {t("qr_saved_library", "Guardar en Mis QR")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View className="flex-row gap-3">
                {/* Save to Gallery Button */}
                <TouchableOpacity
                  onPress={handleSaveToGallery}
                  className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-row items-center justify-center shadow-sm"
                >
                  <Download color={accentHex} size={18} />
                  <Text className="text-zinc-800 dark:text-zinc-200 font-bold text-xs ml-2">
                    {t("qr_save_gallery", "Guardar en Galería")}
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  onPress={handleShareImage}
                  className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-row items-center justify-center shadow-sm"
                >
                  <Share2 color={accentHex} size={18} />
                  <Text className="text-zinc-800 dark:text-zinc-200 font-bold text-xs ml-2">
                    {t("qr_share", "Compartir")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { useSecurityStore, fetchSecureVault } from "../store/useSecurityStore";
import { generateMemorablePassphrase } from "../utils/vaultCrypto";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import Slider from "@react-native-community/slider";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  Shield,
  Copy,
  Check,
  RefreshCw,
  X,
  Settings,
  Lock,
} from "lucide-react-native";

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";
  const {
    generatorOptions,
    setGeneratorOptions,
    addVaultItem,
    isVaultUnlocked,
    unlockVault,
  } = useSecurityStore();

  const [genMode, setGenMode] = useState<"password" | "passphrase">("password");
  const [wordCount, setWordCount] = useState(4);
  const [currentPassword, setCurrentPassword] = useState("k9#mP8$vL2!xQ4@z");
  const [copied, setCopied] = useState(false);

  // Save to Vault Modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [vaultUsername, setVaultUsername] = useState("");
  const [vaultNotes, setVaultNotes] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number>(0);

  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, []);

  // Calculate Entropy & Crack Time
  const { entropy, crackTime, strengthColor, strengthLabel } = useMemo(() => {
    let bits = 0;
    if (genMode === "passphrase") {
      // 128 words = 7 bits/word + 3-digit number (~10 bits)
      bits = wordCount * 7 + 10;
    } else {
      const { length, uppercase, lowercase, numbers, symbols, customSymbols } =
        generatorOptions;
      let pool = 0;
      if (uppercase) pool += 26;
      if (lowercase) pool += 26;
      if (numbers) pool += 10;
      if (symbols) pool += customSymbols.length || 10;
      if (pool === 0) pool = 1;
      bits = Math.round(length * Math.log2(pool));
    }

    let timeStr = "Segundos";
    let color = "#ef4444";
    let label = "Vulnerable";

    if (bits < 40) {
      timeStr = "Pocos segundos";
      color = "#ef4444";
      label = "Débil";
    } else if (bits < 60) {
      timeStr = "Horas a meses";
      color = "#f97316";
      label = "Moderada";
    } else if (bits < 80) {
      timeStr = "Siglos";
      color = "#eab308";
      label = "Fuerte";
    } else {
      timeStr = "Millones de años";
      color = "#10b981";
      label = "Inquebrantable";
    }

    return {
      entropy: bits,
      crackTime: timeStr,
      strengthColor: color,
      strengthLabel: label,
    };
  }, [generatorOptions, genMode, wordCount]);

  const generatePassword = () => {
    if (genMode === "passphrase") {
      setCurrentPassword(generateMemorablePassphrase(wordCount, true, "-"));
      setCopied(false);
      return;
    }

    let charset = "";
    const {
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      customSymbols,
      excludeAmbiguous,
    } = generatorOptions;

    let uc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lc = "abcdefghijklmnopqrstuvwxyz";
    let num = "0123456789";
    let sym = customSymbols;

    if (excludeAmbiguous) {
      uc = uc.replace(/[OIl]/g, "");
      lc = lc.replace(/[lo]/g, "");
      num = num.replace(/[01]/g, "");
    }

    if (uppercase) charset += uc;
    if (lowercase) charset += lc;
    if (numbers) charset += num;
    if (symbols) charset += sym;

    if (charset === "") {
      setCurrentPassword(
        t(
          "seguridad_select_options_error",
          "Activa al menos un tipo de carácter (letras, números o símbolos).",
        ),
      );
      return;
    }

    let result = "";
    const randomBytes = Crypto.getRandomBytes(length * 4);
    const view = new DataView(
      randomBytes.buffer,
      randomBytes.byteOffset,
      randomBytes.byteLength,
    );
    for (let i = 0; i < length; i++) {
      const randUint32 = view.getUint32(i * 4, false);
      const randomIndex = randUint32 % charset.length;
      result += charset[randomIndex];
    }
    setCurrentPassword(result);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!currentPassword) return;
    const copiedVal = currentPassword;
    await Clipboard.setStringAsync(copiedVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Auto-clear clipboard after 30s if it still holds this password
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    clipboardTimerRef.current = setTimeout(async () => {
      try {
        const current = await Clipboard.getStringAsync();
        if (current === copiedVal) {
          await Clipboard.setStringAsync("");
        }
      } catch {
        // Ignore clipboard read failure
      }
    }, 30000);
  };

  const handleSaveToVault = async () => {
    if (!currentPassword || !vaultName.trim()) return;

    if (!isVaultUnlocked) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: t(
            "seguridad_auth_reason",
            "Autentícate para acceder a tu bóveda",
          ),
        });
        if (!auth.success) return;
      }

      const data = await fetchSecureVault();
      unlockVault(data);
    }

    const now = Date.now();
    const expiryTimestamp =
      expiryDays > 0 ? now + expiryDays * 24 * 60 * 60 * 1000 : undefined;

    await addVaultItem({
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      name: vaultName.trim(),
      username: vaultUsername.trim() || undefined,
      notes: vaultNotes.trim() || undefined,
      passwordEncrypted: currentPassword,
      timestamp: now,
      expiryDays: expiryDays > 0 ? expiryDays : undefined,
      expiryTimestamp,
    });

    setShowSaveModal(false);
    setVaultName("");
    setVaultUsername("");
    setVaultNotes("");
    setExpiryDays(0);
    Alert.alert(
      t("seguridad_saved_title", "Guardado"),
      t(
        "seguridad_saved_desc",
        "Tus credenciales fueron cifradas y guardadas localmente.",
      ),
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <View className="pt-3 pb-4 px-6 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-row items-center">
            <Shield color={accentHex} size={24} className="mr-2" />
            <Text className="text-2xl font-black text-zinc-900 dark:text-white">
              {t("seguridad_title", "Seguridad 4All")}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Ajustes")}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <Settings color={accentHex} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Vault")}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("seguridad_vault", "Bóveda")}
              className="bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 rounded-xl border border-blue-500/20"
            >
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                {t("seguridad_vault", "Bóveda")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-5">
          {/* Mode Switcher: Password vs Passphrase */}
          <View className="flex-row bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-4">
            <TouchableOpacity
              onPress={() => {
                setGenMode("password");
              }}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                genMode === "password" ? "bg-blue-600" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  genMode === "password" ? "text-white" : "text-zinc-500"
                }`}
              >
                {t("seguridad_mode_password", "Contraseña")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setGenMode("passphrase");
                setCurrentPassword(generateMemorablePassphrase(wordCount, true, "-"));
              }}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                genMode === "passphrase" ? "bg-blue-600" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  genMode === "passphrase" ? "text-white" : "text-zinc-500"
                }`}
              >
                {t("seguridad_mode_passphrase", "Frase de Paso")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Output Box */}
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4">
            <Text
              className="text-2xl font-mono text-zinc-900 dark:text-white font-black text-center mb-4 tracking-wider"
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {currentPassword}
            </Text>

            {/* Entropy & Strength Meter */}
            <View className="mb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-xs uppercase font-bold text-zinc-400">
                  {t("seguridad_strength", "Fuerza")}:{" "}
                  <Text style={{ color: strengthColor }}>{strengthLabel}</Text>
                </Text>
                <Text className="text-xs font-mono font-bold text-zinc-500">
                  {entropy} bits
                </Text>
              </View>

              <View className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <View
                  style={{
                    width: `${Math.min(100, (entropy / 100) * 100)}%`,
                    backgroundColor: strengthColor,
                  }}
                  className="h-full rounded-full"
                />
              </View>

              <Text className="text-[11px] text-zinc-400 text-center font-medium">
                {t("seguridad_crack_time", "Tiempo estimado para descifrar: ")}{" "}
                <Text className="font-bold text-zinc-700 dark:text-zinc-300">
                  {crackTime}
                </Text>
              </Text>
            </View>

            {/* Buttons: Generate, Copy, Save */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={generatePassword}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("seguridad_generate", "Generar")}
                className="flex-1 py-3 bg-blue-600 rounded-xl items-center justify-center flex-row shadow-sm"
              >
                <RefreshCw color="#fff" size={16} className="mr-1.5" />
                <Text className="text-white font-bold text-xs">
                  {t("seguridad_generate", "Generar")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={copyToClipboard}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("copy", "Copiar")}
                className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl items-center justify-center flex-row border border-zinc-200 dark:border-zinc-700"
              >
                {copied ? (
                  <Check color="#10b981" size={16} />
                ) : (
                  <Copy color={accentHex} size={16} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowSaveModal(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("seguridad_save_vault", "Guardar en Bóveda")}
                className="px-4 py-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl items-center justify-center flex-row border border-blue-500/20"
              >
                <Lock color={accentHex} size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Options Settings */}
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-12">
            {genMode === "passphrase" ? (
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                    {t("seguridad_words_count", "Palabras")}
                  </Text>
                  <Text className="text-blue-600 dark:text-blue-400 font-mono font-black text-sm">
                    {wordCount}
                  </Text>
                </View>
                <Slider
                  style={{ width: "100%", height: 36 }}
                  minimumValue={3}
                  maximumValue={8}
                  step={1}
                  value={wordCount}
                  onValueChange={(val) => {
                    setWordCount(val);
                    setCurrentPassword(generateMemorablePassphrase(val, true, "-"));
                  }}
                  minimumTrackTintColor="#2563EB"
                  maximumTrackTintColor="#52525b"
                  thumbTintColor="#60A5FA"
                />
              </View>
            ) : (
              <>
                <View className="mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                      {t("seguridad_length", "Longitud")}
                    </Text>
                    <Text className="text-blue-600 dark:text-blue-400 font-mono font-black text-sm">
                      {generatorOptions.length}
                    </Text>
                  </View>
                  <Slider
                    style={{ width: "100%", height: 36 }}
                    minimumValue={8}
                    maximumValue={64}
                    step={1}
                    value={generatorOptions.length}
                    onValueChange={(val) => setGeneratorOptions({ length: val })}
                    minimumTrackTintColor="#2563EB"
                    maximumTrackTintColor="#52525b"
                    thumbTintColor="#60A5FA"
                  />
                </View>

                {[
                  {
                    key: "uppercase",
                    label: t("seguridad_uppercase", "Mayúsculas (A-Z)"),
                  },
                  {
                    key: "lowercase",
                    label: t("seguridad_lowercase", "Minúsculas (a-z)"),
                  },
                  { key: "numbers", label: t("seguridad_numbers", "Números (0-9)") },
                  {
                    key: "symbols",
                    label: t("seguridad_symbols", "Símbolos (!@#$)"),
                  },
                  {
                    key: "excludeAmbiguous",
                    label: t(
                      "seguridad_exclude_ambiguous",
                      "Evitar ambiguos (0, O, I, l)",
                    ),
                  },
                ].map((item) => (
                  <View
                    key={item.key}
                    className="flex-row justify-between items-center py-2.5 border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <Text className="text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                      {item.label}
                    </Text>
                    <Switch
                      value={(generatorOptions as any)[item.key]}
                      onValueChange={(val) =>
                        setGeneratorOptions({ [item.key]: val })
                      }
                      trackColor={{ false: "#71717a", true: "#2563EB" }}
                      thumbColor="#ffffff"
                    />
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>

        {/* SAVE TO VAULT MODAL */}
        <Modal visible={showSaveModal} transparent={true} animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-black/60 items-center justify-center p-6"
          >
            <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-black text-zinc-900 dark:text-white">
                  {t("seguridad_save_vault", "Guardar en Bóveda")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSaveModal(false)}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs uppercase font-bold text-zinc-400 mb-1">
                {t("seguridad_account_name", "Nombre de Cuenta")}
              </Text>
              <TextInput
                value={vaultName}
                onChangeText={setVaultName}
                placeholder={t("seguridad_account_ph", "Ej. Correo Corporativo")}
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium mb-3"
                autoFocus
              />

              <Text className="text-xs uppercase font-bold text-zinc-400 mb-1">
                {t("seguridad_username_label", "Usuario / Correo (opcional)")}
              </Text>
              <TextInput
                value={vaultUsername}
                onChangeText={setVaultUsername}
                placeholder={t("seguridad_username_ph", "usuario@ejemplo.com")}
                placeholderTextColor="#a1a1aa"
                autoCapitalize="none"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium mb-3"
              />

              <Text className="text-xs uppercase font-bold text-zinc-400 mb-1">
                {t("seguridad_notes_label", "Notas (opcional)")}
              </Text>
              <TextInput
                value={vaultNotes}
                onChangeText={setVaultNotes}
                placeholder={t("seguridad_notes_ph", "Pista o información de recuperación...")}
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium mb-4"
              />

              {/* Expiration Options */}
              <Text className="text-xs uppercase font-bold text-zinc-400 mb-2">
                {t("seguridad_expiry_label", "Recordatorio de Renovación")}
              </Text>
              <View className="flex-row gap-2 mb-5">
                {[
                  { label: t("seguridad_expiry_never", "Nunca"), days: 0 },
                  { label: "30 d", days: 30 },
                  { label: "90 d", days: 90 },
                  { label: "180 d", days: 180 },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.days}
                    onPress={() => setExpiryDays(opt.days)}
                    className={`flex-1 py-2 items-center rounded-xl border ${
                      expiryDays === opt.days
                        ? "bg-blue-600 border-blue-600"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${expiryDays === opt.days ? "text-white" : "text-zinc-600 dark:text-zinc-300"}`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSaveToVault}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-base">
                  {t("seguridad_save_btn", "Guardar en Bóveda Cifrada")}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName="Seguridad 4All"
          accentColor="#2563EB"
          i18nInstance={i18n}
        />
      </View>
    </SafeAreaView>
  );
}

import React, { useState, ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSharedSettingsStore, ThemeOption } from "./useSharedSettingsStore";
import { LegalModal4All } from "./LegalModal4All";
import { ECOSYSTEM_CONFIG } from "./ecosystemConfig";

// ─── Language catalogue (all 26) ─────────────────────────────────────────────
const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇨🇴" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "id", name: "Indonesia", flag: "🇮🇩" },
  { code: "zh-CN", name: "中文(简体)", flag: "🇨🇳" },
  { code: "zh-TW", name: "中文(繁體)", flag: "🇹🇼" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "ภาษาไทย", flag: "🇹🇭" },
  // Phase 2 LTR Languages
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
];

// ─── Props ───────────────────────────────────────────────────────────────────
interface SettingsModal4AllProps {
  visible: boolean;
  onClose: () => void;
  appName: string;
  appVersion?: string;
  /** Hex color for active accents matching the app category */
  accentColor: string;
  /** Extra JSX for app-specific options – rendered in its own section */
  appSpecificSection?: ReactNode;
  /** i18n instance so we can call changeLanguage and translate from this shared component */
  i18nInstance?: any;
}

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 px-1">
      {title}
    </Text>
  );
}

// ─── Settings row (simple touchable) ─────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  isLast = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`flex-row items-center px-4 py-3.5 bg-white dark:bg-zinc-900 ${
        !isLast ? "border-b border-zinc-100 dark:border-zinc-800" : ""
      }`}
    >
      <Text className="text-xl mr-3 w-7 text-center">{icon}</Text>
      <View className="flex-1 mr-2">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
          {label}
        </Text>
        {sublabel ? (
          <Text className="text-xs text-zinc-400 mt-0.5 leading-4">
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ?? null}
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SettingsModal4All({
  visible,
  onClose,
  appName,
  appVersion = "1.0.0",
  accentColor,
  appSpecificSection,
  i18nInstance,
}: SettingsModal4AllProps) {
  const { language, theme, setLanguage, setTheme } = useSharedSettingsStore();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const tr = (key: string, fallback: string) => {
    if (i18nInstance && typeof i18nInstance.t === "function") {
      return i18nInstance.t(key, fallback);
    }
    return fallback;
  };

  const compareSemver = (remote: string, local: string): number => {
    const r = remote.replace(/^v/, "").split(".").map(Number);
    const l = local.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      const diff = (r[i] || 0) - (l[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch(ECOSYSTEM_CONFIG.VERSIONS_JSON_URL, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const slug = appName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
      const entry =
        data?.apps?.[slug] ||
        Object.values(data?.apps || {}).find((_: any) => false);
      const remoteVer = entry?.version || appVersion;
      const downloadUrl =
        entry?.downloadUrl || ECOSYSTEM_CONFIG.GITHUB_RELEASES_URL;

      if (compareSemver(remoteVer, appVersion) > 0) {
        Alert.alert(
          tr("settings_update_available", "Nueva versión disponible"),
          `${appName} v${remoteVer}`,
          [
            { text: tr("cancel", "Cancelar"), style: "cancel" },
            {
              text: tr(
                "settings_update_download",
                "Descargar en Portal Oficial",
              ),
              onPress: () => Linking.openURL(downloadUrl).catch(() => {}),
            },
          ],
        );
      } else {
        Alert.alert(
          appName,
          `${tr("settings_update_latest", "¡Tienes la última versión!")} (v${appVersion})`,
        );
      }
    } catch {
      Alert.alert(
        appName,
        tr(
          "settings_update_offline",
          "Sin conexión a internet. La app sigue funcionando 100% offline.",
        ),
      );
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    if (i18nInstance && typeof i18nInstance.changeLanguage === "function") {
      i18nInstance.changeLanguage(code);
    }
  };

  const themeOptions: { value: ThemeOption; label: string; icon: string }[] = [
    { value: "light", label: tr("settings_theme_light", "Claro"), icon: "☀️" },
    { value: "dark", label: tr("settings_theme_dark", "Oscuro"), icon: "🌙" },
    { value: "system", label: tr("settings_theme_system", "Sistema"), icon: "📱" },
  ];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-zinc-100 dark:bg-zinc-950">
          {/* ── Header ── */}
          <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-zinc-100 dark:bg-zinc-950">
            <View>
              <Text className="text-2xl font-black text-zinc-900 dark:text-white">
                {tr("settings", "Ajustes")}
              </Text>
              <Text className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                {appName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center"
            >
              <Text className="text-zinc-600 dark:text-zinc-300 font-bold text-lg leading-none">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── 1. PRIVACIDAD LOCAL-FIRST ─────────────────────────────── */}
            <View className="px-5 mb-6">
              <View className="px-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: accentColor + "22" }}
                >
                  <Text className="text-xl">🔒</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                    {tr("settings_offline_badge", "100% Offline • Sin Cuentas")}
                  </Text>
                  <Text className="text-[11px] text-zinc-400 mt-0.5 leading-4">
                    {tr(
                      "settings_offline_desc",
                      "Tus datos nunca salen de este dispositivo. Cero telemetría, cero rastreadores.",
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* ─── 2. APARIENCIA ─────────────────────────────────────────── */}
            <View className="px-5 mb-6">
              <SectionHeader title={tr("settings_appearance", "Apariencia")} />
              <View className="flex-row bg-white dark:bg-zinc-900 rounded-2xl p-1.5 border border-zinc-200 dark:border-zinc-800">
                {themeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setTheme(opt.value)}
                    className="flex-1 py-2.5 rounded-xl items-center justify-center"
                    style={
                      theme === opt.value
                        ? { backgroundColor: accentColor }
                        : {}
                    }
                  >
                    <Text className="text-base mb-0.5">{opt.icon}</Text>
                    <Text
                      className={`text-[10px] font-bold ${
                        theme === opt.value ? "text-white" : "text-zinc-500"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ─── 3. IDIOMA ─────────────────────────────────────────────── */}
            <View className="px-5 mb-6">
              <SectionHeader title={tr("settings_language", "Idioma")} />
              <View className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {LANGUAGES.map((lang, idx) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleLanguageSelect(lang.code)}
                    className={`flex-row items-center px-4 py-3 bg-white dark:bg-zinc-900 ${
                      idx < LANGUAGES.length - 1
                        ? "border-b border-zinc-100 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <Text className="text-lg mr-3">{lang.flag}</Text>
                    <Text
                      className={`flex-1 text-sm ${
                        language === lang.code
                          ? "font-bold text-zinc-900 dark:text-white"
                          : "font-medium text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {lang.name}
                    </Text>
                    {language === lang.code && (
                      <Text
                        style={{ color: accentColor }}
                        className="font-black text-base"
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ─── 4. OPCIONES DE LA APP (custom) ───────────────────────── */}
            {appSpecificSection != null && (
              <View className="px-5 mb-6">
                <SectionHeader
                  title={
                    i18nInstance && typeof i18nInstance.t === "function"
                      ? i18nInstance.t("settings_app_options_named", {
                          appName,
                          defaultValue: `Opciones de ${appName}`,
                        })
                      : `Opciones de ${appName}`
                  }
                />
                <View className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  {appSpecificSection}
                </View>
              </View>
            )}

            {/* ─── 5. LEGAL Y PRIVACIDAD ─────────────────────────────────── */}
            <View className="px-5 mb-6">
              <SectionHeader title={tr("settings_legal", "Legal y Privacidad")} />
              <View className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <SettingsRow
                  icon="🛡️"
                  label={tr("settings_privacy_policy", "Política de Privacidad")}
                  sublabel={tr(
                    "settings_privacy_sub",
                    "100% Offline, sin rastreadores ni telemetría",
                  )}
                  onPress={() => setShowLegalModal(true)}
                  right={
                    <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                      ›
                    </Text>
                  }
                />
                <SettingsRow
                  icon="📜"
                  label={tr("settings_terms", "Términos y Condiciones")}
                  sublabel={tr(
                    "settings_terms_sub",
                    "Uso no comercial y arquitectura Local-First",
                  )}
                  onPress={() => setShowLegalModal(true)}
                  right={
                    <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                      ›
                    </Text>
                  }
                />
                <SettingsRow
                  icon="⚖️"
                  label={tr("settings_license", "Licencia del Software")}
                  sublabel="PolyForm Noncommercial 1.0.0"
                  onPress={() => setShowLegalModal(true)}
                  right={
                    <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                      ›
                    </Text>
                  }
                  isLast
                />
              </View>
            </View>

            {/* ─── 6. ACERCA DE ──────────────────────────────────────────── */}
            <View className="px-5 mb-2">
              <SectionHeader title={tr("settings_about", "Acerca de")} />
              <View className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <SettingsRow
                  icon="📱"
                  label={appName}
                  sublabel={`v${appVersion} • Para Todos (4All)`}
                />
                {Platform.OS !== "ios" && (
                  <SettingsRow
                    icon="🔄"
                    label={tr("settings_check_updates", "Buscar actualizaciones")}
                    sublabel={tr(
                      "settings_check_updates_sub",
                      "Verificación manual en el portal oficial (sin rastreo)",
                    )}
                    onPress={checkingUpdate ? undefined : handleCheckUpdates}
                    right={
                      checkingUpdate ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                          ›
                        </Text>
                      )
                    }
                  />
                )}
                <SettingsRow
                  icon="🔍"
                  label={tr("settings_source_code", "Código Fuente Público")}
                  sublabel={tr(
                    "settings_source_code_sub",
                    "Audita en GitHub que no hay rastreadores",
                  )}
                  onPress={() =>
                    Linking.openURL(ECOSYSTEM_CONFIG.GITHUB_REPO_URL)
                  }
                  right={
                    <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                      ↗
                    </Text>
                  }
                />
                <SettingsRow
                  icon="💻"
                  label={ECOSYSTEM_CONFIG.AUTHOR_BRAND_NAME}
                  sublabel={tr(
                    "settings_made_by",
                    "Hecho con amor por RedStabros — Mauricio Saldarriaga",
                  )}
                  onPress={() =>
                    Linking.openURL(ECOSYSTEM_CONFIG.PORTFOLIO_URL)
                  }
                  right={
                    <Text className="text-zinc-300 dark:text-zinc-600 text-base">
                      ↗
                    </Text>
                  }
                  isLast
                />
              </View>
            </View>

            {/* Copyright */}
            <Text className="text-center text-[10px] text-zinc-400 mt-6 px-10 leading-4">
              © 2026 Mauricio Saldarriaga · Para Todos (4All).{"\n"}
              {tr(
                "settings_footer_tagline",
                "Sin publicidad • Sin cuentas • Sin telemetría",
              )}
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Nested Legal / Privacy / Terms Modal */}
      <LegalModal4All
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        appName={appName}
        lang={language}
      />
    </>
  );
}

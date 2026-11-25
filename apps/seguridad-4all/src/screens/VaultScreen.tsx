import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  useSecurityStore,
  fetchSecureVault,
  VaultItem,
} from "../store/useSecurityStore";
import { encryptBackupVault, decryptBackupVault } from "../utils/vaultCrypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import {
  ChevronLeft,
  Trash2,
  Copy,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Download,
  Upload,
  User,
  X,
} from "lucide-react-native";

export default function VaultScreen({ navigation }: any) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";
  const {
    vault,
    isVaultUnlocked,
    unlockVault,
    removeVaultItem,
    importVaultItems,
  } = useSecurityStore();

  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [backupModalMode, setBackupModalMode] = useState<
    "export" | "import" | null
  >(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [pendingImportContent, setPendingImportContent] = useState<
    string | null
  >(null);
  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, []);

  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const authenticate = async () => {
      if (!isVaultUnlocked) {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const auth = await LocalAuthentication.authenticateAsync({
              promptMessage: t(
                "seguridad_auth_reason",
                "Autentícate para ver tus contraseñas",
              ),
              disableDeviceFallback: false,
            });
            if (auth.success) {
              const data = await fetchSecureVault();
              unlockVault(data);
            } else {
              navigation.goBack();
            }
          } else {
            const data = await fetchSecureVault();
            unlockVault(data);
          }
        } catch {
          Alert.alert(
            t("seguridad_title", "Seguridad 4All"),
            t(
              "seguridad_auth_error",
              "No se pudo verificar tu identidad biométrica.",
            ),
          );
          navigation.goBack();
        }
      }
    };
    authenticate();
  }, []);

  const copySecureValue = async (val: string, autoClear = true) => {
    await Clipboard.setStringAsync(val);
    if (autoClear) {
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = setTimeout(async () => {
        try {
          const current = await Clipboard.getStringAsync();
          if (current === val) {
            await Clipboard.setStringAsync("");
          }
        } catch {
          // Ignore clipboard read error
        }
      }, 30000);
    }
    Alert.alert(
      t("copied", "¡Copiado!"),
      autoClear
        ? t(
            "seguridad_clipboard_autoclear",
            "Copiada al portapapeles. Se borrará automáticamente en 30 segundos.",
          )
        : t("seguridad_user_copied", "Usuario copiado al portapapeles."),
    );
  };

  const handleStartImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const content = await FileSystem.readAsStringAsync(res.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setPendingImportContent(content);
      setBackupPassword("");
      setBackupModalMode("import");
    } catch {
      Alert.alert(
        t("seguridad_backup_error_title", "No se pudo leer el archivo"),
        t(
          "seguridad_backup_error_desc",
          "Selecciona un respaldo cifrado exportado desde Seguridad 4All.",
        ),
      );
    }
  };

  const handleConfirmBackupAction = async () => {
    if (backupPassword.trim().length < 4) {
      Alert.alert(
        t("seguridad_backup_pass_short_title", "Clave muy corta"),
        t(
          "seguridad_backup_pass_short_desc",
          "Usa una clave maestra de al menos 4 caracteres para cifrar tu respaldo.",
        ),
      );
      return;
    }

    if (backupModalMode === "export") {
      try {
        const encryptedJson = await encryptBackupVault(
          JSON.stringify(vault),
          backupPassword.trim(),
        );
        const filename = `seguridad_boveda_${Date.now()}.json`;
        const filePath = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(filePath, encryptedJson, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setBackupModalMode(null);
        setBackupPassword("");
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        } else {
          Alert.alert(
            t("seguridad_export_ok", "Respaldo cifrado guardado"),
            filename,
          );
        }
      } catch {
        Alert.alert(
          t("seguridad_backup_error_title", "No se pudo exportar"),
          t(
            "seguridad_backup_error_desc",
            "Verifica el espacio disponible e intenta de nuevo.",
          ),
        );
      }
    } else if (backupModalMode === "import" && pendingImportContent) {
      const decrypted = await decryptBackupVault(
        pendingImportContent,
        backupPassword.trim(),
      );
      if (!decrypted) {
        Alert.alert(
          t("seguridad_decrypt_fail_title", "Clave incorrecta o archivo inválido"),
          t(
            "seguridad_decrypt_fail_desc",
            "Verifica la clave maestra usada al exportar el respaldo.",
          ),
        );
        return;
      }
      const parsed: VaultItem[] = JSON.parse(decrypted);
      const added = await importVaultItems(parsed);
      setBackupModalMode(null);
      setBackupPassword("");
      setPendingImportContent(null);
      Alert.alert(
        t("seguridad_import_ok_title", "Bóveda restaurada"),
        t(
          "seguridad_import_ok_desc",
          `Se importaron ${added} contraseñas nuevas.`,
          { count: added },
        ),
      );
    }
  };

  const getExpiryStatus = (expiryTimestamp?: number) => {
    if (!expiryTimestamp) return null;
    const diffMs = expiryTimestamp - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        isExpired: true,
        text: t("seguridad_expired", "Expirada"),
      };
    }
    return {
      isExpired: false,
      text: t("seguridad_expires_in", `Vence en ${diffDays}d`, {
        days: diffDays,
      }),
    };
  };

  const renderVaultItem = ({ item }: { item: VaultItem }) => {
    const expiry = getExpiryStatus(item.expiryTimestamp);

    return (
      <View className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-base font-bold text-zinc-900 dark:text-white flex-1 mr-2">
            {item.name}
          </Text>

          {expiry && (
            <View
              className={`px-2.5 py-0.5 rounded-full flex-row items-center mr-2 ${
                expiry.isExpired
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              {expiry.isExpired ? (
                <AlertTriangle color="#ef4444" size={11} className="mr-1" />
              ) : (
                <Clock color="#d97706" size={11} className="mr-1" />
              )}
              <Text
                className={`text-[10px] font-bold ${expiry.isExpired ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}
              >
                {expiry.text}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => removeVaultItem(item.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("delete", "Eliminar")}
            className="p-2"
          >
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
        </View>

        {!!item.username && (
          <TouchableOpacity
            onPress={() => copySecureValue(item.username!, false)}
            className="flex-row items-center mb-2"
          >
            <User color="#a1a1aa" size={13} />
            <Text
              className="text-xs text-zinc-500 dark:text-zinc-400 ml-1.5 font-medium"
              numberOfLines={1}
            >
              {item.username}
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-row justify-between items-center bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <Text
            className="text-zinc-900 dark:text-white font-mono tracking-wider flex-1 mr-2 text-xs"
            numberOfLines={1}
          >
            {visiblePasswords[item.id]
              ? item.passwordEncrypted
              : "⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢"}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={() => toggleVisibility(item.id)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("seguridad_toggle_visibility", "Mostrar u ocultar contraseña")}
              className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl"
            >
              {visiblePasswords[item.id] ? (
                <EyeOff color="#71717a" size={15} />
              ) : (
                <Eye color="#71717a" size={15} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => copySecureValue(item.passwordEncrypted, true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("copy", "Copiar")}
              className="p-2 bg-blue-600 rounded-xl"
            >
              <Copy color="#ffffff" size={15} />
            </TouchableOpacity>
          </View>
        </View>

        {!!item.notes && (
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-4">
            {item.notes}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <View className="pt-3 pb-4 px-5 flex-row items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("back", "Volver")}
            className="flex-row items-center py-1 pr-2"
          >
            <ChevronLeft color={accentHex} size={24} />
            <Text className="text-blue-600 dark:text-blue-400 font-bold ml-0.5">
              {t("back", "Volver")}
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-black text-zinc-900 dark:text-white">
            {t("seguridad_vault_title", "Bóveda Privada")}
          </Text>
          <View className="flex-row items-center gap-1.5">
            {isVaultUnlocked && (
              <>
                <TouchableOpacity
                  onPress={handleStartImport}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("seguridad_import_vault", "Importar bóveda cifrada")}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                >
                  <Upload color={accentHex} size={17} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setBackupPassword("");
                    setBackupModalMode("export");
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("seguridad_export_vault", "Exportar bóveda cifrada")}
                  className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-full"
                >
                  <Download color={accentHex} size={17} />
                </TouchableOpacity>
              </>
            )}
            {!isVaultUnlocked && <ShieldCheck color={accentHex} size={22} />}
          </View>
        </View>

        {isVaultUnlocked ? (
          <FlatList
            data={vault}
            keyExtractor={(item) => item.id}
            renderItem={renderVaultItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Lock size={44} color="#a1a1aa" className="mb-3" />
                <Text className="text-zinc-500 text-center font-medium">
                  {t(
                    "seguridad_no_passwords",
                    "No hay contraseñas guardadas en la bóveda.",
                  )}
                </Text>
              </View>
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Lock size={48} color={accentHex} className="mb-4" />
            <Text className="text-zinc-600 dark:text-zinc-400 text-center font-bold">
              {t("seguridad_auth_reason", "Autentícate para ver tus contraseñas")}
            </Text>
          </View>
        )}

        {/* Encrypted Backup Password Modal */}
        <Modal
          visible={backupModalMode !== null}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-6">
            <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-black text-zinc-900 dark:text-white">
                  {backupModalMode === "export"
                    ? t("seguridad_export_vault", "Exportar Bóveda Cifrada")
                    : t("seguridad_import_vault", "Importar Bóveda Cifrada")}
                </Text>
                <TouchableOpacity
                  onPress={() => setBackupModalMode(null)}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-5">
                {backupModalMode === "export"
                  ? t(
                      "seguridad_export_vault_desc",
                      "Elige una clave maestra para cifrar el archivo. La necesitarás para restaurarlo en otro dispositivo.",
                    )
                  : t(
                      "seguridad_import_vault_desc",
                      "Ingresa la clave maestra con la que se cifró este respaldo.",
                    )}
              </Text>

              <TextInput
                value={backupPassword}
                onChangeText={setBackupPassword}
                secureTextEntry
                placeholder={t("seguridad_master_pass_ph", "Clave maestra...")}
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium mb-5"
                autoFocus
              />

              <TouchableOpacity
                onPress={handleConfirmBackupAction}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center"
              >
                <Text className="text-white font-bold text-base">
                  {backupModalMode === "export"
                    ? t("seguridad_export_btn", "Cifrar y Exportar")
                    : t("seguridad_import_btn", "Descifrar e Importar")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

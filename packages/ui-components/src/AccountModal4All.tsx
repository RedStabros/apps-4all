import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
} from "@apps4all/supabase-client";

interface AccountModal4AllProps {
  visible: boolean;
  onClose: () => void;
  appName: string;
  onAuthStateChanged?: (user: any) => void;
}

export function AccountModal4All({
  visible,
  onClose,
  appName,
  onAuthStateChanged,
}: AccountModal4AllProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (visible) {
      checkUser();
    }
  }, [visible]);

  const checkUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (onAuthStateChanged) onAuthStateChanged(user);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Datos requeridos",
        "Por favor ingresa tu correo y contraseña.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      let result;
      if (authMode === "signup") {
        result = await signUpUser(email, password);
        if (result.error) {
          Alert.alert(
            "Registro",
            result.error.message || "No se pudo crear la cuenta.",
          );
        } else {
          Alert.alert(
            "¡Cuenta Creada!",
            "Se ha creado tu cuenta. Si se requiere confirmación, revisa tu correo.",
          );
          await checkUser();
        }
      } else {
        result = await signInUser(email, password);
        if (result.error) {
          Alert.alert(
            "Inicio de Sesión",
            result.error.message || "Credenciales incorrectas.",
          );
        } else {
          Alert.alert(
            "¡Sesión Iniciada!",
            "Tu cuenta ha sido conectada con éxito.",
          );
          await checkUser();
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Ocurrió un error inesperado.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    setIsProcessing(true);
    await signOutUser();
    setCurrentUser(null);
    if (onAuthStateChanged) onAuthStateChanged(null);
    setIsProcessing(false);
    Alert.alert(
      "Modo Local",
      "Has cerrado sesión. La app continuará funcionando 100% de manera local y offline.",
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View className="flex-1 bg-black/75 items-center justify-center p-6">
        <View className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xl font-black text-zinc-900 dark:text-white">
                Cuenta de Usuario
              </Text>
              <Text className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                {appName} • 100% Opcional
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <Text className="text-zinc-600 dark:text-zinc-300 font-bold text-base">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transparent Privacy Pledge Banner */}
          <View className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-2xl mb-4 border border-blue-500/20">
            <Text className="text-blue-900 dark:text-blue-200 text-xs font-bold mb-1">
              🛡️ Privacidad Garantizada
            </Text>
            <Text className="text-blue-800 dark:text-blue-300 text-[11px] leading-4">
              Por defecto, todas tus notas, archivos y configuraciones se quedan
              únicamente en este teléfono. Crear o usar una cuenta solo es
              necesario si deseas sincronizar datos entre tus dispositivos.
            </Text>
          </View>

          {currentUser ? (
            /* Logged in state */
            <View className="py-2">
              <View className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl mb-4 border border-zinc-200 dark:border-zinc-700">
                <Text className="text-xs text-zinc-400 font-bold uppercase mb-1">
                  Sesión Activa:
                </Text>
                <Text
                  className="text-sm font-bold text-zinc-900 dark:text-white font-mono"
                  numberOfLines={1}
                >
                  {currentUser.email}
                </Text>
                <View className="flex-row items-center mt-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    Sincronización en la Nube Lista
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 items-center justify-center mb-2"
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <Text className="text-red-500 font-bold text-xs">
                    Cerrar Sesión (Volver a Modo 100% Offline)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Login / Signup Form */
            <View>
              {/* Mode Tabs */}
              <View className="flex-row bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
                <TouchableOpacity
                  onPress={() => setAuthMode("signin")}
                  className={`flex-1 py-2 rounded-xl items-center ${
                    authMode === "signin"
                      ? "bg-white dark:bg-zinc-900 shadow-sm"
                      : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      authMode === "signin"
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    Iniciar Sesión
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAuthMode("signup")}
                  className={`flex-1 py-2 rounded-xl items-center ${
                    authMode === "signup"
                      ? "bg-white dark:bg-zinc-900 shadow-sm"
                      : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      authMode === "signup"
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    Crear Cuenta
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium text-xs mb-3 border border-zinc-200 dark:border-zinc-700"
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor="#a1a1aa"
                secureTextEntry
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-medium text-xs mb-4 border border-zinc-200 dark:border-zinc-700"
              />

              <TouchableOpacity
                onPress={handleAuth}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm mb-2"
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-white font-bold text-xs">
                    {authMode === "signup"
                      ? "Crear Cuenta y Activar Respaldo"
                      : "Iniciar Sesión"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={onClose} className="py-2 items-center">
            <Text className="text-zinc-400 font-bold text-xs">
              Continuar en Modo Offline
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

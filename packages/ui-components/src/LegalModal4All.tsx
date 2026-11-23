import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { ECOSYSTEM_CONFIG } from "./ecosystemConfig";

interface LegalModal4AllProps {
  visible: boolean;
  onClose: () => void;
  appName: string;
  lang?: string;
}

export function LegalModal4All({
  visible,
  onClose,
  appName,
  lang = "es",
}: LegalModal4AllProps) {
  const webLegalUrl = `${ECOSYSTEM_CONFIG.PORTAL_BASE_URL}/${lang}/legal/privacy`;

  const openWebTerms = () => {
    Linking.openURL(webLegalUrl).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 max-h-[85%] border-t border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <View>
              <Text className="text-xl font-black text-zinc-900 dark:text-white">
                Términos y Privacidad
              </Text>
              <Text className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                {appName} • 100% Offline
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

          {/* Legal Content Scroll */}
          <ScrollView className="mb-4 pr-1" showsVerticalScrollIndicator={true}>
            <Text className="text-sm font-black text-zinc-900 dark:text-white mb-2">
              1. Compromiso de Privacidad Absoluta (Local-First)
            </Text>
            <Text className="text-xs text-zinc-600 dark:text-zinc-300 leading-5 mb-4">
              {appName} opera de forma local e independiente en tu dispositivo.
              No recopilamos, no vendemos, no rastreamos ni almacenamos en
              servidores remotos tus datos personales, archivos, contraseñas,
              audios ni capturas de cámara. La aplicación funciona al 100% sin
              conexión a internet.
            </Text>

            <Text className="text-sm font-black text-zinc-900 dark:text-white mb-2">
              2. Sin Rastreo ni Analítica Invasiva
            </Text>
            <Text className="text-xs text-zinc-600 dark:text-zinc-300 leading-5 mb-4">
              Este software no contiene SDKs de telemetría publicitaria ni
              rastreadores de terceros (como Firebase Analytics, Meta Pixel o
              Google Telemetry). El código fuente es público para auditoría de
              transparencia.
            </Text>

            <Text className="text-sm font-black text-zinc-900 dark:text-white mb-2">
              3. Licencia de Uso (PolyForm Noncommercial 1.0.0)
            </Text>
            <Text className="text-xs text-zinc-600 dark:text-zinc-300 leading-5 mb-4">
              El software se proporciona de forma gratuita para uso personal y
              educativo. Queda estrictamente prohibida la explotación comercial,
              redistribución con fines de lucro o reempaquetado no autorizado
              sin el consentimiento previo por escrito del autor y titular de
              los derechos de autor.
            </Text>

            <Text className="text-sm font-black text-zinc-900 dark:text-white mb-2">
              4. 100% Offline — Sin Cuentas ni Telemetría
            </Text>
            <Text className="text-xs text-zinc-600 dark:text-zinc-300 leading-5 mb-4">
              Esta aplicación no solicita registro, no crea cuentas de usuario y
              no incluye telemetría ni reportes automáticos. Toda tu información
              permanece exclusivamente bajo tu control dentro de tu dispositivo.
            </Text>

            <Text className="text-[11px] text-zinc-400 leading-4 mt-1 mb-2">
              Copyright (c) 2026 Mauricio Saldarriaga. Todos los derechos reservados.
            </Text>
          </ScrollView>

          {/* Actions */}
          <View className="flex-row gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <TouchableOpacity
              onPress={openWebTerms}
              className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200 dark:border-zinc-700"
            >
              <Text className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                Ver en Web Oficial ↗
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-2xl bg-zinc-900 dark:bg-white items-center justify-center"
            >
              <Text className="text-white dark:text-zinc-900 font-bold text-xs">
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

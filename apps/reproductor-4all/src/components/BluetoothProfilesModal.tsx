import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  Bluetooth,
  Sliders,
  Check,
  X,
  Plus,
  Radio,
  Headphones,
} from "lucide-react-native";
import {
  useAudioPlayerStore,
  DEFAULT_EQ_PRESETS,
} from "../store/useAudioPlayerStore";

interface BluetoothProfilesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BluetoothProfilesModal: React.FC<BluetoothProfilesModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const {
    bluetoothProfiles,
    activeBluetoothDevice,
    assignBluetoothProfile,
    applyProfile,
  } = useAudioPlayerStore();

  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("bass");
  const [showAddForm, setShowAddForm] = useState(false);

  // Perfiles mapeados por defecto si no existen
  const mappedDevices = Object.entries(bluetoothProfiles);

  const handleSaveDevice = () => {
    const trimmed = newDeviceName.trim();
    if (!trimmed) return;
    assignBluetoothProfile(trimmed, selectedPresetId);
    if (activeBluetoothDevice === trimmed) {
      applyProfile(selectedPresetId);
    }
    setNewDeviceName("");
    setShowAddForm(false);
  };

  const handleUpdateDevicePreset = (deviceName: string, presetId: string) => {
    assignBluetoothProfile(deviceName, presetId);
    if (activeBluetoothDevice === deviceName) {
      applyProfile(presetId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/75"
      >
        <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-6 pt-6 pb-14 max-h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 items-center justify-center mr-2.5">
                <Bluetooth color="#2DD4BF" size={18} />
              </View>
              <View>
                <Text className="text-lg font-black text-white">
                  {t("reproductor_bt_manager", "Gestor Bluetooth & EQ")}
                </Text>
                <Text className="text-xs text-zinc-400">
                  {t(
                    "reproductor_bt_desc",
                    "Calibración automática de ecualización por dispositivo",
                  )}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-zinc-800 rounded-full"
            >
              <X color="#A1A1AA" size={18} />
            </TouchableOpacity>
          </View>

          {/* Estado del dispositivo actualmente activo */}
          <View className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Headphones
                color={activeBluetoothDevice ? "#2DD4BF" : "#71717A"}
                size={20}
                className="mr-3"
              />
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t("reproductor_connected_device", "Dispositivo Conectado")}
                </Text>
                <Text
                  className="text-white text-xs font-bold mt-0.5"
                  numberOfLines={1}
                >
                  {activeBluetoothDevice ||
                    t("reproductor_no_bt_connected", "Sin dispositivo conectado")}
                </Text>
              </View>
            </View>

            {activeBluetoothDevice && (
              <View className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                <Text className="text-teal-400 text-[10px] font-black">
                  ACTIVO
                </Text>
              </View>
            )}
          </View>

          <ScrollView className="mb-4">
            {/* Lista de dispositivos guardados */}
            <Text className="text-xs font-black text-zinc-400 mb-2 uppercase tracking-wider">
              {t("reproductor_saved_profiles", "Perfiles Asignados")}
            </Text>

            {mappedDevices.length === 0 && (
              <View className="py-6 items-center justify-center">
                <Radio color="#52525B" size={32} className="mb-2" />
                <Text className="text-zinc-400 text-xs text-center px-4">
                  {t(
                    "reproductor_no_bt_profiles",
                    "No hay dispositivos vinculados aún. Vincula tus auriculares o altavoces Bluetooth para auto-aplicar ecualización.",
                  )}
                </Text>
              </View>
            )}

            {mappedDevices.map(([deviceName, presetId]) => {
              const presetObj = DEFAULT_EQ_PRESETS.find((p) => p.id === presetId);
              return (
                <View
                  key={deviceName}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl mb-2.5"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Bluetooth color="#2DD4BF" size={14} className="mr-2" />
                      <Text
                        className="text-white font-bold text-xs"
                        numberOfLines={1}
                      >
                        {deviceName}
                      </Text>
                    </View>
                    <View className="px-2 py-0.5 bg-zinc-800 rounded">
                      <Text className="text-teal-400 text-[10px] font-bold">
                        {presetObj?.name || presetId}
                      </Text>
                    </View>
                  </View>

                  {/* Selector rápido de Preset */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-1.5 pt-1">
                      {DEFAULT_EQ_PRESETS.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => handleUpdateDevicePreset(deviceName, p.id)}
                          className={`px-2.5 py-1 rounded-lg border ${
                            presetId === p.id
                              ? "bg-teal-500/20 border-teal-500"
                              : "bg-zinc-900 border-zinc-800"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              presetId === p.id
                                ? "text-teal-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              );
            })}

            {/* Formulario para agregar dispositivo */}
            {showAddForm ? (
              <View className="p-3.5 bg-zinc-950 border border-teal-500/40 rounded-2xl mt-2">
                <Text className="text-xs font-bold text-white mb-2">
                  {t("reproductor_add_device", "Vincular Dispositivo")}
                </Text>
                <TextInput
                  value={newDeviceName}
                  onChangeText={setNewDeviceName}
                  placeholder={t(
                    "reproductor_device_name",
                    "Ej: Sony WH-1000XM5, AirPods...",
                  )}
                  placeholderTextColor="#71717A"
                  className="bg-zinc-900 border border-zinc-800 text-white text-xs px-3 py-2 rounded-xl mb-3"
                />

                <Text className="text-[10px] text-zinc-400 font-bold mb-1.5 uppercase">
                  {t("reproductor_select_preset", "Seleccionar Perfil EQ")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3"
                >
                  <View className="flex-row gap-1.5">
                    {DEFAULT_EQ_PRESETS.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setSelectedPresetId(p.id)}
                        className={`px-2.5 py-1 rounded-lg border ${
                          selectedPresetId === p.id
                            ? "bg-teal-500/20 border-teal-500"
                            : "bg-zinc-900 border-zinc-800"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            selectedPresetId === p.id
                              ? "text-teal-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowAddForm(false)}
                    className="flex-1 py-2 bg-zinc-800 rounded-xl items-center"
                  >
                    <Text className="text-zinc-400 text-xs font-bold">
                      {t("cancel", "Cancelar")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveDevice}
                    disabled={!newDeviceName.trim()}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      newDeviceName.trim() ? "bg-teal-500" : "bg-zinc-800"
                    }`}
                  >
                    <Text className="text-zinc-950 text-xs font-black">
                      {t("save", "Guardar")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (activeBluetoothDevice && !bluetoothProfiles[activeBluetoothDevice]) {
                    setNewDeviceName(activeBluetoothDevice);
                  }
                  setShowAddForm(true);
                }}
                className="flex-row items-center justify-center p-3 bg-zinc-950 border border-dashed border-zinc-700 rounded-2xl mt-2 active:scale-95"
              >
                <Plus color="#2DD4BF" size={16} className="mr-2" />
                <Text className="text-teal-400 text-xs font-bold">
                  {activeBluetoothDevice && !bluetoothProfiles[activeBluetoothDevice]
                    ? `${t("reproductor_link_current", "Vincular")} "${activeBluetoothDevice}"`
                    : t("reproductor_add_device", "Vincular Dispositivo Bluetooth")}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

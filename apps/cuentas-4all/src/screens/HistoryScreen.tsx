import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react-native";
import { useAccountsStore, AccountRecord } from "../store/useAccountsStore";

export default function HistoryScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#FBBF24" : "#B45309";

  const { history, currency, deleteRecord, clearHistory } = useAccountsStore();

  const confirmClear = () => {
    Alert.alert(
      t("cuentas_clear_all", "Borrar Historial"),
      t("cuentas_clear_confirm", "¿Deseas borrar todo el historial de cuentas?"),
      [
        { text: t("cancel", "Cancelar"), style: "cancel" },
        {
          text: t("delete", "Eliminar"),
          style: "destructive",
          onPress: clearHistory,
        },
      ],
    );
  };

  const renderItem = ({ item: record }: { item: AccountRecord }) => (
    <View className="bg-white dark:bg-zinc-900 p-4 rounded-2xl mb-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className="text-base font-bold text-zinc-900 dark:text-white flex-1 mr-2"
          numberOfLines={1}
        >
          {record.name}
        </Text>
        <TouchableOpacity
          onPress={() => deleteRecord(record.id)}
          className="bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900"
        >
          <Text className="text-red-500 text-xs font-bold">
            {t("delete", "Eliminar")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between mb-1">
        <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
          {t("cuentas_bill_total", "Total Factura")}: {currency}
          {record.billTotal}
        </Text>
        <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
          {t("cuentas_tip", "Propina %")}: {record.tipPercent}%
        </Text>
      </View>

      <View className="flex-row justify-between items-end mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
          {record.peopleCount} {t("cuentas_people", "Personas")}
        </Text>
        <View className="items-end">
          <Text className="text-zinc-400 text-[11px]">
            {t("cuentas_each_pays", "Cada Uno Paga")}
          </Text>
          <Text className="text-xl font-black text-amber-700 dark:text-amber-400">
            {currency}
            {record.eachPays.toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("back", "Volver")}
          className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <ChevronLeft color={accentHex} size={22} />
        </TouchableOpacity>
        <Text className="text-lg font-black text-zinc-900 dark:text-white">
          {t("cuentas_history", "Historial")}
        </Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={confirmClear} className="p-2">
            <Text className="text-red-500 font-bold text-xs">
              {t("clear", "Borrar")}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <Text className="text-zinc-500 dark:text-zinc-400 text-center mt-10 text-sm">
            {t("cuentas_no_history", "No hay cuentas guardadas.")}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

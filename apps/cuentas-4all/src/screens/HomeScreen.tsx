import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { useAccountsStore } from "../store/useAccountsStore";
import { Button4All, SettingsModal4All } from "@apps4all/ui-components";
import {
  Receipt,
  Users,
  Plus,
  Minus,
  Trash2,
  Settings,
  Coins,
  UserPlus,
  X,
} from "lucide-react-native";

const CURRENCIES = ["$", "€", "£", "R$", "Bs"];
const QUICK_TIPS = ["0", "5", "10", "15", "20"];
const ROUNDING_VALUES: Array<"none" | "10" | "100" | "500" | "1000"> = [
  "none",
  "10",
  "100",
  "500",
  "1000",
];

interface ItemizedDish {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
}

export default function HomeScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string) => void };
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#FBBF24" : "#B45309";
  const mutedHex = isDark ? "#A1A1AA" : "#71717A";

  const {
    currency,
    setCurrency,
    enableTax,
    taxRate,
    setTaxSettings,
    roundingMode,
    setRoundingMode,
    savedDiners,
    addSavedDiner,
    removeSavedDiner,
    saveRecord,
  } = useAccountsStore();

  const [splitMode, setSplitMode] = useState<"simple" | "itemized">("simple");

  // Simple Mode Inputs
  const [billAmount, setBillAmount] = useState("");
  const [tipPercent, setTipPercent] = useState("10");
  const [people, setPeople] = useState("2");
  const [billName, setBillName] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Itemized Mode Inputs (Quick Diners + Shared Dishes)
  const [newDinerInput, setNewDinerInput] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [selectedDinersForDish, setSelectedDinersForDish] = useState<string[]>(
    [],
  );
  const [dishes, setDishes] = useState<ItemizedDish[]>([]);

  const applyRounding = (val: number) => {
    if (roundingMode === "none") return val;
    const factor = parseInt(roundingMode, 10);
    return Math.ceil(val / factor) * factor;
  };

  // Simple Calculations
  const numBill = parseFloat(billAmount.replace(",", ".")) || 0;
  const numTip = parseFloat(tipPercent.replace(",", ".")) || 0;
  const numPeople = Math.max(parseInt(people, 10) || 1, 1);

  const taxAmount = enableTax ? (numBill * taxRate) / 100 : 0;
  const subtotal = numBill + taxAmount;
  const tipAmount = (subtotal * numTip) / 100;
  const rawFinalTotal = subtotal + tipAmount;
  const rawEachPays = numPeople > 0 ? rawFinalTotal / numPeople : 0;
  const roundedEachPays = applyRounding(rawEachPays);
  const roundedFinalTotal = roundedEachPays * numPeople;

  // Itemized Calculations
  const itemizedSummary = useMemo(() => {
    const rawSubtotal = dishes.reduce((sum, d) => sum + d.price, 0);
    const itemTax = enableTax ? (rawSubtotal * taxRate) / 100 : 0;
    const itemWithTax = rawSubtotal + itemTax;
    const itemTip = (itemWithTax * numTip) / 100;
    const itemFinalTotal = itemWithTax + itemTip;

    const multiplier = rawSubtotal > 0 ? itemFinalTotal / rawSubtotal : 1;

    const personTotals: Record<
      string,
      { raw: number; rounded: number; items: string[] }
    > = {};

    const everyoneLabel = t("cuentas_everyone", "Todos");

    dishes.forEach((d) => {
      const splitAmong =
        d.assignedTo.length > 0 ? d.assignedTo : [everyoneLabel];
      const pricePerPerson = d.price / splitAmong.length;

      splitAmong.forEach((name) => {
        const trimmed = name.trim() || everyoneLabel;
        if (!personTotals[trimmed]) {
          personTotals[trimmed] = { raw: 0, rounded: 0, items: [] };
        }
        personTotals[trimmed].raw += pricePerPerson * multiplier;
        personTotals[trimmed].items.push(
          splitAmong.length > 1
            ? `${d.name} (1/${splitAmong.length})`
            : d.name,
        );
      });
    });

    Object.keys(personTotals).forEach((k) => {
      personTotals[k].rounded = applyRounding(personTotals[k].raw);
    });

    return {
      subtotal: rawSubtotal,
      finalTotal: itemFinalTotal,
      persons: personTotals,
    };
  }, [dishes, enableTax, taxRate, numTip, roundingMode, t]);

  const handleAddDiner = () => {
    const trimmed = newDinerInput.trim();
    if (!trimmed) return;
    addSavedDiner(trimmed);
    setSelectedDinersForDish((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );
    setNewDinerInput("");
  };

  const toggleDinerSelection = (name: string) => {
    setSelectedDinersForDish((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name],
    );
  };

  const handleAddDish = () => {
    const priceNum = parseFloat(newItemPrice.replace(",", "."));
    if (!newItemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const assigned =
      selectedDinersForDish.length > 0
        ? selectedDinersForDish
        : savedDiners.length > 0
          ? [...savedDiners]
          : [t("cuentas_everyone", "Todos")];

    setDishes((prev) => [
      ...prev,
      {
        id:
          "dish-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 6),
        name: newItemName.trim(),
        price: priceNum,
        assignedTo: assigned,
      },
    ]);

    setNewItemName("");
    setNewItemPrice("");
  };

  const handleRemoveDish = (id: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const handleShare = async () => {
    let msg = "";
    const title = billName
      ? `🍽️ ${billName}\n`
      : `🧾 ${t("cuentas_title", "Cuentas 4All")}\n`;

    if (splitMode === "simple") {
      if (rawFinalTotal === 0) return;
      msg = `${title}---------------------\n`;
      msg += `• ${t("cuentas_share_text_1", "Total Factura")}: ${currency}${numBill.toFixed(2)}\n`;
      if (enableTax) {
        msg += `• ${t("cuentas_tax_short", "Impuesto")} (${taxRate}%): ${currency}${taxAmount.toFixed(2)}\n`;
      }
      msg += `• ${t("cuentas_share_text_2", "Propina")} (${numTip}%): ${currency}${tipAmount.toFixed(2)}\n`;
      msg += `• ${t("cuentas_share_text_3", "Total Final")}: ${currency}${roundedFinalTotal.toFixed(0)}\n`;
      msg += `• ${t("cuentas_share_text_4", "Personas")}: ${numPeople}\n`;
      msg += `👉 ${t("cuentas_share_text_5", "Cada uno paga")}: ${currency}${roundedEachPays.toFixed(0)}\n\n`;
    } else {
      if (itemizedSummary.finalTotal === 0) return;
      msg = `${title}---------------------\n`;
      msg += `${t("cuentas_itemized", "Desglose Individual")}:\n`;
      Object.entries(itemizedSummary.persons).forEach(([person, data]) => {
        msg += `• ${person}: ${currency}${data.rounded.toFixed(0)}\n`;
      });
      msg += `---------------------\n`;
      msg += `${t("cuentas_final_total", "Total Final")}: ${currency}${itemizedSummary.finalTotal.toFixed(0)}\n\n`;
    }

    msg += t("cuentas_share_footer", "Generado en Cuentas 4All");

    try {
      await Share.share({ message: msg });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleSave = () => {
    const totalToSave =
      splitMode === "simple" ? roundedFinalTotal : itemizedSummary.finalTotal;
    const peopleCountToSave =
      splitMode === "simple"
        ? numPeople
        : Math.max(Object.keys(itemizedSummary.persons).length, 1);
    const eachToSave =
      splitMode === "simple"
        ? roundedEachPays
        : totalToSave / peopleCountToSave;
    if (totalToSave === 0) return;

    saveRecord({
      name:
        billName.trim() ||
        (splitMode === "itemized"
          ? t("cuentas_itemized", "Desglose Individual")
          : t("cuentas_title", "Cuentas 4All")),
      billTotal: splitMode === "simple" ? numBill : itemizedSummary.subtotal,
      tipPercent: numTip,
      peopleCount: peopleCountToSave,
      finalTotal: totalToSave,
      eachPays: eachToSave,
    });
    Alert.alert(
      t("cuentas_saved_title", "Guardado"),
      t("cuentas_saved_desc", "La cuenta fue guardada en tu historial local."),
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-row items-center flex-1 mr-2">
            <Receipt color={accentHex} size={23} />
            <Text
              className="text-xl font-black text-zinc-900 dark:text-white ml-2"
              numberOfLines={1}
            >
              {t("cuentas_title", "Cuentas 4All")}
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Configuración")}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <Settings color={accentHex} size={19} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("History")}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("cuentas_history", "Historial")}
              className="px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-400/10"
            >
              <Text className="text-amber-700 dark:text-amber-400 font-bold text-xs">
                {t("cuentas_history", "Historial")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Quick Selector Bar */}
        <View className="px-5 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between">
          <Text className="text-xs uppercase font-bold text-zinc-400">
            {t("cuentas_currency", "Divisa")}:
          </Text>
          <View className="flex-row gap-1.5">
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                onPress={() => setCurrency(curr)}
                className={`px-3 py-1.5 rounded-xl border ${
                  currency === curr
                    ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <Text
                  className={`font-black text-xs ${
                    currency === curr
                      ? "text-white dark:text-zinc-950"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Mode Selector (Simple vs Itemized) */}
        <View className="px-5 py-3 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSplitMode("simple")}
            className={`flex-1 py-2.5 rounded-2xl items-center border ${
              splitMode === "simple"
                ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                splitMode === "simple"
                  ? "text-white dark:text-zinc-950"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t("cuentas_simple", "División Simple")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSplitMode("itemized")}
            className={`flex-1 py-2.5 rounded-2xl items-center border ${
              splitMode === "itemized"
                ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                splitMode === "itemized"
                  ? "text-white dark:text-zinc-950"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t("cuentas_itemized", "Desglose Individual")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          {/* Output Hero Card */}
          {splitMode === "simple" ? (
            <View className="bg-amber-500/10 dark:bg-amber-400/10 rounded-3xl p-5 my-2 items-center border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
              <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1">
                {t("cuentas_each_pays", "Cada Uno Paga")}
              </Text>
              <Text
                className="text-5xl font-black text-amber-700 dark:text-amber-400 mb-3"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currency}
                {roundedEachPays.toLocaleString()}
              </Text>
              <View className="w-full flex-row justify-between items-center pt-3 border-t border-amber-500/20">
                <Text className="text-zinc-600 dark:text-zinc-300 font-medium text-sm">
                  {t("cuentas_final_total", "Total Final")}:
                </Text>
                <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                  {currency}
                  {roundedFinalTotal.toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-amber-500/10 dark:bg-amber-400/10 rounded-3xl p-5 my-2 border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400">
                  {t("cuentas_final_total", "Total Final")}
                </Text>
                <Text className="text-2xl font-black text-zinc-900 dark:text-white">
                  {currency}
                  {itemizedSummary.finalTotal.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>

              {Object.keys(itemizedSummary.persons).length === 0 ? (
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-amber-500/20">
                  {t(
                    "cuentas_itemized_empty",
                    "Añade platos abajo y toca quién los consumió o compartió.",
                  )}
                </Text>
              ) : (
                <View className="gap-2 pt-2 border-t border-amber-500/20">
                  {Object.entries(itemizedSummary.persons).map(
                    ([name, data]) => (
                      <View
                        key={name}
                        className="flex-row justify-between items-center py-1"
                      >
                        <View className="flex-1 mr-2">
                          <Text className="font-bold text-zinc-900 dark:text-white">
                            {name}
                          </Text>
                          <Text
                            className="text-zinc-500 dark:text-zinc-400 text-xs"
                            numberOfLines={1}
                          >
                            {data.items.join(", ")}
                          </Text>
                        </View>
                        <Text className="font-black text-amber-700 dark:text-amber-400 text-base">
                          {currency}
                          {data.rounded.toLocaleString()}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              )}
            </View>
          )}

          {/* MODE 1: SIMPLE SPLIT INPUTS (Ultra-fast restaurant flow) */}
          {splitMode === "simple" && (
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 my-3 shadow-sm">
              <Text className="text-zinc-500 mb-1 font-bold text-xs uppercase">
                {t("cuentas_bill_total", "Total Factura")}
              </Text>
              <View className="flex-row items-center bg-zinc-50 dark:bg-zinc-950 rounded-2xl px-4 mb-4 border border-zinc-200 dark:border-zinc-800">
                <Text className="text-2xl text-zinc-400 mr-2 font-mono">
                  {currency}
                </Text>
                <TextInput
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#a1a1aa"
                  className="flex-1 text-2xl font-black text-zinc-900 dark:text-white py-3"
                />
              </View>

              {/* Quick 1-Tap Tip Selector */}
              <Text className="text-zinc-500 mb-1.5 font-bold text-xs uppercase">
                {t("cuentas_tip", "Propina %")}
              </Text>
              <View className="flex-row gap-1.5 mb-4">
                {QUICK_TIPS.map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    onPress={() => setTipPercent(pct)}
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      tipPercent === pct
                        ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-black ${
                        tipPercent === pct
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* People Stepper (- / count / +) */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Users color={accentHex} size={18} />
                  <Text className="text-zinc-500 ml-2 font-bold text-xs uppercase">
                    {t("cuentas_people", "Personas")}
                  </Text>
                </View>

                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() =>
                      setPeople(String(Math.max(1, numPeople - 1)))
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="-1"
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200 dark:border-zinc-700"
                  >
                    <Minus color={accentHex} size={18} />
                  </TouchableOpacity>
                  <Text className="text-2xl font-black text-zinc-900 dark:text-white font-mono w-10 text-center">
                    {numPeople}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPeople(String(numPeople + 1))}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="+1"
                    className="w-10 h-10 rounded-xl bg-amber-700 dark:bg-amber-400 items-center justify-center"
                  >
                    <Plus color={isDark ? "#09090b" : "#fff"} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-zinc-500 mb-1 font-bold text-xs uppercase">
                {t("cuentas_desc_optional", "Descripción (Opcional)")}
              </Text>
              <TextInput
                value={billName}
                onChangeText={setBillName}
                placeholder={t(
                  "cuentas_name_placeholder",
                  "Ej. Cena Cumpleaños",
                )}
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800"
              />
            </View>
          )}

          {/* MODE 2: ITEMIZED SPLIT WITH SAVED DINERS & SHARED DISHES */}
          {splitMode === "itemized" && (
            <View className="my-3">
              {/* Saved Diners Bar */}
              <View className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 mb-3 shadow-sm">
                <View className="flex-row items-center mb-2.5">
                  <UserPlus color={accentHex} size={16} />
                  <Text className="text-xs font-bold text-zinc-500 uppercase ml-1.5">
                    {t("cuentas_diners_title", "Comensales en la Mesa")}
                  </Text>
                </View>

                <View className="flex-row gap-2 mb-3">
                  <TextInput
                    value={newDinerInput}
                    onChangeText={setNewDinerInput}
                    onSubmitEditing={handleAddDiner}
                    placeholder={t("cuentas_add_diner_ph", "Ej. Ana, Carlos...")}
                    placeholderTextColor="#a1a1aa"
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800"
                  />
                  <TouchableOpacity
                    onPress={handleAddDiner}
                    className="px-4 rounded-xl bg-amber-700 dark:bg-amber-400 items-center justify-center"
                  >
                    <Plus color={isDark ? "#09090b" : "#fff"} size={18} />
                  </TouchableOpacity>
                </View>

                {savedDiners.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedDinersForDish([...savedDiners])}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {t("cuentas_everyone", "Todos")}
                      </Text>
                    </TouchableOpacity>

                    {savedDiners.map((diner) => {
                      const isPicked = selectedDinersForDish.includes(diner);
                      return (
                        <View
                          key={diner}
                          className={`flex-row items-center rounded-full border pl-3 pr-1.5 py-1 ${
                            isPicked
                              ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                              : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          <TouchableOpacity
                            onPress={() => toggleDinerSelection(diner)}
                            className="pr-1.5"
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isPicked
                                  ? "text-white dark:text-zinc-950"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {diner}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              removeSavedDiner(diner);
                              setSelectedDinersForDish((prev) =>
                                prev.filter((d) => d !== diner),
                              );
                            }}
                            className="p-0.5"
                          >
                            <X
                              color={
                                isPicked
                                  ? isDark
                                    ? "#09090b"
                                    : "#fff"
                                  : mutedHex
                              }
                              size={12}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Add Dish Card */}
              <View className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 mb-3 shadow-sm">
                <Text className="text-sm font-bold text-zinc-900 dark:text-white mb-2.5">
                  {t("cuentas_add_item", "Añadir Ítem / Plato")}
                </Text>

                <TextInput
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholder={t(
                    "cuentas_item_name",
                    "Nombre del plato o bebida",
                  )}
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 mb-2.5"
                />

                <View className="flex-row gap-2.5">
                  <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl px-4 py-2 border border-zinc-200 dark:border-zinc-800 flex-row items-center">
                    <Text className="text-zinc-400 mr-2 font-bold">
                      {currency}
                    </Text>
                    <TextInput
                      value={newItemPrice}
                      onChangeText={setNewItemPrice}
                      keyboardType="numeric"
                      placeholder={t("cuentas_item_price", "Precio")}
                      placeholderTextColor="#a1a1aa"
                      className="flex-1 text-lg font-bold text-zinc-900 dark:text-white"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleAddDish}
                    className="bg-amber-700 dark:bg-amber-400 rounded-2xl px-5 items-center justify-center shadow-sm"
                  >
                    <Plus color={isDark ? "#09090b" : "#fff"} size={22} />
                  </TouchableOpacity>
                </View>

                {selectedDinersForDish.length > 1 && (
                  <Text className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-2">
                    {t("cuentas_shared_hint", {
                      count: selectedDinersForDish.length,
                      defaultValue:
                        "Plato compartido: se dividirá en {{count}} partes iguales.",
                    })}
                  </Text>
                )}
              </View>

              {/* List of Dishes */}
              {dishes.length > 0 && (
                <View className="mb-3">
                  <Text className="text-xs uppercase font-bold text-zinc-400 mb-2">
                    {t("cuentas_dishes_count", {
                      count: dishes.length,
                      defaultValue: "Platos Registrados ({{count}})",
                    })}
                  </Text>
                  {dishes.map((dish) => (
                    <View
                      key={dish.id}
                      className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl mb-2 flex-row justify-between items-center border border-zinc-200 dark:border-zinc-800"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="font-bold text-zinc-900 dark:text-white text-sm">
                          {dish.name}
                        </Text>
                        <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
                          {dish.assignedTo.join(" • ")}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2.5">
                        <Text className="font-black text-amber-700 dark:text-amber-400 text-sm">
                          {currency}
                          {dish.price.toLocaleString()}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveDish(dish.id)}
                          className="p-1.5"
                        >
                          <Trash2 color="#ef4444" size={17} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Tip Bar for Itemized */}
              <View className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Text className="text-zinc-500 mb-1.5 font-bold text-xs uppercase">
                  {t("cuentas_tip", "Propina %")}
                </Text>
                <View className="flex-row gap-1.5">
                  {QUICK_TIPS.map((pct) => (
                    <TouchableOpacity
                      key={pct}
                      onPress={() => setTipPercent(pct)}
                      className={`flex-1 py-2 rounded-xl items-center border ${
                        tipPercent === pct
                          ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          tipPercent === pct
                            ? "text-white dark:text-zinc-950"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Cash Rounding Options */}
          <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Coins color={accentHex} size={18} />
                <Text className="text-xs uppercase font-bold text-zinc-500 ml-2">
                  {t("cuentas_rounding", "Redondeo de Efectivo")}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-1.5">
              {ROUNDING_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setRoundingMode(val)}
                  className={`flex-1 py-2 items-center rounded-xl border ${
                    roundingMode === val
                      ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      roundingMode === val
                        ? "text-white dark:text-zinc-950"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {val === "none"
                      ? t("cuentas_no_rounding", "Exacto")
                      : `${currency}${val}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-10">
            <Button4All
              label={t("cuentas_share", "Compartir")}
              onPress={handleShare}
              className="flex-1"
            />
            <Button4All
              label={t("cuentas_save", "Guardar en Historial")}
              onPress={handleSave}
              variant="outline"
              className="flex-1"
            />
          </View>
        </ScrollView>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName={t("cuentas_title", "Cuentas 4All")}
          accentColor={accentHex}
          i18nInstance={i18n}
          appSpecificSection={
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                    {t("cuentas_tax_toggle", "Incluir Impuesto (IVA / Tax)")}
                  </Text>
                  <Text className="text-xs text-zinc-400 mt-0.5">
                    {t(
                      "cuentas_tax_desc",
                      "Calcula el impuesto antes de aplicar la propina",
                    )}
                  </Text>
                </View>
                <Switch
                  value={enableTax}
                  onValueChange={(val) => setTaxSettings(val, taxRate)}
                  trackColor={{ false: "#71717a", true: "#b45309" }}
                />
              </View>
              {enableTax && (
                <View className="flex-row items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("cuentas_tax_rate", "Tasa de Impuesto (%)")}:
                  </Text>
                  <TextInput
                    value={taxRate.toString()}
                    onChangeText={(val) =>
                      setTaxSettings(enableTax, parseFloat(val) || 0)
                    }
                    keyboardType="numeric"
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-1.5 rounded-xl text-xs font-bold text-center w-20 border border-zinc-200 dark:border-zinc-700"
                  />
                </View>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import { useMeasuresStore, RecentConversion } from "../store/useMeasuresStore";
import { Category, UNITS, convert } from "../engine/unitsEngine";
import {
  ChevronDown,
  ArrowRightLeft,
  Scale,
  Settings,
  Check,
  Copy,
  History,
  Star,
  Search,
  X,
  Ruler,
  Thermometer,
  Droplets,
  Gauge,
  Square,
  HardDrive,
  Clock,
  Wind,
  Zap,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

const CATEGORIES: {
  id: Category;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  nameKey: string;
}[] = [
  { id: "length", Icon: Ruler, nameKey: "medidas_cat_length" },
  { id: "weight", Icon: Scale, nameKey: "medidas_cat_weight" },
  { id: "temp", Icon: Thermometer, nameKey: "medidas_cat_temp" },
  { id: "volume", Icon: Droplets, nameKey: "medidas_cat_volume" },
  { id: "speed", Icon: Gauge, nameKey: "medidas_cat_speed" },
  { id: "area", Icon: Square, nameKey: "medidas_cat_area" },
  { id: "digital", Icon: HardDrive, nameKey: "medidas_cat_digital" },
  { id: "time", Icon: Clock, nameKey: "medidas_cat_time" },
  { id: "pressure", Icon: Wind, nameKey: "medidas_cat_pressure" },
  { id: "energy", Icon: Zap, nameKey: "medidas_cat_energy" },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#FBBF24" : "#B45309";
  const mutedHex = isDark ? "#A1A1AA" : "#71717A";

  const { recent, favorites, saveRecent, clearRecent, toggleFavorite } =
    useMeasuresStore();

  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState(UNITS["length"][0].id);
  const [toUnit, setToUnit] = useState(UNITS["length"][1].id);
  const [inputValue, setInputValue] = useState("1");
  const [copied, setCopied] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Unit Selector Modal + search
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"from" | "to">("from");
  const [unitSearch, setUnitSearch] = useState("");

  const handleSelectCategory = (newCat: Category) => {
    setCategory(newCat);
    const list = UNITS[newCat];
    setFromUnit(list[0].id);
    setToUnit(list[1].id);
    setCopied(false);
  };

  const handleRestorePair = (pair: RecentConversion) => {
    setCategory(pair.category);
    setFromUnit(pair.fromId);
    setToUnit(pair.toId);
    setCopied(false);
  };

  const handleSwap = () => {
    const prevFrom = fromUnit;
    const prevTo = toUnit;
    setFromUnit(prevTo);
    setToUnit(prevFrom);
    saveRecent({ category, fromId: prevTo, toId: prevFrom });
    setCopied(false);
  };

  const handleSelectUnit = (id: string) => {
    if (selectingSide === "from") {
      if (id === toUnit) setToUnit(fromUnit);
      setFromUnit(id);
      saveRecent({
        category,
        fromId: id,
        toId: id === toUnit ? fromUnit : toUnit,
      });
    } else {
      if (id === fromUnit) setFromUnit(toUnit);
      setToUnit(id);
      saveRecent({
        category,
        fromId: id === fromUnit ? toUnit : fromUnit,
        toId: id,
      });
    }
    setIsModalVisible(false);
    setUnitSearch("");
    setCopied(false);
  };

  const numInput = parseFloat(inputValue.replace(",", ".")) || 0;
  const result = convert(numInput, fromUnit, toUnit, category);

  const formatResult = (val: number) => {
    if (val === 0) return "0";
    const absVal = Math.abs(val);
    if (absVal < 0.00001 || absVal > 10000000) return val.toExponential(4);
    const str = val.toString();
    if (str.includes(".")) {
      return parseFloat(val.toFixed(6)).toString();
    }
    return str;
  };

  const cats = UNITS[category];
  const activeFromUnit = cats.find((u) => u.id === fromUnit);
  const activeToUnit = cats.find((u) => u.id === toUnit);

  const isCurrentFavorite = (favorites || []).some(
    (f) => f.category === category && f.fromId === fromUnit && f.toId === toUnit,
  );

  const filteredModalUnits = useMemo(() => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter(
      (u) =>
        u.symbol.toLowerCase().includes(q) ||
        t(u.nameKey, u.nameKey).toLowerCase().includes(q),
    );
  }, [cats, unitSearch, t]);

  const handleCopyResult = async () => {
    const formatted = `${formatResult(result)} ${activeToUnit?.symbol || ""}`;
    await Clipboard.setStringAsync(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryLabel = (catId: Category) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? t(found.nameKey, catId) : catId;
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
        <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-row items-center flex-1 mr-2">
            <Scale color={accentHex} size={23} />
            <Text
              className="text-xl font-black text-zinc-900 dark:text-white ml-2"
              numberOfLines={1}
            >
              {t("medidas_title", "Medidas 4All")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("settings", "Configuración")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Settings color={accentHex} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Category Pills Bar (10 offline categories) */}
          <View className="pt-4 pb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {CATEGORIES.map((cat) => {
                const IconComp = cat.Icon;
                const isActive = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t(cat.nameKey, cat.id)}
                    className={`px-3.5 py-2.5 rounded-2xl border flex-row items-center ${
                      isActive
                        ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <View className="mr-1.5">
                      <IconComp
                        size={15}
                        color={isActive ? (isDark ? "#09090b" : "#ffffff") : accentHex}
                      />
                    </View>
                    <Text
                      className={`font-bold text-xs ${
                        isActive
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {t(cat.nameKey, cat.id)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Converter Main Hero Card */}
          <View className="px-5 py-3">
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
              {/* FROM UNIT ROW */}
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    {t("medidas_from", "De")}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      toggleFavorite({ category, fromId: fromUnit, toId: toUnit })
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("medidas_favorite", "Favorito")}
                    className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  >
                    <Star
                      size={16}
                      color={isCurrentFavorite ? accentHex : mutedHex}
                      fill={isCurrentFavorite ? accentHex : "none"}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectingSide("from");
                      setUnitSearch("");
                      setIsModalVisible(true);
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      "medidas_select_from",
                      "Seleccionar unidad de origen",
                    )}
                    className="flex-row items-center flex-1 mr-4 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700"
                  >
                    <Text className="text-xl font-black text-zinc-900 dark:text-white mr-2">
                      {activeFromUnit?.symbol}
                    </Text>
                    <ChevronDown size={18} color="#a1a1aa" />
                  </TouchableOpacity>

                  <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#a1a1aa"
                    className="flex-1 text-right text-3xl font-black text-amber-700 dark:text-amber-400 font-mono py-1"
                  />
                </View>
              </View>

              {/* INTERACTIVE SWAP BUTTON */}
              <View className="items-center -my-3 z-10">
                <TouchableOpacity
                  onPress={handleSwap}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "medidas_swap",
                    "Invertir unidades de conversión",
                  )}
                  className="w-12 h-12 bg-amber-700 dark:bg-amber-400 rounded-full items-center justify-center border-4 border-white dark:border-zinc-900 shadow-md"
                >
                  <ArrowRightLeft size={18} color={isDark ? "#09090b" : "#fff"} />
                </TouchableOpacity>
              </View>

              {/* TO UNIT ROW */}
              <View className="mt-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    {t("medidas_to", "A")}
                  </Text>

                  <TouchableOpacity
                    onPress={handleCopyResult}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("copy", "Copiar")}
                    className="flex-row items-center bg-amber-500/10 dark:bg-amber-400/10 px-3 py-1.5 rounded-xl"
                  >
                    {copied ? (
                      <>
                        <Check size={14} color={accentHex} />
                        <Text className="text-xs font-bold text-amber-800 dark:text-amber-400 ml-1">
                          {t("copied", "¡Copiado!")}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color={accentHex} />
                        <Text className="text-xs font-bold text-amber-800 dark:text-amber-400 ml-1">
                          {t("copy", "Copiar")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectingSide("to");
                      setUnitSearch("");
                      setIsModalVisible(true);
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      "medidas_select_to",
                      "Seleccionar unidad de destino",
                    )}
                    className="flex-row items-center flex-1 mr-4 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700"
                  >
                    <Text className="text-xl font-black text-zinc-900 dark:text-white mr-2">
                      {activeToUnit?.symbol}
                    </Text>
                    <ChevronDown size={18} color="#a1a1aa" />
                  </TouchableOpacity>

                  <Text
                    className="flex-1 text-right text-3xl font-black text-zinc-900 dark:text-white font-mono"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatResult(result)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Favorites Section */}
          {favorites && favorites.length > 0 && (
            <View className="px-5 pt-3">
              <View className="flex-row items-center mb-2.5">
                <Star size={15} color={accentHex} fill={accentHex} />
                <Text className="ml-2 font-bold text-xs uppercase text-zinc-400 tracking-wider">
                  {t("medidas_favorites", "Favoritas")}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              >
                {favorites.map((fav) => {
                  const fCats = UNITS[fav.category] || [];
                  const fromU = fCats.find((u) => u.id === fav.fromId);
                  const toU = fCats.find((u) => u.id === fav.toId);
                  return (
                    <TouchableOpacity
                      key={fav.id}
                      onPress={() => handleRestorePair(fav)}
                      className="bg-amber-500/10 dark:bg-amber-400/10 px-3.5 py-2 rounded-2xl border border-amber-500/30 flex-row items-center"
                    >
                      <Text className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                        {fromU?.symbol} → {toU?.symbol}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Recents History */}
          <View className="px-5 pt-4 pb-12">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <History size={16} color={mutedHex} />
                <Text className="ml-2 font-bold text-xs uppercase text-zinc-400 tracking-wider">
                  {t("medidas_recent", "Conversiones Recientes")}
                </Text>
              </View>
              {recent.length > 0 && (
                <TouchableOpacity onPress={clearRecent} className="p-1">
                  <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold">
                    {t("clear", "Borrar")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {recent.length === 0 ? (
              <Text className="text-zinc-400 dark:text-zinc-600 text-xs py-2">
                {t("medidas_no_recent", "No hay conversiones recientes.")}
              </Text>
            ) : (
              recent.slice(0, 6).map((rec) => {
                const rCats = UNITS[rec.category] || [];
                const fromU = rCats.find((u) => u.id === rec.fromId);
                const toU = rCats.find((u) => u.id === rec.toId);
                return (
                  <TouchableOpacity
                    key={rec.id}
                    onPress={() => handleRestorePair(rec)}
                    className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl mb-2 flex-row justify-between items-center border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <Text className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                      {fromU?.symbol} → {toU?.symbol}
                    </Text>
                    <Text className="text-zinc-400 text-xs uppercase font-bold">
                      {getCategoryLabel(rec.category)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Unit Selector Modal with Instant Search */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior="padding"
            className="flex-1 justify-end bg-black/55"
          >
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-14 max-h-[75%]">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-black text-zinc-900 dark:text-white">
                  {t("medidas_select_unit", "Seleccionar Unidad")}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  className="p-2"
                >
                  <X color={mutedHex} size={20} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3.5 py-2 mb-3">
                <Search color={mutedHex} size={16} />
                <TextInput
                  value={unitSearch}
                  onChangeText={setUnitSearch}
                  placeholder={t("medidas_search_unit_ph", "Buscar unidad...")}
                  placeholderTextColor="#a1a1aa"
                  className="flex-1 ml-2 text-sm text-zinc-900 dark:text-white"
                />
                {unitSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setUnitSearch("")}
                    className="p-1"
                  >
                    <X color={mutedHex} size={15} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredModalUnits.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => handleSelectUnit(u.id)}
                    className="py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-row justify-between items-center"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-lg font-black text-amber-700 dark:text-amber-400 mr-3 w-16">
                        {u.symbol}
                      </Text>
                      <Text className="text-zinc-800 dark:text-zinc-200 text-base">
                        {t(u.nameKey, u.nameKey)}
                      </Text>
                    </View>
                    {((selectingSide === "from" && fromUnit === u.id) ||
                      (selectingSide === "to" && toUnit === u.id)) && (
                      <Check color={accentHex} size={18} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName={t("medidas_title", "Medidas 4All")}
          accentColor={accentHex}
          i18nInstance={i18n}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

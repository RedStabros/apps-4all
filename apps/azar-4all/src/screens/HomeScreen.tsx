import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { useAzarStore } from "../store/useAzarStore";
import { format } from "date-fns";
import { Badge4All, SettingsModal4All, Button4All } from "@apps4all/ui-components";
import * as Haptics from "expo-haptics";
import { Sparkles, Settings, Disc3, Trophy } from "lucide-react-native";

type Mode = "dice" | "coin" | "number" | "list" | "teams" | "wheel";

const WHEEL_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentHex = isDark ? "#FBBF24" : "#B45309";

  const { history, listItems, setListItems, addHistory, clearHistory } =
    useAzarStore();
  const [mode, setMode] = useState<Mode>("dice");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Standard States
  const [minNum, setMinNum] = useState("1");
  const [maxNum, setMaxNum] = useState("100");
  const [listInput, setListInput] = useState("");
  const [currentResult, setCurrentResult] = useState<string | number>("-");

  // Teams State
  const [teamCount, setTeamCount] = useState("2");
  const [generatedTeams, setGeneratedTeams] = useState<string[][]>([]);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  const triggerHaptic = (
    type: "light" | "medium" | "success" | "heavy" = "medium",
  ) => {
    try {
      if (type === "light")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === "medium")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === "heavy")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (type === "success")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  };

  const rollDice = (sides: number, count: number = 1) => {
    triggerHaptic("heavy");
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    setCurrentResult(total);
    addHistory({ type: "dice", result: total, details: `${count}D${sides}` });
  };

  const flipCoin = () => {
    triggerHaptic("medium");
    const isHeads = Math.random() < 0.5;
    const resultText = isHeads
      ? t("azar_heads", "Cara")
      : t("azar_tails", "Cruz");
    setCurrentResult(resultText);
    addHistory({
      type: "coin",
      result: resultText,
      details: t("azar_coin", "Moneda"),
    });
  };

  const generateNumber = () => {
    const min = parseInt(minNum, 10);
    const max = parseInt(maxNum, 10);
    if (isNaN(min) || isNaN(max) || min > max) return;
    triggerHaptic("success");
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    setCurrentResult(result);
    addHistory({ type: "number", result, details: `${min}-${max}` });
  };

  const addToList = () => {
    if (listInput.trim() !== "") {
      triggerHaptic("light");
      setListItems([...listItems, listInput.trim()]);
      setListInput("");
    }
  };

  const removeFromList = (index: number) => {
    triggerHaptic("light");
    setListItems(listItems.filter((_, i) => i !== index));
  };

  const drawFromList = () => {
    if (listItems.length === 0) return;
    triggerHaptic("success");
    const index = Math.floor(Math.random() * listItems.length);
    const result = listItems[index];
    setCurrentResult(result);
    addHistory({
      type: "list",
      result,
      details: t("azar_options_count", { count: listItems.length }),
    });
  };

  const divideIntoTeams = () => {
    const num = parseInt(teamCount, 10);
    if (isNaN(num) || num <= 1 || listItems.length < num) return;
    triggerHaptic("success");

    const shuffled = [...listItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const teams: string[][] = Array.from({ length: num }, () => []);
    shuffled.forEach((item, index) => {
      teams[index % num].push(item);
    });

    setGeneratedTeams(teams);
    const label = `${num} ${t("azar_teams", "Equipos")}`;
    setCurrentResult(label);
    addHistory({
      type: "teams",
      result: label,
      details: t("azar_options_count", { count: listItems.length }),
    });
  };

  const spinWheel = () => {
    if (listItems.length === 0 || isSpinning) return;
    setIsSpinning(true);
    triggerHaptic("heavy");

    const winnerIndex = Math.floor(Math.random() * listItems.length);
    const degreesPerSegment = 360 / listItems.length;
    const stopAngle =
      ((listItems.length - winnerIndex) % listItems.length) * degreesPerSegment;
    const additionalTurns = 5 * 360;

    spinValue.setValue(currentRotation.current);
    const targetAngle = currentRotation.current + additionalTurns + stopAngle;

    Animated.timing(spinValue, {
      toValue: targetAngle,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentRotation.current = targetAngle % 360;
      spinValue.setValue(currentRotation.current);
      setIsSpinning(false);
      triggerHaptic("success");
      const winner = listItems[winnerIndex];
      setCurrentResult(winner);
      addHistory({
        type: "wheel",
        result: winner,
        details: `${t("azar_wheel", "Ruleta")} (${listItems.length})`,
      });
    });
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

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
        <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <View className="flex-row items-center flex-1 mr-2">
            <Sparkles color={accentHex} size={22} />
            <Text
              className="text-xl font-black text-zinc-900 dark:text-white ml-2"
              numberOfLines={1}
            >
              {t("azar_title", "Azar 4All")}
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

        {/* Tabs */}
        <View className="py-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            <Badge4All
              label={t("azar_dice", "Dados")}
              active={mode === "dice"}
              onPress={() => {
                triggerHaptic("light");
                setMode("dice");
              }}
            />
            <Badge4All
              label={t("azar_coin", "Moneda")}
              active={mode === "coin"}
              onPress={() => {
                triggerHaptic("light");
                setMode("coin");
              }}
            />
            <Badge4All
              label={t("azar_numbers", "Números")}
              active={mode === "number"}
              onPress={() => {
                triggerHaptic("light");
                setMode("number");
              }}
            />
            <Badge4All
              label={t("azar_list", "Lista")}
              active={mode === "list"}
              onPress={() => {
                triggerHaptic("light");
                setMode("list");
              }}
            />
            <Badge4All
              label={t("azar_teams", "Equipos")}
              active={mode === "teams"}
              onPress={() => {
                triggerHaptic("light");
                setMode("teams");
              }}
            />
            <Badge4All
              label={t("azar_wheel", "Ruleta")}
              active={mode === "wheel"}
              onPress={() => {
                triggerHaptic("light");
                setMode("wheel");
              }}
            />
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          {/* Main Display Box (Result Hero) */}
          <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl py-9 px-4 items-center justify-center my-3 shadow-sm">
            <Text className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider mb-2">
              {t("azar_result_label", "Resultado")}
            </Text>
            <Text
              className="text-5xl font-black text-amber-700 dark:text-amber-400 text-center"
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {currentResult}
            </Text>
          </View>

          {/* 1. DICES MODE */}
          {mode === "dice" && (
            <View className="gap-3">
              <View className="flex-row justify-between gap-3">
                <Button4All
                  label="1 D6"
                  onPress={() => rollDice(6, 1)}
                  className="flex-1"
                />
                <Button4All
                  label="2 D6"
                  onPress={() => rollDice(6, 2)}
                  className="flex-1"
                />
                <Button4All
                  label="3 D6"
                  onPress={() => rollDice(6, 3)}
                  className="flex-1"
                />
              </View>
              <View className="flex-row justify-between gap-2.5">
                <Button4All
                  label="1 D4"
                  onPress={() => rollDice(4, 1)}
                  className="flex-1"
                  variant="outline"
                />
                <Button4All
                  label="1 D12"
                  onPress={() => rollDice(12, 1)}
                  className="flex-1"
                  variant="outline"
                />
                <Button4All
                  label="1 D20"
                  onPress={() => rollDice(20, 1)}
                  className="flex-1"
                  variant="outline"
                />
                <Button4All
                  label="1 D100"
                  onPress={() => rollDice(100, 1)}
                  className="flex-1"
                  variant="outline"
                />
              </View>
            </View>
          )}

          {/* 2. COIN MODE */}
          {mode === "coin" && (
            <Button4All
              label={t("azar_flip", "Tirar")}
              onPress={flipCoin}
              className="w-full"
            />
          )}

          {/* 3. NUMBER MODE */}
          {mode === "number" && (
            <View>
              <View className="flex-row justify-between gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-zinc-500 dark:text-zinc-400 text-sm mb-1 font-bold">
                    {t("azar_min", "Mín.")}
                  </Text>
                  <TextInput
                    value={minNum}
                    onChangeText={setMinNum}
                    keyboardType="numeric"
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white font-mono"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-zinc-500 dark:text-zinc-400 text-sm mb-1 font-bold">
                    {t("azar_max", "Máx.")}
                  </Text>
                  <TextInput
                    value={maxNum}
                    onChangeText={setMaxNum}
                    keyboardType="numeric"
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white font-mono"
                  />
                </View>
              </View>
              <Button4All
                label={t("azar_generate", "Generar")}
                onPress={generateNumber}
                className="w-full"
              />
            </View>
          )}

          {/* 4. LIST DRAW MODE */}
          {mode === "list" && (
            <View>
              <View className="flex-row mb-4">
                <TextInput
                  value={listInput}
                  onChangeText={setListInput}
                  onSubmitEditing={addToList}
                  placeholder={t("azar_add_item", "Añadir elemento...")}
                  placeholderTextColor="#a1a1aa"
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white mr-2"
                />
                <TouchableOpacity
                  onPress={addToList}
                  className="bg-amber-700 dark:bg-amber-400 rounded-2xl px-5 justify-center items-center"
                >
                  <Text className="text-white dark:text-zinc-950 font-bold text-lg">
                    +
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {listItems.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item}-${idx}`}
                    onPress={() => removeFromList(idx)}
                    className="bg-zinc-200 dark:bg-zinc-800 rounded-full px-3.5 py-1.5 flex-row items-center"
                  >
                    <Text className="text-zinc-800 dark:text-zinc-200 text-xs font-medium mr-1.5">
                      {item}
                    </Text>
                    <Text className="text-zinc-400 font-bold text-xs">×</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Button4All
                label={t("azar_draw", "Sortear")}
                onPress={drawFromList}
                className="w-full"
                disabled={listItems.length === 0}
              />
            </View>
          )}

          {/* 5. TEAMS MODE */}
          {mode === "teams" && (
            <View>
              <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-zinc-900 dark:text-white font-bold">
                    {t("azar_team_count", "Número de equipos")}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {["2", "3", "4"].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => {
                          triggerHaptic("light");
                          setTeamCount(num);
                        }}
                        className={`w-10 h-10 rounded-xl items-center justify-center border ${
                          teamCount === num
                            ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <Text
                          className={`font-black ${
                            teamCount === num
                              ? "text-white dark:text-zinc-950"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("azar_options_count", { count: listItems.length })}
                  </Text>
                  <TouchableOpacity onPress={() => setMode("list")}>
                    <Text className="text-amber-700 dark:text-amber-400 text-xs font-bold">
                      + {t("azar_edit_list", "Editar lista")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-1.5 mb-4">
                  {listItems.map((item, idx) => (
                    <View
                      key={`${item}-${idx}`}
                      className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg"
                    >
                      <Text className="text-zinc-700 dark:text-zinc-300 text-xs">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>

                <Button4All
                  label={t("azar_divide_teams", "Dividir en Equipos")}
                  onPress={divideIntoTeams}
                  disabled={listItems.length < parseInt(teamCount, 10)}
                />
              </View>

              {generatedTeams.length > 0 && (
                <View className="gap-3 mb-6">
                  {generatedTeams.map((team, idx) => (
                    <View
                      key={idx}
                      className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    >
                      <View className="flex-row items-center mb-2">
                        <Trophy size={16} color={accentHex} />
                        <Text className="font-black text-amber-700 dark:text-amber-400 text-base ml-1.5">
                          {t("azar_team", "Equipo")} {idx + 1} ({team.length})
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {team.map((member, mIdx) => (
                          <View
                            key={`${member}-${mIdx}`}
                            className="bg-amber-500/10 dark:bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
                          >
                            <Text className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">
                              {member}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 6. WHEEL MODE */}
          {mode === "wheel" && (
            <View className="items-center mb-6">
              <View className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[20px] border-t-amber-600 z-10 -mb-2" />

              <Animated.View
                style={{
                  transform: [{ rotate: spinInterpolate }],
                }}
                className="w-64 h-64 rounded-full border-4 border-amber-600 bg-white dark:bg-zinc-900 items-center justify-center overflow-hidden shadow-lg relative my-4"
              >
                {listItems.map((item, idx) => {
                  const angle = (360 / Math.max(1, listItems.length)) * idx;
                  return (
                    <View
                      key={`${item}-${idx}`}
                      style={{
                        position: "absolute",
                        transform: [{ rotate: `${angle}deg` }],
                        top: 10,
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        className="font-bold text-xs"
                        style={{
                          color: WHEEL_COLORS[idx % WHEEL_COLORS.length],
                        }}
                        numberOfLines={1}
                      >
                        {item}
                      </Text>
                    </View>
                  );
                })}
                <View className="w-16 h-16 rounded-full bg-amber-600 items-center justify-center shadow-md">
                  <Disc3 color="#fff" size={28} />
                </View>
              </Animated.View>

              <Button4All
                label={
                  isSpinning
                    ? t("azar_spinning", "Girando...")
                    : t("azar_spin", "Girar Ruleta")
                }
                onPress={spinWheel}
                disabled={isSpinning || listItems.length === 0}
                className="w-full mt-4"
              />

              <TouchableOpacity
                onPress={() => setMode("list")}
                className="mt-3 py-1"
              >
                <Text className="text-zinc-500 text-xs text-center font-medium">
                  {t("azar_options_count", { count: listItems.length })} •{" "}
                  <Text className="text-amber-700 dark:text-amber-400 font-bold">
                    {t("azar_edit_list", "Editar lista")}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* History Log */}
          <View className="mt-8 mb-12">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                {t("azar_history", "Historial")}
              </Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={clearHistory}>
                  <Text className="text-amber-700 dark:text-amber-400 text-sm font-bold">
                    {t("azar_clear_history", "Borrar Historial")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {history.length === 0 ? (
              <Text className="text-zinc-400 dark:text-zinc-600 text-center py-4 text-xs">
                {t("azar_no_history", "Sin lanzamientos recientes")}
              </Text>
            ) : (
              history.slice(0, 10).map((h) => (
                <View
                  key={h.id}
                  className="flex-row justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl mb-2 shadow-sm"
                >
                  <View>
                    <Text className="text-zinc-900 dark:text-white font-black text-base">
                      {h.result}
                    </Text>
                    <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                      {h.details}
                    </Text>
                  </View>
                  <Text className="text-zinc-400 dark:text-zinc-500 text-xs font-mono">
                    {format(h.timestamp, "HH:mm:ss")}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName={t("azar_title", "Azar 4All")}
          accentColor={accentHex}
          i18nInstance={i18n}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

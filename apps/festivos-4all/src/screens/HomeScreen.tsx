import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Calendar } from "react-native-calendars";
import Holidays from "date-holidays";
import * as ExpoCalendar from "expo-calendar";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { usePreferencesStore } from "../store/usePreferencesStore";
import { Button4All, SettingsModal4All } from "@apps4all/ui-components";
import {
  Sparkles,
  Settings,
  X,
  Globe,
  CalendarPlus,
  Briefcase,
  Sun,
} from "lucide-react-native";

export const PRESET_COUNTRIES = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", color: "#f59e0b" },
  { code: "MX", name: "México", flag: "🇲🇽", color: "#10b981" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", color: "#38bdf8" },
  { code: "ES", name: "España", flag: "🇪🇸", color: "#ef4444" },
  { code: "CL", name: "Chile", flag: "🇨🇱", color: "#6366f1" },
  { code: "PE", name: "Perú", flag: "🇵🇪", color: "#ec4899" },
  { code: "US", name: "EE.UU.", flag: "🇺🇸", color: "#3b82f6" },
];

const COUNTRY_COLORS: Record<string, string> = {
  CO: "#f59e0b",
  MX: "#10b981",
  AR: "#38bdf8",
  ES: "#ef4444",
  CL: "#6366f1",
  PE: "#ec4899",
  US: "#3b82f6",
};

const getCountryColor = (code: string, index: number) => {
  if (COUNTRY_COLORS[code]) return COUNTRY_COLORS[code];
  const colors = ["#f43f5e", "#a855f7", "#14b8a6", "#f97316", "#84cc16"];
  return colors[index % colors.length];
};

interface HolidayItem {
  date: string;
  name: string;
  countryCode: string;
  countryLabel: string;
  color: string;
  isCustom: boolean;
  id?: string;
  isHoliday?: boolean;
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
    selectedCountries,
    toggleCountry,
    customEvents,
    addCustomEvent,
    removeCustomEvent,
  } = usePreferencesStore();

  const todayIso = new Date().toISOString().split("T")[0];
  const [currentDate, setCurrentDate] = useState(todayIso);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [onlyLongWeekends, setOnlyLongWeekends] = useState(false);

  // Day Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [eventName, setEventName] = useState("");
  const [isHoliday, setIsHoliday] = useState(true);

  // Business Days Calculator Modal
  const [bizModalVisible, setBizModalVisible] = useState(false);
  const [bizStartDate, setBizStartDate] = useState(todayIso);
  const [bizEndDate, setBizEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });

  const currentYear = parseInt(currentDate.split("-")[0], 10);

  const primaryCountryBadge = useMemo(() => {
    if (selectedCountries.length === 0) return t("festivos_countries", "Países");
    const badges = selectedCountries.map((code) => {
      const preset = PRESET_COUNTRIES.find((p) => p.code === code);
      return preset ? `${preset.flag} ${preset.name}` : code;
    });
    return badges.join(" • ");
  }, [selectedCountries, t]);

  const allHolidays = useMemo<HolidayItem[]>(() => {
    const list: HolidayItem[] = [];

    selectedCountries.forEach((countryCode, index) => {
      try {
        const hd = new Holidays(countryCode);
        const holidays = hd.getHolidays(currentYear) || [];
        const color = getCountryColor(countryCode, index);
        const preset = PRESET_COUNTRIES.find((p) => p.code === countryCode);
        const countryLabel = preset
          ? `${preset.flag} ${preset.name}`
          : countryCode;

        holidays.forEach((h: { date: string; name: string }) => {
          list.push({
            date: h.date,
            name: h.name,
            countryCode,
            countryLabel,
            color,
            isCustom: false,
            isHoliday: true,
          });
        });
      } catch {
        // Invalid ISO country code ignored safely
      }
    });

    customEvents.forEach((ev) => {
      if (ev.date.startsWith(currentYear.toString())) {
        list.push({
          date: ev.date + " 00:00:00",
          name: ev.name,
          countryCode: "CUSTOM",
          countryLabel: t("custom_event", "Evento Personalizado"),
          color: "#10b981",
          isCustom: true,
          id: ev.id,
          isHoliday: ev.isHoliday,
        });
      }
    });

    return list.sort(
      (a, b) =>
        new Date(a.date.replace(" ", "T")).getTime() -
        new Date(b.date.replace(" ", "T")).getTime(),
    );
  }, [selectedCountries, currentYear, customEvents, t]);

  // Long weekends ("Puentes"): holidays falling on Monday (1) or Friday (5)
  const displayedHolidays = useMemo(() => {
    if (!onlyLongWeekends) return allHolidays;
    return allHolidays.filter((h) => {
      const [y, m, d] = h.date.split(" ")[0].split("-").map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      return dayOfWeek === 1 || dayOfWeek === 5;
    });
  }, [allHolidays, onlyLongWeekends]);

  // Next Upcoming Holiday Countdown
  const nextHolidayInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const upcomingHoliday = allHolidays.find((h) => {
      const [y, m, d] = h.date.split(" ")[0].split("-").map(Number);
      const hDate = new Date(y, m - 1, d);
      return hDate.getTime() >= todayMs;
    });

    if (!upcomingHoliday) return null;

    const [y, m, d] = upcomingHoliday.date.split(" ")[0].split("-").map(Number);
    const hDate = new Date(y, m - 1, d);
    const diffDays = Math.round(
      (hDate.getTime() - todayMs) / (1000 * 60 * 60 * 24),
    );

    return {
      holiday: upcomingHoliday,
      daysLeft: diffDays,
    };
  }, [allHolidays]);

  // Business days calculation (100% offline, excluding weekends + active country holidays)
  const businessDaysResult = useMemo(() => {
    const startMatch = /^\d{4}-\d{2}-\d{2}$/.test(bizStartDate.trim());
    const endMatch = /^\d{4}-\d{2}-\d{2}$/.test(bizEndDate.trim());
    if (!startMatch || !endMatch) return null;

    const [sy, sm, sd] = bizStartDate.trim().split("-").map(Number);
    const [ey, em, ed] = bizEndDate.trim().split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return null;
    }

    // Limit to 5 years to prevent UI freeze on extreme typos
    const diffTotalDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffTotalDays > 1826) return null;

    const holidaySet = new Set<string>();
    const yearsToLoad = new Set<number>();
    for (let y = sy; y <= ey; y++) yearsToLoad.add(y);

    yearsToLoad.forEach((yr) => {
      selectedCountries.forEach((code) => {
        try {
          const hd = new Holidays(code);
          (hd.getHolidays(yr) || []).forEach((h: { date: string }) => {
            holidaySet.add(h.date.split(" ")[0]);
          });
        } catch {
          // Ignore invalid code
        }
      });
    });

    let businessDays = 0;
    let holidaysSkipped = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dow = cursor.getDay();
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (dow !== 0 && dow !== 6) {
        if (holidaySet.has(iso)) {
          holidaysSkipped++;
        } else {
          businessDays++;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      totalDays: diffTotalDays + 1,
      businessDays,
      holidaysSkipped,
    };
  }, [bizStartDate, bizEndDate, selectedCountries]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { dots: Array<{ key: string; color: string }> }> =
      {};
    allHolidays.forEach((h) => {
      const dateStr = h.date.split(" ")[0];
      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [] };
      }

      if (h.isCustom && !h.isHoliday) {
        marks[dateStr].dots.push({
          key: h.id || dateStr,
          color: "#a855f7",
        });
      } else {
        const dotKey = h.countryCode || h.id || dateStr;
        if (!marks[dateStr].dots.find((d) => d.key === dotKey)) {
          marks[dateStr].dots.push({
            key: dotKey,
            color: h.color,
          });
        }
      }
    });
    return marks;
  }, [allHolidays]);

  const handleExportToCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("festivos_perm_title", "Permiso de calendario"),
          t(
            "festivos_export_error",
            "No se pudo acceder a los permisos de calendario.",
          ),
        );
        return;
      }

      const calendars = await ExpoCalendar.getCalendarsAsync(
        ExpoCalendar.EntityTypes.EVENT,
      );
      const targetCalendar =
        calendars.find(
          (c) =>
            c.isPrimary || c.allowsModifications || c.source?.isLocalAccount,
        ) || calendars[0];

      if (!targetCalendar) {
        Alert.alert(
          t("festivos_perm_title", "Permiso de calendario"),
          t(
            "festivos_no_calendar",
            "No se encontró un calendario compatible en el dispositivo.",
          ),
        );
        return;
      }

      let addedCount = 0;
      for (const h of allHolidays) {
        const rawDate = h.date.split(" ")[0];
        const [year, month, day] = rawDate.split("-").map(Number);
        const startDate = new Date(year, month - 1, day, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);
        const eventTitle = `🎉 ${h.name} (${h.countryCode})`;

        const existingEvents = await ExpoCalendar.getEventsAsync(
          [targetCalendar.id],
          startDate,
          endDate,
        ).catch(() => []);

        const alreadyExists = existingEvents.some(
          (ev) => ev.title === eventTitle,
        );
        if (!alreadyExists) {
          await ExpoCalendar.createEventAsync(targetCalendar.id, {
            title: eventTitle,
            startDate,
            endDate,
            allDay: true,
            notes: "Festivos 4All (100% Offline)",
          });
          addedCount++;
        }
      }

      Alert.alert(
        t("pdf_done", "¡Listo!"),
        `${t("festivos_export_success", "Festivos sincronizados con tu calendario local.")} (${addedCount})`,
      );
    } catch {
      Alert.alert(
        t("festivos_perm_title", "Permiso de calendario"),
        t(
          "festivos_export_error",
          "No se pudo acceder a los permisos de calendario.",
        ),
      );
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDay(day.dateString);
    setEventName("");
    setIsHoliday(true);
    setModalVisible(true);
  };

  const handleSaveCustomEvent = () => {
    if (eventName.trim() === "") return;
    addCustomEvent({
      date: selectedDay,
      name: eventName.trim(),
      isHoliday,
    });
    setEventName("");
    setModalVisible(false);
  };

  const dayEvents = allHolidays.filter((h) => h.date.startsWith(selectedDay));

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      {/* Header (Dynamic Country Badge persisted on open) */}
      <View className="py-3.5 px-5 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <View className="flex-1 mr-3">
          <Text
            className="text-xl font-black text-zinc-900 dark:text-white"
            numberOfLines={1}
          >
            {t("festivos_app_name", "Festivos 4All")}
          </Text>
          <Text
            className="text-xs font-bold text-amber-700 dark:text-amber-400"
            numberOfLines={1}
          >
            {primaryCountryBadge}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setBizModalVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("festivos_biz_title", "Días Hábiles")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Briefcase color={accentHex} size={19} />
          </TouchableOpacity>
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
      </View>

      <ScrollView className="flex-1">
        {/* 1. Countdown Hero Widget */}
        {nextHolidayInfo && (
          <View className="mx-5 mt-5 p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 border-2 border-amber-500/30 dark:border-amber-400/30">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Sparkles color={accentHex} size={19} />
                <Text className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider ml-2">
                  {t("festivos_next", "Próximo festivo")}
                </Text>
              </View>
              <View className="bg-amber-700 dark:bg-amber-400 px-3 py-1 rounded-full">
                <Text className="text-xs font-black text-white dark:text-zinc-950">
                  {nextHolidayInfo.daysLeft === 0
                    ? t("festivos_today", "¡Hoy es festivo!")
                    : nextHolidayInfo.daysLeft === 1
                      ? t("festivos_tomorrow", "¡Mañana es festivo!")
                      : t("festivos_days_left", {
                          days: nextHolidayInfo.daysLeft,
                          defaultValue: "Faltan {{days}} días",
                        })}
                </Text>
              </View>
            </View>

            <Text className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
              {nextHolidayInfo.holiday.name}
            </Text>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                📅 {nextHolidayInfo.holiday.date.split(" ")[0]} •{" "}
                {nextHolidayInfo.holiday.countryLabel}
              </Text>

              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nextHolidayInfo.holiday.color }}
              />
            </View>
          </View>
        )}

        {/* 2. Multi-Country Quick Selector Bar (Persisted permanently) */}
        <View className="mt-5 mb-2">
          <View className="px-5 flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Globe color={mutedHex} size={16} />
              <Text className="text-xs font-bold uppercase text-zinc-500 tracking-wider ml-1.5">
                {t("festivos_quick_filter", "Filtrar por país")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Text className="text-xs font-bold text-amber-700 dark:text-amber-400">
                + {t("festivos_more_countries", "Más países")}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 6 }}
          >
            {PRESET_COUNTRIES.map((country) => {
              const isSelected = selectedCountries.includes(country.code);
              return (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => toggleCountry(country.code)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={country.name}
                  className={`flex-row items-center px-3.5 py-2.5 rounded-2xl border ${
                    isSelected
                      ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <Text className="text-base mr-1.5">{country.flag}</Text>
                  <Text
                    className={`font-bold text-xs ${
                      isSelected
                        ? "text-white dark:text-zinc-950"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {country.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Quick Action Row: Sync Calendar + Business Days */}
        <View className="px-5 mt-2 mb-4 flex-row gap-2.5">
          <TouchableOpacity
            onPress={handleExportToCalendar}
            disabled={isSyncingCalendar}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t(
              "festivos_export_calendar",
              "Sincronizar con Calendario",
            )}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-3 px-3 rounded-2xl flex-row items-center justify-center shadow-sm"
          >
            {isSyncingCalendar ? (
              <ActivityIndicator color={accentHex} />
            ) : (
              <CalendarPlus color={accentHex} size={18} />
            )}
            <Text
              className="font-bold text-zinc-900 dark:text-white text-xs ml-1.5"
              numberOfLines={1}
            >
              {isSyncingCalendar
                ? t("festivos_syncing", "Sincronizando...")
                : t("festivos_export_calendar", "Sincronizar con Calendario")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBizModalVisible(true)}
            className="px-3.5 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex-row items-center justify-center shadow-sm"
          >
            <Briefcase color={accentHex} size={17} />
            <Text className="font-bold text-zinc-900 dark:text-white text-xs ml-1.5">
              {t("festivos_biz_short", "Días Hábiles")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar View */}
        <Calendar
          key={colorScheme || "system"}
          current={currentDate}
          onMonthChange={(month: { dateString: string }) =>
            setCurrentDate(month.dateString)
          }
          onDayPress={onDayPress}
          markingType={"multi-dot"}
          markedDates={markedDates}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            textSectionTitleColor: isDark ? "#a1a1aa" : "#71717a",
            todayTextColor: accentHex,
            dayTextColor: isDark ? "#fafafa" : "#18181b",
            textDisabledColor: isDark ? "#52525b" : "#a1a1aa",
            dotColor: accentHex,
            arrowColor: accentHex,
            monthTextColor: isDark ? "#fafafa" : "#18181b",
          }}
          className="bg-white dark:bg-zinc-900 mb-5 mx-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        />

        {/* Upcoming Holidays List + Long Weekends ("Puentes") Filter */}
        <View className="px-5 pb-12">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-zinc-900 dark:text-white">
              {t("upcoming", "Próximo")} ({displayedHolidays.length})
            </Text>

            <TouchableOpacity
              onPress={() => setOnlyLongWeekends(!onlyLongWeekends)}
              className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                onlyLongWeekends
                  ? "bg-amber-700 dark:bg-amber-400 border-amber-700 dark:border-amber-400"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <Sun
                color={
                  onlyLongWeekends
                    ? isDark
                      ? "#09090b"
                      : "#fff"
                    : accentHex
                }
                size={13}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  onlyLongWeekends
                    ? "text-white dark:text-zinc-950"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t("festivos_long_weekends", "Solo Puentes")}
              </Text>
            </TouchableOpacity>
          </View>

          {displayedHolidays.slice(0, 20).map((h, i) => (
            <View
              key={`${h.date}-${h.countryCode}-${i}`}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2.5 border border-zinc-200 dark:border-zinc-800 flex-row items-center shadow-sm"
            >
              <View
                className="w-3.5 h-3.5 rounded-full mr-3.5 border border-zinc-200 dark:border-zinc-700"
                style={{
                  backgroundColor:
                    !h.isHoliday && h.isCustom ? "#a855f7" : h.color,
                }}
              />
              <View className="flex-1">
                <Text className="text-zinc-900 dark:text-white font-bold text-sm">
                  {h.name}
                </Text>
                <Text className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                  {h.date.split(" ")[0]} • {h.countryLabel || h.countryCode}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Business Days Calculator Modal */}
      <Modal
        visible={bizModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBizModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Briefcase color={accentHex} size={20} />
                <Text className="text-lg font-black text-zinc-900 dark:text-white ml-2">
                  {t("festivos_biz_title", "Calculadora de Días Hábiles")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBizModalVisible(false)}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
              >
                <X color={mutedHex} size={18} />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                  {t("festivos_biz_start", "Inicio (AAAA-MM-DD)")}
                </Text>
                <TextInput
                  value={bizStartDate}
                  onChangeText={setBizStartDate}
                  placeholder="2026-01-01"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-3 text-zinc-900 dark:text-white font-mono text-sm"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-zinc-400 uppercase mb-1">
                  {t("festivos_biz_end", "Fin (AAAA-MM-DD)")}
                </Text>
                <TextInput
                  value={bizEndDate}
                  onChangeText={setBizEndDate}
                  placeholder="2026-01-31"
                  placeholderTextColor="#a1a1aa"
                  className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-3 text-zinc-900 dark:text-white font-mono text-sm"
                />
              </View>
            </View>

            {businessDaysResult ? (
              <View className="bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 rounded-2xl p-4 items-center mb-4">
                <Text className="text-4xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  {businessDaysResult.businessDays}
                </Text>
                <Text className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mt-1">
                  {t("festivos_biz_result", {
                    total: businessDaysResult.totalDays,
                    holidays: businessDaysResult.holidaysSkipped,
                    defaultValue:
                      "días hábiles (de {{total}} días, excluyendo {{holidays}} festivos)",
                  })}
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-zinc-400 text-center mb-4">
                {t(
                  "festivos_biz_hint",
                  "Usa el formato AAAA-MM-DD con fecha final mayor o igual a la inicial.",
                )}
              </Text>
            )}

            <Button4All
              label={t("enfoque_close", "Cerrar")}
              onPress={() => setBizModalVisible(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Interactive Day Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-2xl font-black text-zinc-900 dark:text-white">
                {selectedDay}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("cancel", "Cancelar")}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
              >
                <X color={mutedHex} size={18} />
              </TouchableOpacity>
            </View>

            {dayEvents.length > 0 && (
              <View className="mb-5">
                {dayEvents.map((ev, i) => (
                  <View
                    key={`${ev.date}-${i}`}
                    className="flex-row justify-between items-center mb-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: ev.color }}
                      />
                      <View className="flex-1">
                        <Text className="text-zinc-900 dark:text-white font-medium">
                          {ev.name}
                        </Text>
                        <Text className="text-zinc-500 text-xs">
                          {ev.countryLabel || ev.countryCode}
                        </Text>
                      </View>
                    </View>
                    {ev.isCustom && ev.id && (
                      <TouchableOpacity
                        onPress={() => removeCustomEvent(ev.id!)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t("delete", "Eliminar")}
                      >
                        <Text className="text-red-500 text-sm font-bold">
                          {t("delete", "Eliminar")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            <Text className="text-zinc-900 dark:text-white font-bold mb-2">
              {t("add_note", "Añadir Nota / Evento Personal")}
            </Text>
            <TextInput
              value={eventName}
              onChangeText={setEventName}
              placeholder={t("event_name", "Nombre del Evento / Nota")}
              placeholderTextColor="#a1a1aa"
              className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3.5 mb-4 text-zinc-900 dark:text-white"
            />

            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-zinc-900 dark:text-white font-medium">
                {t("is_holiday", "Marcar como Festivo (Punto Rojo)")}
              </Text>
              <Switch value={isHoliday} onValueChange={setIsHoliday} />
            </View>

            <Button4All
              label={t("save", "Guardar")}
              onPress={handleSaveCustomEvent}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SettingsModal4All
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        appName={t("festivos_app_name", "Festivos 4All")}
        accentColor={accentHex}
        i18nInstance={i18n}
        appSpecificSection={
          <View className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-4">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
              {t(
                "festivos_select_countries_desc",
                "Selecciona los países que quedarán guardados al abrir la app:",
              )}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {PRESET_COUNTRIES.map((country) => {
                const active = selectedCountries.includes(country.code);
                return (
                  <TouchableOpacity
                    key={country.code}
                    onPress={() => toggleCountry(country.code)}
                    className={`px-3 py-2 rounded-xl border flex-row items-center ${
                      active
                        ? "bg-amber-500/20 border-amber-500"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text className="mr-1.5 text-sm">{country.flag}</Text>
                    <Text
                      className={`text-xs font-bold ${
                        active
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {country.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-[10px] text-zinc-400">
              {t(
                "festivos_attribution",
                "Datos de festivos: date-holidays (CC-BY-3.0).",
              )}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

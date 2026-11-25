import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import Holidays from "date-holidays";
import { SettingsModal4All } from "@apps4all/ui-components";
import i18n from "@apps4all/i18n";
import { usePreferencesStore } from "../store/usePreferencesStore";
import { Search, X } from "lucide-react-native";

export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export default function SettingsScreen({ navigation }: any) {
  const { selectedCountries, toggleCountry } = usePreferencesStore();
  const [query, setQuery] = useState("");

  const allCountries = useMemo(() => {
    try {
      const hd = new Holidays();
      const map = hd.getCountries() as Record<string, string>;
      return Object.entries(map)
        .map(([code, name]) => ({
          code,
          name: String(name),
          flag: countryCodeToFlag(code),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [
        { code: "CO", name: "Colombia", flag: "🇨🇴" },
        { code: "MX", name: "México", flag: "🇲🇽" },
        { code: "AR", name: "Argentina", flag: "🇦🇷" },
        { code: "ES", name: "España", flag: "🇪🇸" },
        { code: "US", name: "United States", flag: "🇺🇸" },
      ];
    }
  }, []);

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show selected countries first, then popular + alphabetical
      const selectedSet = new Set(selectedCountries);
      const selected = allCountries.filter((c) => selectedSet.has(c.code));
      const rest = allCountries.filter((c) => !selectedSet.has(c.code));
      return [...selected, ...rest].slice(0, 40);
    }
    return allCountries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [allCountries, query, selectedCountries]);

  return (
    <SettingsModal4All
      visible={true}
      onClose={() => navigation.goBack()}
      appName="Festivos 4All"
      accentColor="#B45309"
      i18nInstance={i18n}
      appSpecificSection={
        <View className="p-4 bg-white dark:bg-zinc-900">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5 font-medium">
            {i18n.t(
              "festivos_pick_any_country",
              "Busca y selecciona cualquier país del mundo ({{count}} disponibles):",
              { count: allCountries.length },
            )}
          </Text>

          <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 mb-3">
            <Search size={15} color="#71717a" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={i18n.t(
                "festivos_search_country",
                "Buscar país (ej. Colombia, Brasil, Japón...)",
              )}
              placeholderTextColor="#a1a1aa"
              className="flex-1 ml-2 text-xs text-zinc-900 dark:text-white"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={15} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {filteredCountries.map((country) => {
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
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {country.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      }
    />
  );
}

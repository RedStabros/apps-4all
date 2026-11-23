import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SettingsModal4All } from "@apps4all/ui-components";
import i18n from "@apps4all/i18n";
import { usePreferencesStore } from "../store/usePreferencesStore";
import { PRESET_COUNTRIES } from "./HomeScreen";

export default function SettingsScreen({ navigation }: any) {
  const { selectedCountries, toggleCountry } = usePreferencesStore();

  return (
    <SettingsModal4All
      visible={true}
      onClose={() => navigation.goBack()}
      appName="Festivos Colombia 4All"
      accentColor="#B45309"
      i18nInstance={i18n}
      appSpecificSection={
        <View className="p-4 bg-white dark:bg-zinc-900">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
            Selecciona los países a incluir en el calendario:
          </Text>
          <View className="flex-row flex-wrap gap-2">
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
        </View>
      }
    />
  );
}

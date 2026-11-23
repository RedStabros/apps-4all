import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface Badge4AllProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Badge4All({ label, active = false, onPress }: Badge4AllProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${active ? "bg-primary border-primary dark:bg-primary-dark dark:border-primary-dark" : "bg-transparent border-zinc-300 dark:border-zinc-700"}`}
    >
      <Text
        className={`${active ? "text-white dark:text-zinc-900 font-medium" : "text-zinc-600 dark:text-zinc-400"}`}
      >
        {label}
      </Text>
    </Component>
  );
}

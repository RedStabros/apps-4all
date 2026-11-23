import React from "react";
import { View } from "react-native";

export const Card = ({ children, className = "" }) => {
  return (
    <View
      className={`bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 ${className}`}
    >
      {children}
    </View>
  );
};

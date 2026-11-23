import React from "react";
import { View, ViewProps } from "react-native";

export function Card4All({ children, className = "", ...props }: ViewProps) {
  return (
    <View
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

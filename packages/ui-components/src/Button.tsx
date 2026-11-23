import React from "react";
import { Pressable, Text } from "react-native";

export const Button = ({
  onPress,
  title,
  variant = "primary",
  className = "",
}) => {
  const baseClasses =
    "py-3 px-6 rounded-xl flex-row justify-center items-center active:opacity-80 transition-opacity";

  const variantClasses = {
    primary: "bg-primary dark:bg-primary-dark",
    secondary: "bg-zinc-200 dark:bg-zinc-800",
    outline: "border-2 border-primary dark:border-primary-dark bg-transparent",
  };

  const textClasses = {
    primary: "text-white font-semibold text-base",
    secondary: "text-zinc-900 dark:text-zinc-100 font-semibold text-base",
    outline: "text-primary dark:text-primary-dark font-semibold text-base",
  };

  return (
    <Pressable
      onPress={onPress}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <Text className={textClasses[variant]}>{title}</Text>
    </Pressable>
  );
};

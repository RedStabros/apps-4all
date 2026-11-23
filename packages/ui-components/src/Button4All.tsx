import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";

interface Button4AllProps extends TouchableOpacityProps {
  label: string;
  variant?: "solid" | "outline" | "ghost";
}

export function Button4All({
  label,
  variant = "solid",
  className = "",
  ...props
}: Button4AllProps) {
  const baseClasses = "py-4 rounded-xl items-center justify-center flex-row";

  let variantClasses = "";
  let textClasses = "";

  if (variant === "solid") {
    variantClasses = "bg-primary dark:bg-primary-dark";
    textClasses = "text-white dark:text-zinc-900 font-bold text-lg";
  } else if (variant === "outline") {
    variantClasses =
      "bg-transparent border border-primary dark:border-primary-dark";
    textClasses = "text-primary dark:text-primary-dark font-bold text-lg";
  } else if (variant === "ghost") {
    variantClasses = "bg-transparent";
    textClasses = "text-primary dark:text-primary-dark font-bold text-lg";
  }

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <Text className={textClasses}>{label}</Text>
    </TouchableOpacity>
  );
}

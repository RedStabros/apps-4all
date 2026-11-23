import React from "react";
import { Text } from "react-native";

export const Typography = ({
  children,
  variant = "body",
  weight = "normal",
  className = "",
}) => {
  const variantClasses = {
    h1: "text-3xl",
    h2: "text-2xl",
    h3: "text-xl",
    body: "text-base",
    caption: "text-sm",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    bold: "font-bold",
    semibold: "font-semibold",
  };

  const baseClasses = "font-sans text-zinc-900 dark:text-zinc-50";

  return (
    <Text
      className={`${baseClasses} ${variantClasses[variant]} ${weightClasses[weight]} ${className}`}
    >
      {children}
    </Text>
  );
};

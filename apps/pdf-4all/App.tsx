import "./global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainScreen from "./src/screens/MainScreen";
import "@apps4all/i18n";

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

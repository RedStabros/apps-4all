import "./global.css";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ScannerScreen from "./src/screens/ScannerScreen";
import GeneratorScreen from "./src/screens/GeneratorScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import "@apps4all/i18n";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: "fade" }}
        >
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Generator" component={GeneratorScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

import "../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold
} from "@expo-google-fonts/hind-siliguri";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from "@expo-google-fonts/manrope";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold
} from "@expo-google-fonts/fraunces";
import { LangProvider, useLang } from "@/i18n";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready: languageReady } = useLang();
  const ready = fontsReady && languageReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-body">
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgBody } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold
  });

  return (
    <LangProvider>
      <AppShell fontsReady={fontsLoaded || Boolean(fontError)} />
      <StatusBar style="dark" />
    </LangProvider>
  );
}

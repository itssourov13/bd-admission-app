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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LangProvider, useLang, useT } from "@/i18n";
import { DbProvider, useDbState } from "@/db/provider";
import { ErrorView } from "@/components/common/StateViews";
import { Screen } from "@/components/ui";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready: languageReady } = useLang();
  const { state, retry } = useDbState();
  const t = useT();
  const ready = fontsReady && languageReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready || state.status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-body">
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <Screen edges={["top", "bottom"]} className="justify-center">
        <ErrorView title={t("error.dbTitle")} body={t("error.dbBody")} onRetry={retry} />
      </Screen>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgBody } }}>
      <Stack.Screen name="exam/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="flash/play" options={{ gestureEnabled: false }} />
    </Stack>
  );
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
    <SafeAreaProvider>
      <LangProvider>
        <DbProvider>
          <AppShell fontsReady={fontsLoaded || Boolean(fontError)} />
          <StatusBar style="dark" />
        </DbProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}

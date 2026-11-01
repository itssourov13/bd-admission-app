import "../global.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
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
import { LangProvider, useLang } from "@/i18n";
import { DbProvider, useDbState, useStartupProgress, useMarkSetupScreenReady } from "@/db/provider";
import { SetupScreen } from "@/components/startup/SetupScreen";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** How long the completed "Ready to start" state stays visible before fading out. First-time setup gets a longer dwell. */
const READY_HOLD_FIRST_RUN_MS = 700;
const READY_HOLD_RETURNING_MS = 120;

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready: languageReady } = useLang();
  const { state, retry } = useDbState();
  const progress = useStartupProgress();
  const markSetupScreenReady = useMarkSetupScreenReady();
  const [setupDismissed, setSetupDismissed] = useState(false);
  const splashHidden = useRef(false);
  const resourcesReady = fontsReady && languageReady;
  const dbReady = state.status === "ready";

  // Hide the native splash only after the setup screen has laid out, so there is no blank frame in between.
  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  const dismissSetup = useCallback(() => setSetupDismissed(true), []);
  const handleSetupShown = useCallback(() => {
    hideSplash();
    markSetupScreenReady();
  }, [hideSplash, markSetupScreenReady]);

  // Safety net: never leave the native splash up if the setup screen could not report its layout.
  useEffect(() => {
    if (!resourcesReady) return;
    const timer = setTimeout(() => {
      hideSplash();
      markSetupScreenReady();
    }, 1500);
    return () => clearTimeout(timer);
  }, [resourcesReady, hideSplash, markSetupScreenReady]);

  if (!resourcesReady) return <View className="flex-1 bg-body" />;

  return (
    <View className="flex-1 bg-body">
      {dbReady ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgBody } }}>
          <Stack.Screen name="exam/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="flash/play" options={{ gestureEnabled: false }} />
        </Stack>
      ) : null}
      {setupDismissed ? null : (
        <SetupScreen
          progress={progress}
          failed={state.status === "error"}
          exiting={dbReady}
          holdMs={progress.mode === "firstRun" ? READY_HOLD_FIRST_RUN_MS : READY_HOLD_RETURNING_MS}
          onRetry={retry}
          onExited={dismissSetup}
          onShown={handleSetupShown}
        />
      )}
    </View>
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

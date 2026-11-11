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
import { DbProvider, useDbState, useStartupProgress, useMarkSetupScreenReady, useWaitForHomeScreenReady } from "@/db/provider";
import { SetupScreen } from "@/components/startup/SetupScreen";
import { colors } from "@/theme";
import { startupMetrics } from "@/services/perf";
import {
  canDismissSetupScreen,
  shouldReleaseSetupGateWithoutScreen,
  shouldShowSetupScreen
} from "@/services/startupUiPolicy";

startupMetrics.mark("app.jsStart");
SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Keep the completed first-run state visible long enough for its final stage/checkmark transition. */
const READY_HOLD_FIRST_RUN_MS = 700;

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready: languageReady } = useLang();
  const { state, retry } = useDbState();
  const progress = useStartupProgress();
  const markSetupScreenReady = useMarkSetupScreenReady();
  const waitForHomeScreenReady = useWaitForHomeScreenReady();
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [homeReady, setHomeReady] = useState(false);
  const splashHidden = useRef(false);
  const resourcesReady = fontsReady && languageReady;
  const dbReady = state.status === "ready";
  const showSetupScreen = shouldShowSetupScreen(progress.mode, state.status === "error", setupRequired) && !setupDismissed;
  useEffect(() => {
    if (fontsReady) startupMetrics.mark("fonts.ready");
  }, [fontsReady]);

  // Hide the native splash only after the setup screen has laid out, so there is no blank frame in between.
  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  const dismissSetup = useCallback(() => setSetupDismissed(true), []);
  const handleRetry = useCallback(() => {
    setSetupRequired(true);
    retry();
  }, [retry]);
  const handleSetupShown = useCallback(() => {
    hideSplash();
    markSetupScreenReady();
  }, [hideSplash, markSetupScreenReady]);

  // Returning users have no SetupScreen layout to resolve the startup sync gate.
  useEffect(() => {
    if (shouldReleaseSetupGateWithoutScreen(progress.mode)) markSetupScreenReady();
  }, [progress.mode, markSetupScreenReady]);

  // Safety net applies only when the branded setup/error UI is expected to cover the native splash.
  useEffect(() => {
    if (!resourcesReady || !showSetupScreen) return;
    const timer = setTimeout(() => {
      hideSplash();
      markSetupScreenReady();
    }, 1500);
    return () => clearTimeout(timer);
  }, [resourcesReady, showSetupScreen, hideSplash, markSetupScreenReady]);

  // Wait for Home on both paths: first-run uses it to dismiss the branded overlay,
  // while returning launches use it as the native-splash hide boundary.
  useEffect(() => {
    if (!resourcesReady || !dbReady) return;
    let active = true;
    void waitForHomeScreenReady().then(() => {
      if (!active) return;
      setHomeReady(true);
      if (progress.mode === "returning") hideSplash();
    });
    return () => { active = false; };
  }, [resourcesReady, dbReady, progress.mode, waitForHomeScreenReady, hideSplash]);

  if (!resourcesReady) return <View className="flex-1 bg-body" />;

  return (
    <View className="flex-1 bg-body">
      {dbReady ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgBody } }}>
          <Stack.Screen name="exam/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="flash/play" options={{ gestureEnabled: false }} />
        </Stack>
      ) : null}
      {showSetupScreen ? (
        <SetupScreen
          progress={progress}
          failed={state.status === "error"}
          errorMessage={state.status === "error" ? state.error.message : null}
          exiting={canDismissSetupScreen(dbReady, homeReady)}
          holdMs={READY_HOLD_FIRST_RUN_MS}
          onRetry={handleRetry}
          onExited={dismissSetup}
          onShown={handleSetupShown}
        />
      ) : null}
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

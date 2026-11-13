import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Appearance, useColorScheme, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";
import * as SystemUI from "expo-system-ui";
import {
  DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, TEXT_SCALE, parseSettings, resolveReducedMotion, resolveScheme, serializeSettings,
  type AppSettings
} from "./model";
import { themeFor, type ThemeTokens } from "./palettes";

interface SettingsContextValue {
  settings: AppSettings;
  /** True once the stored settings have been read (theme is correct from this point; before it the system scheme is used). */
  ready: boolean;
  update: (patch: Partial<AppSettings>) => void;
  reducedMotion: boolean;
  textScale: number;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS, ready: false, update: () => undefined, reducedMotion: false, textScale: 1
});
const ThemeContext = createContext<ThemeTokens>(themeFor("light"));

/**
 * Loads persisted settings, resolves the active scheme and publishes the theme as a context value plus a NativeWind
 * variable map on the root view. Everything below reads tokens through `useTheme()`; className colours resolve from the
 * variable map, so most components need no theme-specific code. The root View is the only place that sets the variables.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [systemReduce, setSystemReduce] = useState(false);
  const systemScheme = useColorScheme();
  const touched = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then((raw) => { if (active && !touched.current) setSettings(parseSettings(raw)); })
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (active) setSystemReduce(v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setSystemReduce);
    return () => { active = false; sub.remove(); };
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    touched.current = true;
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(next)).catch(() => undefined);
      return next;
    });
  }, []);

  // Native dialogs, system UI and `useColorScheme()` follow the explicit preference (null restores system behaviour).
  useEffect(() => {
    try { Appearance.setColorScheme(settings.theme === "system" ? "unspecified" : settings.theme); } catch { /* unsupported platform */ }
  }, [settings.theme]);

  const scheme = resolveScheme(settings.theme, systemScheme === "dark" ? "dark" : systemScheme === "light" ? "light" : null);
  const theme = themeFor(scheme);
  const cssVars = useMemo(() => vars(theme.cssVars), [theme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bgBody).catch(() => undefined);
  }, [theme]);

  const reducedMotion = resolveReducedMotion(settings.motion, systemReduce);
  const textScale = TEXT_SCALE[settings.questionTextSize];
  const value = useMemo<SettingsContextValue>(
    () => ({ settings, ready, update, reducedMotion, textScale }),
    [settings, ready, update, reducedMotion, textScale]
  );

  return (
    <SettingsContext.Provider value={value}>
      <ThemeContext.Provider value={theme}>
        <View style={[{ flex: 1 }, cssVars]}>{children}</View>
      </ThemeContext.Provider>
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
/** Active theme tokens. Stable identity per scheme, so memoised children only re-render when the scheme changes. */
export const useTheme = () => useContext(ThemeContext);
export const useReducedMotion = () => useContext(SettingsContext).reducedMotion;

import { useMemo } from "react";
import * as Haptics from "expo-haptics";
import { useSettings } from "./SettingsProvider";

export interface HapticFeedback {
  /** Light tick for selections and toggles. */
  select: () => void;
  /** Confirmation (submit, finish). */
  success: () => void;
  /** Attention (low time, destructive confirmation). */
  warning: () => void;
}

const noop = () => undefined;
const safe = (fn: () => Promise<void>) => () => { void fn().catch(() => undefined); };

/** Haptic helpers that become no-ops when the person turned haptics off in Settings. */
export function useHaptics(): HapticFeedback {
  const { settings } = useSettings();
  const enabled = settings.haptics;
  return useMemo(() => enabled
    ? {
        select: safe(() => Haptics.selectionAsync()),
        success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
        warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
      }
    : { select: noop, success: noop, warning: noop }, [enabled]);
}

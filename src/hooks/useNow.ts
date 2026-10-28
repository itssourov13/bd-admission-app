import { useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * Wall-clock "now" that re-renders on an interval and immediately when the app returns to the foreground.
 * Countdowns are computed from absolute deadlines, so a backgrounded or throttled timer never drifts.
 */
export function useNow(active = true, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [active, intervalMs]);
  return now;
}

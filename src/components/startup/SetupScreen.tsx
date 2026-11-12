import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Logo, Txt } from "@/components/ui";
import { BRAND } from "@/brand";
import { useLang, useT, type TranslationKey } from "@/i18n";
import { colors, gradients, shadow } from "@/theme";
import { percentOf, STARTUP_STAGES, stageIndex, type StartupProgress, type StartupStage } from "@/services/startupProgress";
import { readyHoldMs } from "@/services/startupUiPolicy";

const SHIMMER_WIDTH = 72;
const CHECKMARK_STAGGER_MS = 65;
const CHECKMARK_DURATION_MS = 180;
const STAGE_KEY: Record<StartupStage, TranslationKey> = {
  database: "setup.stage.database",
  appData: "setup.stage.appData",
  library: "setup.stage.library",
  finalizing: "setup.stage.finalizing",
  ready: "setup.stage.ready"
};
const DETAIL_KEY: Record<Exclude<StartupStage, "library">, TranslationKey> = {
  database: "setup.detail.database",
  appData: "setup.detail.appData",
  finalizing: "setup.detail.finalizing",
  ready: "setup.detail.ready"
};

function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (active) setReduce(v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduce;
}

/**
 * True while the app is in the foreground. Looping animations stop while it is false: nothing renders anyway, and
 * Android may drop native animation frames in the background, so loops are restarted cleanly on return.
 */
function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => setActive(next === "active"));
    return () => sub.remove();
  }, []);
  return active;
}

/** Subtle mount animation; remount it with a new `key` to cross-fade changing text. */
function FadeIn({ children, reduceMotion }: { children: ReactNode; reduceMotion: boolean }) {
  const v = useAnimatedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v, reduceMotion]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [5, 0] });
  return <Animated.View style={{ opacity: v, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function BrandMark({ size, reduceMotion, appActive }: { size: number; reduceMotion: boolean; appActive: boolean }) {
  const pulse = useAnimatedValue(0);
  useEffect(() => {
    if (reduceMotion || !appActive) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion, appActive]);
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.38] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const box = size + 44;
  return (
    <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute", width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.brand200,
          opacity: haloOpacity, transform: [{ scale: haloScale }]
        }}
      />
      <View style={[shadow.md, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <Logo size={Math.round(size * 0.68)} />
      </View>
    </View>
  );
}

function Stripe({ anim, trackWidth, stripe }: { anim: Animated.Value; trackWidth: number; stripe: readonly [string, string, string] }) {
  const x = anim.interpolate({ inputRange: [0, 1], outputRange: [-SHIMMER_WIDTH, trackWidth] });
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: SHIMMER_WIDTH, transform: [{ translateX: x }] }}>
      <LinearGradient colors={stripe} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/**
 * Progress bar. Everything that animates uses the NATIVE driver, so the bar keeps moving smoothly while the JS thread
 * is busy with SQLite work:
 *  - the fill is a full-width bar translated with `translateX` (-trackWidth .. 0); the track clips it. Layout props such
 *    as `width` cannot run natively, which is why the old width-animated fill stuttered under load;
 *  - the shimmer is a native `translateX` loop that lives inside the fill, so it only shows over the completed part.
 * The fill value is always the real progress fraction (eased, never invented). Returning from the background snaps the
 * fill to the current fraction because native animations may have been dropped while the app was not visible.
 */
function ProgressBar({ fraction, active, reduceMotion, appActive, label, valueText }: { fraction: number; active: boolean; reduceMotion: boolean; appActive: boolean; label: string; valueText: string }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useAnimatedValue(0);
  const shimmer = useAnimatedValue(0);

  useEffect(() => {
    if (reduceMotion || !appActive) {
      fill.stopAnimation();
      fill.setValue(fraction);
      return;
    }
    Animated.timing(fill, { toValue: fraction, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fraction, reduceMotion, appActive, fill]);

  useEffect(() => {
    if (reduceMotion || !active || !appActive) { shimmer.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shimmer, active, reduceMotion, appActive]);

  const translateX = fill.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth, 0], extrapolate: "clamp" });
  const showShimmer = active && !reduceMotion && appActive && trackWidth > 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percentOf(fraction), text: valueText }}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      style={{ height: 10, borderRadius: 5, backgroundColor: colors.sand200, overflow: "hidden" }}
    >
      {trackWidth > 0 ? (
        <Animated.View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: trackWidth, borderRadius: 5, overflow: "hidden", transform: [{ translateX }] }}>
          <LinearGradient colors={gradients.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          {showShimmer ? <Stripe anim={shimmer} trackWidth={trackWidth} stripe={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]} /> : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

type StepStatus = "done" | "active" | "failed" | "pending";

const StepRow = memo(function StepRow({ label, status, index, reduceMotion }: { label: string; status: StepStatus; index: number; reduceMotion: boolean }) {
  const checkmark = useAnimatedValue(0);

  useEffect(() => {
    checkmark.stopAnimation();
    if (status !== "done") {
      checkmark.setValue(0);
      return;
    }
    if (reduceMotion) {
      checkmark.setValue(1);
      return;
    }

    const animation = Animated.timing(checkmark, {
      toValue: 1,
      delay: index * CHECKMARK_STAGGER_MS,
      duration: CHECKMARK_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    animation.start();
    return () => animation.stop();
  }, [checkmark, status, index, reduceMotion]);

  const checkmarkScale = checkmark.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const spinnerOpacity = checkmark.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View className="flex-row items-center" style={{ minHeight: 26 }}>
      <View style={{ width: 22, alignItems: "center", justifyContent: "center" }}>
        {status === "done" ? (
          <Animated.View style={{ opacity: checkmark, transform: [{ scale: checkmarkScale }] }}>
            <Ionicons name="checkmark-circle" size={19} color={colors.brand600} />
          </Animated.View>
        ) : null}
        {status === "active" || status === "done" ? (
          <Animated.View style={{ opacity: spinnerOpacity }}>
            <ActivityIndicator size="small" color={colors.brand600} style={{ transform: [{ scale: 0.72 }] }} />
          </Animated.View>
        ) : null}
        {status === "failed" ? <Ionicons name="alert-circle" size={19} color={colors.gold700} /> : null}
        {status === "pending" ? <Ionicons name="ellipse-outline" size={17} color={colors.ink300} /> : null}
      </View>
      <Txt
        weight={status === "active" || status === "failed" ? "semibold" : "regular"}
        className={`ml-3 flex-1 text-[13px] leading-5 ${status === "pending" ? "text-ink-400" : status === "done" ? "text-ink-500" : "text-ink-900"}`}
      >
        {label}
      </Txt>
    </View>
  );
});

export interface SetupScreenProps {
  progress: StartupProgress;
  /** The database or import step failed; shows the retry experience. */
  failed: boolean;
  /** Native/runtime failure detail, shown on the retry screen to make release-only failures diagnosable. */
  errorMessage?: string | null;
  /** Setup finished: hold briefly, fade out, then call onExited. */
  exiting: boolean;
  onRetry: () => void;
  onExited: () => void;
  /** Fired once the first frame is laid out (used to hide the native splash without a blank flash). */
  onShown?: () => void;
}

/** Branded first-launch setup screen driven by real startup progress. Covers the app until setup completes. */
export function SetupScreen({ progress, failed, errorMessage, exiting, onRetry, onExited, onShown }: SetupScreenProps) {
  const t = useT();
  const { lang } = useLang();
  const reduceMotion = useReduceMotion();
  const appActive = useAppActive();
  const { width, height } = useWindowDimensions();
  const logoSize = Math.round(Math.min(104, Math.max(64, Math.min(width * 0.26, height * 0.13))));

  const enter = useAnimatedValue(0);
  const exit = useAnimatedValue(1);
  const shown = useRef(false);
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: reduceMotion ? 0 : 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter, reduceMotion]);

  useEffect(() => {
    if (!exiting) return;
    // Dwell on the completed state (not progress) so the last checkmark can finish; minimal under Reduce Motion.
    const timer = setTimeout(() => {
      Animated.timing(exit, { toValue: 0, duration: reduceMotion ? 0 : 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished) onExited();
      });
    }, readyHoldMs(reduceMotion));
    return () => clearTimeout(timer);
  }, [exiting, exit, onExited, reduceMotion]);

  const handleLayout = useCallback(() => {
    if (shown.current) return;
    shown.current = true;
    onShown?.();
  }, [onShown]);

  const stage = progress.stage;
  const current = stageIndex(stage);
  const isReady = stage === "ready";
  const percent = percentOf(progress.fraction);
  const headline = failed ? t("setup.error.title") : t(STAGE_KEY[stage]);
  const detail =
    stage === "library"
      ? progress.packsTotal > 0
        ? t("setup.detail.library", { done: progress.packsDone, total: progress.packsTotal })
        : t("setup.detail.libraryLoading")
      : t(DETAIL_KEY[stage]);
  const noteKey: TranslationKey = progress.mode === "firstRun" ? "setup.note.firstRun" : progress.mode === "returning" ? "setup.note.returning" : "setup.note.neutral";
  const enterY = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  const statusFor = (i: number): StepStatus => {
    if (i < current || (isReady && i === current)) return "done";
    if (i === current) return failed ? "failed" : "active";
    return "pending";
  };

  return (
    // The native splash is a flat `bgBody` fill. Starting from the same colour (and the brand mark already visible)
    // keeps the splash -> setup swap free of a colour jump or an empty frame; the gradient then fades in over it.
    <Animated.View onLayout={handleLayout} style={[StyleSheet.absoluteFill, { opacity: exit, backgroundColor: colors.bgBody }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: enter }]}>
        <LinearGradient colors={gradients.signin} style={{ flex: 1 }} />
      </Animated.View>
      <View style={{ flex: 1 }}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={{ width: "100%", maxWidth: 440, alignSelf: "center" }}>
              <View className="items-center">
                <BrandMark size={logoSize} reduceMotion={reduceMotion} appActive={appActive} />
                <Txt font="display" weight="bold" className="text-ink-900 text-[30px] leading-[38px] text-center mt-1">{BRAND.name}</Txt>
                <Txt className="text-ink-500 text-sm leading-5 text-center mt-1">{BRAND.tagline[lang]}</Txt>
              </View>

              <Animated.View style={{ opacity: enter, transform: [{ translateY: enterY }] }}>
              <View className="bg-surface border border-sand-200 mt-7 p-5" style={[shadow.md, { borderRadius: 24 }]}>
                {failed ? (
                  <View accessibilityRole="alert">
                    <View className="flex-row items-center">
                      <View className="w-11 h-11 rounded-full bg-gold-100 items-center justify-center">
                        <Ionicons name="alert-circle-outline" size={26} color={colors.gold700} />
                      </View>
                      <Txt font="display" weight="bold" className="text-ink-900 text-lg leading-6 ml-3 flex-1">{headline}</Txt>
                    </View>
                    <Txt className="text-ink-700 text-sm leading-6 mt-3">{t("setup.error.body")}</Txt>
                    <Txt className="text-ink-500 text-[13px] leading-5 mt-2">{t("setup.error.failedAt", { stage: t(STAGE_KEY[stage]) })}</Txt>
                    {errorMessage ? (
                      <Txt className="text-ink-500 text-xs leading-5 mt-2">{errorMessage.slice(0, 320)}</Txt>
                    ) : null}
                    <Txt className="text-ink-500 text-[13px] leading-5 mt-1">{t("setup.error.hint")}</Txt>
                    <View className="mt-4"><Button label={t("common.retry")} onPress={onRetry} /></View>
                  </View>
                ) : (
                  <>
                    <View className="flex-row items-center justify-between">
                      <Txt weight="semibold" className="text-ink-500 text-xs">{t("setup.step", { n: Math.min(current + 1, STARTUP_STAGES.length), total: STARTUP_STAGES.length })}</Txt>
                      <Txt weight="bold" className="text-brand-700 text-sm">{t("setup.percent", { n: percent })}</Txt>
                    </View>
                    <View accessibilityLiveRegion="polite">
                      <FadeIn key={`h-${stage}`} reduceMotion={reduceMotion}>
                        <Txt font="display" weight="bold" className="text-ink-900 text-[19px] leading-7 mt-2">{isReady ? t("setup.titleReady") : headline}</Txt>
                      </FadeIn>
                      <FadeIn key={`d-${stage}-${progress.packsTotal > 0}`} reduceMotion={reduceMotion}>
                        <Txt className="text-ink-500 text-sm leading-5 mt-1" style={{ minHeight: 40 }}>{detail}</Txt>
                      </FadeIn>
                    </View>
                    <View className="mt-4">
                      <ProgressBar fraction={progress.fraction} active={!isReady} reduceMotion={reduceMotion} appActive={appActive} label={t("setup.a11y.progress")} valueText={t("setup.percent", { n: percent })} />
                    </View>
                    <View className="mt-5 pt-4 border-t border-sand-200 gap-1">
                      {STARTUP_STAGES.map((s, i) => (
                        <StepRow key={s} label={t(STAGE_KEY[s])} status={statusFor(i)} index={i} reduceMotion={reduceMotion} />
                      ))}
                    </View>
                  </>
                )}
              </View>

              {!failed ? (
                <FadeIn key={`n-${progress.mode}`} reduceMotion={reduceMotion}>
                  <View className="flex-row items-start mt-5 px-2">
                    <Ionicons name="cloud-offline-outline" size={18} color={colors.brand700} style={{ marginTop: 1 }} />
                    <Txt className="text-ink-700 text-[13px] leading-5 ml-2 flex-1">{t(noteKey)}</Txt>
                  </View>
                </FadeIn>
              ) : null}
              </Animated.View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
}

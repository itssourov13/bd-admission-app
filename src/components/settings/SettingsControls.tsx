import type { ReactNode } from "react";
import { Pressable, Switch, View } from "react-native";
import { Card, Txt } from "@/components/ui";
import { useTheme } from "@/settings";

/** A titled group of settings rows rendered in one card. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-6">
      <Txt font="display" weight="bold" className="text-ink-900 text-lg mb-3">{title}</Txt>
      <Card className="px-4">{children}</Card>
    </View>
  );
}

/** One row: label (+ optional hint) with free-form content below or a trailing control. Rows are separated by hairlines. */
export function SettingsRow({ label, hint, trailing, children, onPress, first }: { label: string; hint?: string; trailing?: ReactNode; children?: ReactNode; onPress?: () => void; first?: boolean }) {
  const body = (
    <View className={`py-4 ${first ? "" : "border-t border-sand-200"}`}>
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Txt weight="semibold" className="text-ink-900 text-base">{label}</Txt>
          {hint ? <Txt className="text-ink-500 text-xs leading-5 mt-0.5">{hint}</Txt> : null}
        </View>
        {trailing}
      </View>
      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} className="active:opacity-80">{body}</Pressable> : body;
}

/** Single-choice segmented control (radio semantics, 44dp targets). */
export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row rounded-full bg-sand-100 p-1">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={{ minHeight: 40 }}
            className={`flex-1 items-center justify-center rounded-full px-2 ${selected ? "bg-surface border border-sand-300" : ""}`}
          >
            <Txt weight={selected ? "semibold" : "medium"} className={`text-sm ${selected ? "text-brand-700" : "text-ink-500"}`} numberOfLines={1}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Theme-aware switch. */
export function SettingsSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.sand300, true: colors.brand500 }}
      thumbColor={colors.white}
    />
  );
}

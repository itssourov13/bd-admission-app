import { Pressable } from "react-native";
import { Txt } from "@/components/ui";

/** Selectable pill with a 44dp touch target, used for scope and timer choices. */
export function ChoiceChip({ label, selected, onPress, disabled, multi }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; /** Multi-select chips are announced as checkboxes instead of radio buttons. */ multi?: boolean }) {
  return (
    <Pressable
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityState={multi ? { checked: selected, disabled: Boolean(disabled) } : { selected, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: 44 }}
      className={`rounded-full px-4 items-center justify-center border ${selected ? "bg-brand-500 border-brand-500" : "bg-surface border-sand-300"} ${disabled ? "opacity-50" : ""}`}
    >
      <Txt weight="semibold" className={`text-sm ${selected ? "text-white" : "text-ink-700"}`}>{label}</Txt>
    </Pressable>
  );
}

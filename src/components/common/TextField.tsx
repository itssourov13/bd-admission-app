import { TextInput, type TextInputProps } from "react-native";
import { useLang } from "@/i18n";
import { useTheme } from "@/settings";
import { fonts } from "@/theme";

/** Text input with the right font for the active language and a 48dp touch target. */
export function TextField(props: TextInputProps) {
  const { colors } = useTheme();
  const { lang } = useLang();
  return (
    <TextInput
      // Border uses outline (not sand300, 1.4:1 on surface): input boundaries need the 3:1 non-text floor.
      // ink500 (not ink400): placeholder text needs the 4.5:1 text threshold, not the 3:1 UI-component one.
      placeholderTextColor={colors.ink500}
      {...props}
      style={[{ minHeight: 48, borderWidth: 1, borderColor: colors.outline, borderRadius: 16, paddingHorizontal: 14, color: colors.ink900, backgroundColor: colors.surface, fontSize: 16, fontFamily: lang === "bn" ? fonts.bengali : fonts.body }, props.style]}
    />
  );
}

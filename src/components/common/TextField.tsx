import { TextInput, type TextInputProps } from "react-native";
import { useLang } from "@/i18n";
import { colors, fonts } from "@/theme";

/** Text input with the right font for the active language and a 48dp touch target. */
export function TextField(props: TextInputProps) {
  const { lang } = useLang();
  return (
    <TextInput
      placeholderTextColor={colors.ink400}
      {...props}
      style={[{ minHeight: 48, borderWidth: 1, borderColor: colors.sand300, borderRadius: 16, paddingHorizontal: 14, color: colors.ink900, backgroundColor: colors.surface, fontSize: 16, fontFamily: lang === "bn" ? fonts.bengali : fonts.body }, props.style]}
    />
  );
}

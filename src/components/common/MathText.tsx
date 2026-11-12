import { Txt, type TxtProps } from "@/components/ui/Text";
import { useLang } from "@/i18n";
import { useSettings } from "@/settings";
import { formatMathText, spokenMathText } from "../../services/mathText";

/** Plain-text label for assistive technology, e.g. an option's accessibility label. Unchanged when no notation is recognised. */
export function useSpokenMath(): (raw: string) => string {
  const { lang } = useLang();
  return (raw) => spokenMathText(raw, lang);
}

/**
 * Text with powers, ionic charges, sub/superscripts and unit-vector hats rendered as real notation. The stored string
 * is never changed; only the displayed string is transformed, and the screen-reader label spells the notation out.
 */
export function MathText({ children, accessibilityLabel, size, lineHeight, style, ...rest }: Omit<TxtProps, "children"> & { children: string; size?: number; lineHeight?: number }) {
  const { lang } = useLang();
  const { textScale } = useSettings();
  // When a base size is given the text honours the "question text size" setting; otherwise className sizing is untouched.
  const scaled = size ? { fontSize: Math.round(size * textScale * 10) / 10, lineHeight: Math.round((lineHeight ?? size * 1.5) * textScale * 10) / 10 } : undefined;
  const shown = formatMathText(children);
  const label = accessibilityLabel ?? (shown !== children ? spokenMathText(children, lang) : undefined);
  return <Txt {...rest} style={[style, scaled]} accessibilityLabel={label}>{shown}</Txt>;
}

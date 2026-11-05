import { Txt, type TxtProps } from "@/components/ui/Text";
import { useLang } from "@/i18n";
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
export function MathText({ children, accessibilityLabel, ...rest }: Omit<TxtProps, "children"> & { children: string }) {
  const { lang } = useLang();
  const shown = formatMathText(children);
  const label = accessibilityLabel ?? (shown !== children ? spokenMathText(children, lang) : undefined);
  return <Txt {...rest} accessibilityLabel={label}>{shown}</Txt>;
}

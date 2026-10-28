import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { translations, type Lang, type TranslationKey } from "./translations";

export type { Lang, TranslationKey };

export const LANG_STORAGE = "bd_admission_language_v1";

type LangContextValue = {
  lang: Lang;
  setLang: (language: Lang) => void;
  ready: boolean;
};

const LangContext = createContext<LangContextValue>({
  lang: "bn",
  setLang: () => undefined,
  ready: false
});

function deviceDefault(): Lang {
  try {
    return getLocales()[0]?.languageCode?.toLowerCase() === "en" ? "en" : "bn";
  } catch {
    return "bn";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_STORAGE);
        if (active) {
          setLangState(stored === "bn" || stored === "en" ? stored : deviceDefault());
        }
      } catch {
        if (active) setLangState(deviceDefault());
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const setLang = useCallback((language: Lang) => {
    setLangState(language);
    void AsyncStorage.setItem(LANG_STORAGE, language).catch(() => undefined);
  }, []);

  return <LangContext.Provider value={{ lang, setLang, ready }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Renders Latin digits as Bengali digits when the language is Bangla. */
export function localizeDigits(value: string | number, lang: Lang): string {
  const text = String(value);
  return lang === "bn" ? text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : text;
}

export type TParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TParams) => string;

/** Numeric params are digit-localized; string params (names, keys) are inserted untouched. */
export function translate(lang: Lang, key: TranslationKey, params?: TParams): string {
  const entry = translations[key];
  const template: string = entry[lang] ?? entry.en;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === "number" ? localizeDigits(value, lang) : value;
  });
}

export function useT(): TFunction {
  const { lang } = useLang();
  return useCallback((key, params) => translate(lang, key, params), [lang]);
}

export function useNum(): (value: string | number) => string {
  const { lang } = useLang();
  return useCallback((value) => localizeDigits(value, lang), [lang]);
}

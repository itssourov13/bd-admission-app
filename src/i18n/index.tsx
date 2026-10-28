import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  const setLang = (language: Lang) => {
    setLangState(language);
    void AsyncStorage.setItem(LANG_STORAGE, language).catch(() => undefined);
  };

  return <LangContext.Provider value={{ lang, setLang, ready }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useT() {
  const { lang } = useLang();
  return (key: TranslationKey): string => {
    const entry = translations[key];
    return entry[lang] ?? entry.en;
  };
}

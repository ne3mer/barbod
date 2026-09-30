"use client";

import * as React from "react";
import { type Language, type TranslationKeys, translations } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = React.createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang === "hu" || urlLang === "en") return urlLang;
    const saved = localStorage.getItem("barbod_lang");
    if (saved === "hu" || saved === "en") return saved;
    return "en";
  });

  const setLang = React.useCallback((nextLang: Language) => {
    setLangState(nextLang);
    localStorage.setItem("barbod_lang", nextLang);

    // Update URL query parameter cleanly without reloading
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLang);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const value = React.useMemo(
    () => ({
      lang,
      setLang,
      t: translations[lang] || translations.en,
    }),
    [lang, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 text-xs font-medium ${
        className ?? ""
      }`}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "en"
            ? "bg-primary text-primary-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hu")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "hu"
            ? "bg-primary text-primary-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        HU
      </button>
    </div>
  );
}

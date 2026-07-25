import { translations, Translation } from "./translations";

export type SupportedLanguage = keyof typeof translations;

export const DEFAULT_LANGUAGE: SupportedLanguage = "English";

/**
 * Returns the translation object for the requested language.
 * Falls back to English if the language is missing or undefined.
 */
export function getText(language?: string): Translation {
  if (!language) return translations[DEFAULT_LANGUAGE];

  return (
    translations[language as SupportedLanguage] ??
    translations[DEFAULT_LANGUAGE]
  );
}

/**
 * Type guard.
 */
export function isSupportedLanguage(
  language?: string
): language is SupportedLanguage {
  return !!language && language in translations;
}

/**
 * Returns all supported languages.
 * Useful if you add a language picker later.
 */
export const supportedLanguages = Object.keys(
  translations
) as SupportedLanguage[];
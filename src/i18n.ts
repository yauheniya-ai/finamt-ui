import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./locales/de.json";
import en from "./locales/en.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: "de",          // default language
    fallbackLng: "de",  // fall back to DE if a key is missing in EN
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
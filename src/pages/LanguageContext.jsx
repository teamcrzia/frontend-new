import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

// Central list of supported interface languages. `code` is the value
// stored/persisted, `label` is what shows in the dropdown.
// Weighted toward Indian languages (given the ₹ pricing) plus a few
// major global ones — swap/add entries here to change what shows up
// in the dropdown everywhere in the app.
export const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "ar", label: "العربية (Arabic)" },
];

// Minimal translation dictionary. Add a `key` here and call t(key) to
// have it change with the selected language. This currently only
// covers the strings actually wired up on the Settings page — extend
// this object (and call useLanguage()/t() from any other page) to
// bring the same switching to the chat UI and beyond.
const translations = {
  "en-US": {
    settings: "Settings",
    profile: "Profile",
    profileDesc: "Manage your public identity and personal information across the intelligence network.",
    editProfile: "Edit Profile",
    preferences: "Preferences",
    preferencesDesc: "Customize the interface to match your workflow and aesthetic taste.",
    themeToggle: "Dark / Light Mode",
    interfaceLanguage: "Interface Language",
    subscription: "Subscription",
    subscriptionDesc: "Manage your access level and billing cycles for SmartAI services.",
    activePlan: "ACTIVE PLAN",
    currentPlan: "Current Plan",
    manageSubscription: "Manage Subscription",
    upgradeToPro: "Upgrade to Pro",
    security: "Security",
    securityDesc: "Protect your account and maintain data privacy with robust security tools.",
    password: "Password",
    changePassword: "Change password",
    twoFactor: "Two-Factor Authentication",
    comingSoon: "COMING SOON",
  },
  hi: {
    settings: "सेटिंग्स",
    profile: "प्रोफ़ाइल",
    profileDesc: "अपनी सार्वजनिक पहचान और व्यक्तिगत जानकारी प्रबंधित करें।",
    editProfile: "प्रोफ़ाइल संपादित करें",
    preferences: "प्राथमिकताएँ",
    preferencesDesc: "अपने वर्कफ़्लो और पसंद के अनुसार इंटरफ़ेस को अनुकूलित करें।",
    themeToggle: "डार्क / लाइट मोड",
    interfaceLanguage: "इंटरफ़ेस भाषा",
    subscription: "सदस्यता",
    subscriptionDesc: "अपने एक्सेस स्तर और बिलिंग चक्र प्रबंधित करें।",
    activePlan: "सक्रिय योजना",
    currentPlan: "वर्तमान योजना",
    manageSubscription: "सदस्यता प्रबंधित करें",
    upgradeToPro: "प्रो में अपग्रेड करें",
    security: "सुरक्षा",
    securityDesc: "मज़बूत सुरक्षा उपकरणों से अपने खाते की सुरक्षा करें।",
    password: "पासवर्ड",
    changePassword: "पासवर्ड बदलें",
    twoFactor: "दो-चरणीय प्रमाणीकरण",
    comingSoon: "जल्द आ रहा है",
  },
};

// Any language without a full translation set falls back to English
// rather than showing missing keys.
const getDictionary = (code) => translations[code] || translations["en-US"];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("appLanguage") || "en-US"
  );

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const setLanguage = (code) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      setLanguageState(code);
    }
  };

  const dictionary = useMemo(() => getDictionary(language), [language]);
  const t = (key) => dictionary[key] || translations["en-US"][key] || key;

  const value = { language, setLanguage, t, languages: SUPPORTED_LANGUAGES };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
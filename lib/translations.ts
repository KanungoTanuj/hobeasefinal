export type Language = "en" | "hi" | "es" | "de" | "fr"

// Cache for storing translations to avoid repeated API calls
const translationCache = new Map<string, string>()

const fallbackTranslations: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    "Master any Skill": "कोई भी कौशल सीखें",
    "Start Learning Today": "आज ही सीखना शुरू करें",
    Language: "भाषा",
    About: "के बारे में",
    Contact: "संपर्क",
    "Become a Teacher": "शिक्षक बनें",
    "Sign In": "साइन इन करें",
    "Join as Learner": "शिक्षार्थी के रूप में जुड़ें",
    "Start Your Journey": "अपनी यात्रा शुरू करें",
    "Become an Instructor": "प्रशिक्षक बनें",
    "Search for skills, hobbies, or instructors...": "कौशल, शौक या प्रशिक्षकों की खोज करें...",
    "Web Development": "वेब डेवलपमेंट",
    "Digital Marketing": "डिजिटल मार्केटिंग",
    "Graphic Design": "ग्राफिक डिज़ाइन",
    Photography: "फोटोग्राफी",
    "Data Science": "डेटा साइंस",
    "Music Production": "संगीत निर्माण",
    "Learn from experts": "विशेषज्ञों से सीखें",
    "Flexible scheduling": "लचीला समय निर्धारण",
    "Affordable pricing": "किफायती मूल्य निर्धारण",
    "Ready to start learning?": "सीखना शुरू करने के लिए तैयार हैं?",
    "Join thousands of learners": "हजारों शिक्षार्थियों से जुड़ें",
    "We're here to unlock potential": "हम क्षमता को अनलॉक करने के लिए यहाँ हैं",
    "Our Story": "हमारी कहानी",
    "Our Vision": "हमारा दृष्टिकोण",
    "Join as Teacher": "शिक्षक के रूप में जुड़ें",
  },
  es: {
    "Master any Skill": "Domina cualquier habilidad",
    "Start Learning Today": "Comienza a aprender hoy",
    Language: "Idioma",
    About: "Acerca de",
    Contact: "Contacto",
    "Become a Teacher": "Conviértete en profesor",
    "Sign In": "Iniciar sesión",
    "Join as Learner": "Únete como estudiante",
    "Start Your Journey": "Comienza tu viaje",
    "Become an Instructor": "Conviértete en instructor",
    "Search for skills, hobbies, or instructors...": "Buscar habilidades, pasatiempos o instructores...",
    "Web Development": "Desarrollo Web",
    "Digital Marketing": "Marketing Digital",
    "Graphic Design": "Diseño Gráfico",
    Photography: "Fotografía",
    "Data Science": "Ciencia de Datos",
    "Music Production": "Producción Musical",
    "Learn from experts": "Aprende de expertos",
    "Flexible scheduling": "Horarios flexibles",
    "Affordable pricing": "Precios asequibles",
    "Ready to start learning?": "¿Listo para empezar a aprender?",
    "Join thousands of learners": "Únete a miles de estudiantes",
    "We're here to unlock potential": "Estamos aquí para desbloquear el potencial",
    "Our Story": "Nuestra Historia",
    "Our Vision": "Nuestra Visión",
    "Join as Teacher": "Únete como profesor",
  },
  de: {
    "Master any Skill": "Jede Fähigkeit meistern",
    "Start Learning Today": "Heute mit dem Lernen beginnen",
    Language: "Sprache",
    About: "Über uns",
    Contact: "Kontakt",
    "Become a Teacher": "Lehrer werden",
    "Sign In": "Anmelden",
    "Join as Learner": "Als Lernender beitreten",
    "Start Your Journey": "Beginne deine Reise",
    "Become an Instructor": "Instruktor werden",
    "Search for skills, hobbies, or instructors...": "Suche nach Fähigkeiten, Hobbys oder Instruktoren...",
    "Web Development": "Webentwicklung",
    "Digital Marketing": "Digitales Marketing",
    "Graphic Design": "Grafikdesign",
    Photography: "Fotografie",
    "Data Science": "Datenwissenschaft",
    "Music Production": "Musikproduktion",
    "Learn from experts": "Von Experten lernen",
    "Flexible scheduling": "Flexible Terminplanung",
    "Affordable pricing": "Erschwingliche Preise",
    "Ready to start learning?": "Bereit mit dem Lernen zu beginnen?",
    "Join thousands of learners": "Schließe dich Tausenden von Lernenden an",
    "We're here to unlock potential": "Wir sind hier, um Potenzial freizusetzen",
    "Our Story": "Unsere Geschichte",
    "Our Vision": "Unsere Vision",
    "Join as Teacher": "Als Lehrer beitreten",
  },
  fr: {
    "Master any Skill": "Maîtrisez n'importe quelle compétence",
    "Start Learning Today": "Commencez à apprendre aujourd'hui",
    Language: "Langue",
    About: "À propos",
    Contact: "Contact",
    "Become a Teacher": "Devenir enseignant",
    "Sign In": "Se connecter",
    "Join as Learner": "Rejoindre en tant qu'apprenant",
    "Start Your Journey": "Commencez votre voyage",
    "Become an Instructor": "Devenir instructeur",
    "Search for skills, hobbies, or instructors...": "Rechercher des compétences, loisirs ou instructeurs...",
    "Web Development": "Développement Web",
    "Digital Marketing": "Marketing Digital",
    "Graphic Design": "Design Graphique",
    Photography: "Photographie",
    "Data Science": "Science des Données",
    "Music Production": "Production Musicale",
    "Learn from experts": "Apprenez des experts",
    "Flexible scheduling": "Horaires flexibles",
    "Affordable pricing": "Prix abordables",
    "Ready to start learning?": "Prêt à commencer à apprendre?",
    "Join thousands of learners": "Rejoignez des milliers d'apprenants",
    "We're here to unlock potential": "Nous sommes là pour libérer le potentiel",
    "Our Story": "Notre Histoire",
    "Our Vision": "Notre Vision",
    "Join as Teacher": "Rejoindre en tant qu'enseignant",
  },
}

// Google Translate API endpoint (you can also use other services like DeepL, Azure Translator, etc.)
const TRANSLATE_API_URL = "https://api.mymemory.translated.net/get"

export async function translateText(text: string, targetLanguage: Language): Promise<string> {
  // Return original text if target language is English
  if (targetLanguage === "en") {
    return text
  }

  // Create cache key
  const cacheKey = `${text}_${targetLanguage}`

  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  if (fallbackTranslations[targetLanguage][text]) {
    const fallbackText = fallbackTranslations[targetLanguage][text]
    translationCache.set(cacheKey, fallbackText)
    return fallbackText
  }

  console.warn(`Translation not available for "${text}" in ${targetLanguage}, using original text`)
  translationCache.set(cacheKey, text)
  return text

  /*
  try {
    // Using MyMemory Translation API (free tier available)
    const response = await fetch(`${TRANSLATE_API_URL}?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`)

    if (!response.ok) {
      throw new Error("Translation API request failed")
    }

    const data = await response.json()

    if (data.responseStatus === 403 || data.matches?.[0]?.match < 0.3) {
      console.warn("Translation API rate limit reached, using fallback")
      return fallbackTranslations[targetLanguage][text] || text
    }

    const translatedText = data.responseData?.translatedText || text

    // Cache the translation
    translationCache.set(cacheKey, translatedText)

    return translatedText
  } catch (error) {
    console.error("Translation error:", error)
    return fallbackTranslations[targetLanguage][text] || text
  }
  */
}

// Hook for using translations in components
export function useTranslation(language: Language) {
  const translate = async (text: string): Promise<string> => {
    return await translateText(text, language)
  }

  return { translate }
}

// Language display names
export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
}

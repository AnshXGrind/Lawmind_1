/**
 * Simple multilingual support for LawMind.
 */

export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te';

export const translations = {
  en: {
    dashboard: 'Dashboard',
    research: 'Clause Research',
    qa: 'Legal Q&A',
    analysis: 'Doc Analysis',
    calendar: 'Calendar',
    welcome: 'Welcome back, Adv.',
    askQuestion: 'Ask a legal question...',
    uploadDoc: 'Upload Document',
    upgrade: 'Upgrade Now',
    choosePlan: 'Choose Your Plan'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    research: 'धारा अनुसंधान',
    qa: 'कानूनी प्रश्नोत्तर',
    analysis: 'दस्तावेज़ विश्लेषण',
    calendar: 'कैलेंडर',
    welcome: 'स्वागत है, एडवोकेट',
    askQuestion: 'कानूनी सवाल पूछें...',
    uploadDoc: 'दस्तावेज़ अपलोड करें',
    upgrade: 'अभी अपग्रेड करें',
    choosePlan: 'अपनी योजना चुनें'
  },
  // Add more as needed
};

export function getTranslation(lang: Language, key: keyof typeof translations['en']) {
  return translations[lang]?.[key] || translations['en'][key];
}

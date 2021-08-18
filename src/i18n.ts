import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

const currentLanguage = 'en';

i18next.use(Backend).init({
  // debug: true,
  initImmediate: false,
  lng: currentLanguage,
  ns: 'translation',
  fallbackLng: 'en',
  backend: { loadPath: './locales/{{lng}}/{{ns}}.json' },
});

export default i18next;

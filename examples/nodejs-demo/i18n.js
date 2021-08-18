import i18n from 'i18next';
import Backend from 'i18next-fs-backend';

const currentLanguage = 'en';

i18n.use(Backend).init({
  // debug: true,
  initImmediate: false, // setting initImediate to false, will load the resources synchronously
  lng: currentLanguage,
  ns: 'translation',
  fallbackLng: 'en',
  backend: { loadPath: './locales/{{lng}}/{{ns}}.json' },
});

export default i18n;

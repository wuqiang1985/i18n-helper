import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

import { parseI18nConf } from './util/fileHelper';

const i18nConf = parseI18nConf(undefined, undefined, false);

i18next.use(Backend).init({
  // debug: true,
  initImmediate: false,
  lng: i18nConf?.cliLang ?? 'zh',
  ns: i18nConf?.transFileName ?? 'translation',
  fallbackLng: 'en',
  backend: { loadPath: './src/locales/{{lng}}/{{ns}}.json' },
  interpolation: {
    escapeValue: false,
  },
});

// eslint-disable-next-line import/no-mutable-exports
let { t } = i18next;
t = t.bind(i18next);

export default i18next;
export { t };

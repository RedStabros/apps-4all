import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import tr from './locales/tr.json';
import pl from './locales/pl.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import ru from './locales/ru.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
// Phase 2 LTR Languages
import bn from './locales/bn.json';
import fil from './locales/fil.json';
import sw from './locales/sw.json';
import ha from './locales/ha.json';
import ms from './locales/ms.json';
import uk from './locales/uk.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import mr from './locales/mr.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  it: { translation: it },
  tr: { translation: tr },
  pl: { translation: pl },
  hi: { translation: hi },
  id: { translation: id },
  ru: { translation: ru },
  fr: { translation: fr },
  de: { translation: de },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  ko: { translation: ko },
  ja: { translation: ja },
  vi: { translation: vi },
  th: { translation: th },
  // Phase 2 LTR Languages
  bn: { translation: bn },
  fil: { translation: fil },
  sw: { translation: sw },
  ha: { translation: ha },
  ms: { translation: ms },
  uk: { translation: uk },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr }
};

const deviceLanguage = getLocales()[0]?.languageTag || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

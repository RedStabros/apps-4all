import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  i18n: {
    defaultLocale: "en",
    locales: [
      "en", "es", "pt", "it", "tr", "pl", "hi", "id", "ru", "fr", "de", "zh-CN", "zh-TW", "ko", "ja", "vi", "th",
      "bn", "fil", "sw", "ha", "ms", "uk", "ta", "te", "mr"
    ],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  }
});

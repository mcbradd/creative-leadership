import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://mcbradd.github.io',
  base: '/creative-leadership/portfolio',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: {enabled:false},
  integrations: [sitemap()],
});

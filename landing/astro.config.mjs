import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://piyushpradhan.github.io',
  base: '/recall',
  build: {
    assets: 'assets',
  },
});

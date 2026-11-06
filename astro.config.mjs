// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

function sitio() {
  const explicita = String(process.env.SITE || '').trim().replace(/\/$/, '');
  if (explicita) return explicita;
  const vercel = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
  console.warn('Definí SITE con la URL pública para el sitemap y las URLs canónicas.');
  return 'http://localhost:4321';
}

// https://astro.build/config
export default defineConfig({
  site: sitio(),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
// Static build. Set SITE_BASE=/repo-name/ when you deploy under a sub-path (e.g. GitHub Pages).
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.SITE_BASE || '/',
  output: 'static',
  trailingSlash: 'ignore',
  // Renamed projects forward from their old URLs: src/pages/projects/[old].astro.
  build: { inlineStylesheets: 'always' },
  server: { host: '127.0.0.1', port: 4321 },
  devToolbar: { enabled: false },
});

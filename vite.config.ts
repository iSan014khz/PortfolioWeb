import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, import.meta.dirname, 'VITE_')
  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VITE_VERCEL_PROJECT_PRODUCTION_URL
  const configuredSite = productionDomain ? `https://${productionDomain}` : environment.VITE_SITE_URL
  const siteUrl = configuredSite ? new URL(configuredSite).origin : ''
  return {
  plugins: [react(), tailwindcss(), {
    name: 'production-site-metadata',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: html => html.replaceAll('%VITE_SITE_URL%', siteUrl),
    },
    closeBundle() {
      if (!siteUrl) return
      const output = path.join(import.meta.dirname, 'dist')
      writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
      writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>\n`)
    },
  }],
  resolve: {
    alias: {
      // `import.meta.dirname` en lugar de `__dirname`: este ultimo no existe en ESM y Vite ya
      // avisa de que dejara de parchearlo cuando el cargador nativo pase a ser el predeterminado.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Las dependencias cambian mucho menos que el codigo del sitio: en su propio chunk
        // sobreviven a cada despliegue en la cache del navegador en vez de reinvalidarse.
        // Vite 8 usa rolldown, cuya API de agrupacion es `advancedChunks`, no `manualChunks`.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|framer-motion)[\\/]/ },
            { name: 'flubber', test: /node_modules[\\/](flubber|topojson-client|svg-path-properties)[\\/]/ },
          ],
        },
      },
    },
  },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 }
          },
          {
            urlPattern: /\/assets\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'assets-cache' }
          }
        ]
      },
      manifest: {
        name: 'LEDGERFALL: Rise Through the Audit',
        short_name: 'LEDGERFALL',
        description: 'The professional audit simulation game. Rise Through the Audit.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0D0D2B',
        theme_color: '#8B0000',
        orientation: 'portrait',
        icons: [
          { src: '/assets/logo/10.2_ledgerfall_app_icon.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/logo/10.2_ledgerfall_app_icon.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})

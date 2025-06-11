import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'src/assets/etrs-bg.jpg'],
      manifest: {
        name: 'MCCI Testers',
        short_name: 'MCCI Beta Testers',
        description: 'Join our beta testing program',
        theme_color: '#fdb900',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
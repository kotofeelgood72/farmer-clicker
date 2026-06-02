import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
import Icons from 'unplugin-icons/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build works when served from any subpath
  // (Yandex Games draft mode serves the bundle from a hashed folder).
  base: './',
  plugins: [
    vue(),
    // vueDevTools(),
    Icons({
      compiler: 'vue3',
      autoInstall: false,
      defaultClass: 'iconify',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

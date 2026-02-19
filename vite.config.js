import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Required for browser extensions to load assets correctly
  plugins: [
    react(),
    nodePolyfills(),
  ],
})

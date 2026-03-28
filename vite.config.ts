import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: '/crystal-cathedral/',
  plugins: [
    react(),
    glsl(),
    basicSsl(),
  ],
  server: {
    host: true,
  },
})

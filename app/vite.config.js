import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under GitHub Pages' /<repo-name>/ subpath
  // without hardcoding the repo name here.
  base: './',
  plugins: [react(), tailwindcss()],
})

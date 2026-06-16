import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** @type {import('vite').UserConfig} */
const config = {
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' }
}

// Cloudflare Pages: conditionally add CF plugin
if (process.env.CF_PAGES) {
  const { default: cf } = await import('@cloudflare/vite-plugin')
  config.plugins.push(cf())
}

export default defineConfig(config)

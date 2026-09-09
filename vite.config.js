import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // public/ holds the staged Figma exports. Only bundle them for modes that
  // actually read them from disk — once review is pointed at the CDN, its
  // VITE_IMAGE_BASE becomes an absolute URL and public/ stops being copied.
  const usesLocalImages = !/^https?:/.test(env.VITE_IMAGE_BASE || '')

  return {
    plugins: [svelte()],
    base: env.VITE_BASE_URL || '/',
    publicDir: usesLocalImages ? 'public' : false,
  }
})

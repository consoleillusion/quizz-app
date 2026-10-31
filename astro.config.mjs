// @ts-check
import {defineConfig} from "astro/config"
import {loadEnv} from "vite"
import svelte from "@astrojs/svelte"

// .env isn't in process.env when Astro runs under Node, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "")

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  server: {host: true, port: Number(env.ASTRO_PORT ?? 4321)},
})

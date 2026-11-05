// @ts-check
import {defineConfig} from "astro/config"
import {loadEnv} from "vite"
import svelte from "@astrojs/svelte"
import node from "@astrojs/node"

// .env isn't in process.env when Astro runs under Node, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "")
// Server secrets are read from process.env at run time (never inlined into the build); `bun run start` loads .env itself.
process.env.OPAQUE_SERVER_SETUP ??= env.OPAQUE_SERVER_SETUP

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({mode: "standalone"}),
  integrations: [svelte()],
  trailingSlash: "never",
  server: {host: true, port: Number(env.ASTRO_PORT ?? 4321)},
})

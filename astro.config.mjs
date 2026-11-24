// @ts-check
import {fileURLToPath} from "node:url"
import {defineConfig} from "astro/config"
import {loadEnv} from "vite"
import svelte from "@astrojs/svelte"
import node from "@astrojs/node"

// .env isn't in process.env when Astro runs under Node, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "")
// Server secrets are read from process.env at run time (never inlined into the build); `bun run start` loads .env itself.
process.env.OPAQUE_SERVER_SETUP ??= env.OPAQUE_SERVER_SETUP

// wacss ships its sources and generates its stylesheet (`bun run wacss`) inside its own folder; these aliases give
// them the import paths of its documentation: wacss/components/<Name>/<Name>.<ext> and wacss/wacss.css.
const wacss = fileURLToPath(new URL("./node_modules/wacss/", import.meta.url))

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({mode: "standalone"}),
  integrations: [svelte()],
  trailingSlash: "never",
  server: {host: true, port: Number(env.ASTRO_PORT ?? 4321)},
  vite: {
    resolve: {
      alias: [
        {find: /^wacss\/components\//, replacement: `${wacss}src/components/`},
        {find: /^wacss\/wacss\.css$/, replacement: `${wacss}dist/wacss.css`},
      ],
    },
    // wacss and bits-ui ship Svelte sources; let vite-plugin-svelte compile them in the browser bundle and on the server.
    ssr: {noExternal: ["wacss", "bits-ui"]},
    optimizeDeps: {exclude: ["bits-ui"]},
  },
})

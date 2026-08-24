import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const STATIC = process.env["STATIC_BUILD"] === "true";

const rawBase = process.env["BASE_PATH"] ?? "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  base,

  plugins: [
    ...(STATIC
      ? []
      : [
          tanstackStart({
            server: {
              entry: "server",
            },
          }),
          nitro({
            preset: "node-server",
          }),
        ]),

    ...(STATIC
      ? [
          tanstackStart({
            spa: {
              enabled: true,
            },
            prerender: {
              enabled: true,
            },
          }),
        ]
      : []),

    tailwindcss(),
    tsconfigPaths(),
    viteReact(),
  ],

  server: {
    host: "0.0.0.0",
  },
});
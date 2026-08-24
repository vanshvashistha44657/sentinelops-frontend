import { defineConfig } from "@Lovable.dev/vite-tanstack-config";

const STATIC = process.env["STATIC_BUILD"] === "true";

const rawBase = process.env["BASE_PATH"] ?? "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  // Render / Node production server
  ...(!STATIC
    ? {
        nitro: {
          preset: "node-server",
        },
      }
    : {
        nitro: false as const,
      }),

  tanstackStart: {
    ...(!STATIC
      ? {
          server: {
            entry: "server" as const,
          },
        }
      : {
          spa: {
            enabled: true,
          },
          prerender: {
            enabled: true,
          },
        }),
  },

  vite: {
    base,
  },
});
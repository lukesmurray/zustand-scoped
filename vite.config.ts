/**
 * @fileoverview The vite config file.
 */
/// <reference types="vite/client" />
/// <reference types="vitest" />

import path from "node:path";
import url from "node:url";

import type { ModuleFormat } from "rollup";
import { defineConfig } from "vite";

import packageJson from "./package.json";
import tsconfigJson from "./tsconfig.json";

function getPackageName() {
  return packageJson.name;
}

function getPackageNameCamelCase() {
  try {
    return getPackageName().replace(/-./g, (char) => char[1].toUpperCase());
  } catch {
    throw new Error("Name property in package.json is missing.");
  }
}

const fileName: Record<ModuleFormat & ("es" | "cjs"), string> = {
  es: `index.mjs`,
  cjs: `index.js`,
};

/**
 * The exported vite config
 *
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  base: "./",
  esbuild: {
    // override tsconfig to only include src
    tsconfigRaw: JSON.stringify({
      ...tsconfigJson,
      include: ["src"],
    }),
  },
  build: {
    lib: {
      entry: path.resolve(
        path.dirname(url.fileURLToPath(import.meta.url)),
        "src/index.ts"
      ),
      name: getPackageNameCamelCase(),
      formats: ["es", "cjs"],
      fileName: (format) => fileName[format],
    },
    rollupOptions: {
      external: ["react", "zustand", "zustand/middleware"],
      output: {
        globals: {},
      },
      plugins: [],
    },
    outDir: "dist/lib",
  },
  test: {
    globals: true,
    environment: "jsdom",
    outputDiffLines: 100,
    outputTruncateLength: 1000,
    setupFiles: ["./tests/setupVitest.ts"],
  },
});

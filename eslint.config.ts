import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
// @ts-expect-error wxt doesn't provide types for it yet
import autoImports from "./.wxt/eslint-auto-imports.mjs"
// sets up both eslint plugin and eslint config in one go
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

export default defineConfig([
  autoImports,
  globalIgnores([".output/*", ".wxt/*"]),
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions, ...globals.serviceworker } },
  },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  // pluginReact.configs.flat.recommended doesn't have predefined settings property. So no need to spread it over here
  { ...pluginReact.configs.flat.recommended, settings: { react: { version: "19" } } },
  pluginReact.configs.flat["jsx-runtime"],
  eslintPluginPrettierRecommended,
])

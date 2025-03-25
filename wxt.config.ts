import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  manifest: {
    name: "__MSG_extension_name__",
    description: "__MSG_extension_description__",
    default_locale: "en",
    host_permissions: [],
    permissions: [],
  },
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons", "@wxt-dev/i18n/module"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
})

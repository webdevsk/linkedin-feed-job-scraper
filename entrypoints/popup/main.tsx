import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
// Supports weights 100-900
import "@fontsource-variable/inter"
import "@/assets/style.css"

document.title = i18n.t("extension_name")
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

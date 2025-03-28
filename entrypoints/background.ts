import { customLog } from "@/utils/customLog"

export default defineBackground(() => {
  customLog("Hello background!", { id: browser.runtime.id })
})

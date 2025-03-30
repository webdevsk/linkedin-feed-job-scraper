import { customLog } from "@/utils/customLog"
import { registerJobPostService } from "@/utils/job-post-service"

export default defineBackground(() => {
  customLog("Hello background!", { id: browser.runtime.id })
  registerJobPostService()
})

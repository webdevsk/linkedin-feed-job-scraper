import { injectConsole } from "@/utils/injectConsole"
import { registerJobPostService } from "@/utils/job-post-service"
injectConsole()

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id })
  registerJobPostService()

  // jobPostsStorage.watch((newValue, oldValue) => {
  //   customLog(newValue)
  // })
})

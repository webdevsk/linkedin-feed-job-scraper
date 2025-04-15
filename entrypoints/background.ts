import { registerJobPostService } from "@/utils/job-post-service"

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id })
  registerJobPostService()

  jobPostsStorage.watch((newValue, oldValue) => {
    console.log(newValue)
  })
})

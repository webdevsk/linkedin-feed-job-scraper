// import { registerJobPostService } from "@/utils/job-post-service"

import { activeTabIdStorage } from "@/utils/storage"

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id })
  // registerJobPostService()
  onMessage("triggerReadyState", (message) => {
    const tabId = message.sender.tab?.id ?? null
    if (!tabId) console.error("No tab id found", message.sender)
    activeTabIdStorage.setValue(message.data ? tabId : null)
  })
})

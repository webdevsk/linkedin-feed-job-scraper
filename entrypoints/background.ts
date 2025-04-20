// import { registerJobPostService } from "@/utils/job-post-service"

import { activeTabIdStorage } from "@/utils/storage"

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id })
  // registerJobPostService()
  onMessage("triggerReadyState", (event) => {
    console.log(event)
    const tabId = event.sender.tab?.id ?? null
    if (!tabId) console.error("No tab id found", event.sender)
    activeTabIdStorage.setValue(event.data ? tabId : null)
  })

  onMessage("triggerRunningState", (event) => {
    console.log(event)
    const tabId = event.sender.tab?.id ?? null
    if (!tabId) console.error("No tab id found", event.sender)
    runningTabIdStorage.setValue(event.data ? tabId : null)
  })
})

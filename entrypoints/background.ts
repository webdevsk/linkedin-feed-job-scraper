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

  // Update life time scraped count whenever job posts get updated
  jobPostsStorage.watch(async (jobStorageObject) => {
    const prevValue = await lifeTimeScrapedStorage.getValue()
    lifeTimeScrapedStorage.setValue(prevValue + Object.keys(jobStorageObject).length)
  })
})

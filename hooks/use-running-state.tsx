import { runningTabIdStorage, RunningTabIdStorageValue } from "@/utils/storage"

export const useRunningState = (): [true, number] | [false, null] => {
  const [[isRunning, tabId], setState] = useState<[boolean, RunningTabIdStorageValue]>([false, null])

  const handleRunningState = async (tabId: RunningTabIdStorageValue) => {
    if (!tabId) return setState([false, null])

    try {
      await chrome.tabs.get(tabId)
      return setState([true, tabId])
    } catch (error) {
      console.error(error)
      // Assuming tab isn't there
      runningTabIdStorage.setValue(null)
      return setState([false, null])
    }
  }

  useEffect(() => {
    runningTabIdStorage.getValue().then(handleRunningState)
    const stopWatcher = runningTabIdStorage.watch(handleRunningState)

    return () => {
      stopWatcher()
    }
  }, [])

  return isRunning ? [isRunning, tabId as number] : [isRunning, tabId as null]
}

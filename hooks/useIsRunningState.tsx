import { runningTabIdStorage, RunningTabIdStorageValue } from "@/utils/storage"

export const useIsRunningState = (): boolean => {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  console.log("isRunning", isRunning)

  const handleRunningState = async (tabId: RunningTabIdStorageValue) => {
    if (!tabId) return setIsRunning(false)

    try {
      await chrome.tabs.get(tabId)
      return setIsRunning(true)
    } catch (error) {
      console.error(error)
      // Assuming tab isn't there
      runningTabIdStorage.setValue(null)
      return setIsRunning(false)
    }
  }

  useEffect(() => {
    runningTabIdStorage.getValue().then(handleRunningState)
    const stopWatcher = runningTabIdStorage.watch(handleRunningState)

    return () => {
      stopWatcher()
    }
  }, [])

  return isRunning
}

import { ActiveTabIdStorageValue } from "@/utils/storage"

export const useIsReadyState = (): boolean => {
  const [isReady, setIsReady] = useState<boolean>(false)
  console.log("isReady", isReady)

  const handleReadyState = async (tabId: ActiveTabIdStorageValue) => {
    if (!tabId) return setIsReady(false)

    try {
      const tab = await chrome.tabs.get(tabId)
      if (tab.active) return setIsReady(true)
    } catch (error) {
      console.error(error)
      // Assuming tab isn't there
      activeTabIdStorage.setValue(null)
      return setIsReady(false)
    }
  }

  useEffect(() => {
    activeTabIdStorage.getValue().then(handleReadyState)
    const stopWatcher = activeTabIdStorage.watch(handleReadyState)

    return () => {
      stopWatcher()
    }
  }, [])

  return isReady
}

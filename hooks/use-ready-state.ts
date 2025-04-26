export const useReadyState = (): [true, number] | [false, null] => {
  const [[isReady, tabId], setState] = useState<[boolean, ActiveTabIdStorageValue]>([false, null])

  const handleReadyState = async (tabId: ActiveTabIdStorageValue) => {
    if (!tabId) return setState([false, null])

    try {
      const tab = await chrome.tabs.get(tabId)
      if (!tab.active) return
      return setState([true, tabId])
    } catch (error) {
      console.error(error)
      // Assuming tab isn't there
      activeTabIdStorage.setValue(null)
      return setState([false, null])
    }
  }

  useEffect(() => {
    activeTabIdStorage.getValue().then(handleReadyState)
    const stopWatcher = activeTabIdStorage.watch(handleReadyState)

    return () => {
      stopWatcher()
    }
  }, [])

  return isReady ? [isReady, tabId as number] : [isReady, tabId as null]
}

import { GetCurrentScrapeSessionMessage } from "@/types/onconnect-types"
import { Runtime } from "wxt/browser"

export const useGetCurrentScrapeSession = (runningTabId: number | null): readonly [number, number] => {
  const [[currentScraped, totalScanned], setSessionState] = useState<[number, number]>([0, 0])

  useEffect(() => {
    if (runningTabId === null) {
      setSessionState([0, 0])
      return
    }

    const port = browser.tabs.connect(runningTabId, { name: "getCurrentScrapeSession" })
    port.onMessage.addListener((message: unknown) => {
      const { scrapedPostCount, scannedPostCount } = message as GetCurrentScrapeSessionMessage
      setSessionState([scrapedPostCount, scannedPostCount])
    })
    return () => {
      port?.disconnect()
    }
  }, [runningTabId])

  return [currentScraped, totalScanned] as const
}

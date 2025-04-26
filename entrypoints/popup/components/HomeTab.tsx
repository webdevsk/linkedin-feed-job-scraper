import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReadyState } from "@/hooks/use-ready-state"
import { useRunningState } from "@/hooks/use-running-state"
import { toast } from "sonner"
import { useGetCurrentScrapeSession } from "@/hooks/use-get-current-scrape-session"

const HomeTab: React.FC = () => {
  const [isRunningState, runningTabId] = useRunningState()
  const [isReadyState, readyTabId] = useReadyState()
  const [isPending, setIsPending] = useState(false)
  const [currentScraped, totalScanned] = useGetCurrentScrapeSession(runningTabId)
  const stats = { storageCount: 25, lifetimeCount: 142 }

  // The operation depends on external factors so we divide isRunning and triggerRunning into separate functions.
  // triggerStart and triggerStop start the pending state
  // any change in isRunning will stop the pending state
  const triggerStart = () => {
    if (!isReadyState) return
    setIsPending(true)
    sendMessage("triggerStart", undefined, { tabId: readyTabId }).catch((err) => {
      console.error(err)
      toast.error("Failed to communicate with the tab")
    })
  }

  const triggerStop = () => {
    if (!isRunningState) return
    setIsPending(true)
    sendMessage("triggerStop", undefined, { tabId: runningTabId }).catch((err) => {
      console.error(err)
      toast.error("Failed to communicate with the tab")
    })
  }

  useEffect(() => {
    setIsPending(false)
  }, [isRunningState])

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">LinkedIn Job Scraper</h1>

      <div className="space-y-6">
        {!isRunningState ? (
          <>
            {!isReadyState && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Not on LinkedIn</AlertTitle>
                <AlertDescription>Please visit LinkedIn and then activate this extension.</AlertDescription>
              </Alert>
            )}
            {isReadyState && (
              <Button className="h-12 w-full text-lg" onClick={triggerStart} disabled={isPending}>
                Start Scraping
              </Button>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Storage</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.storageCount}</p>
                  <p className="text-muted-foreground text-xs">jobs scraped</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Lifetime</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">{stats.lifetimeCount}</p>
                  <p className="text-muted-foreground text-xs">jobs scraped</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <Button className="h-12 w-full text-lg" variant="destructive" onClick={triggerStop} disabled={isPending}>
              Stop Scraping
            </Button>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">Found {currentScraped} jobs</p>
                    <p className="text-muted-foreground text-sm">out of {totalScanned} posts</p>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default HomeTab

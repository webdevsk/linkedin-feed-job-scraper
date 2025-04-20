import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HomeTabProps {
  isReadyState: boolean
  isRunning: boolean
  setIsRunning: (isRunning: boolean) => void
}

const HomeTab: React.FC<HomeTabProps> = ({ isReadyState, isRunning, setIsRunning }) => {

  const stats = {
    currentScraped: 3,
    totalScanned: 15,
    storageCount: 25,
    lifetimeCount: 142,
  }
  if (!isReadyState) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Not on LinkedIn</AlertTitle>
        <AlertDescription>Please visit LinkedIn and then activate this extension.</AlertDescription>
      </Alert>
    )
  }
  return (
    <div className="space-y-6">
      {!isRunning ? (
        <>
          <Button className="h-12 w-full text-lg" onClick={() => setIsRunning(true)}>
            Start Scraping
          </Button>
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
          <Button className="h-12 w-full text-lg" variant="destructive" onClick={() => setIsRunning(false)}>
            Stop Scraping
          </Button>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">Found {stats.currentScraped} jobs</p>
                  <p className="text-muted-foreground text-sm">out of {stats.totalScanned} posts</p>
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
  )
}

export default HomeTab

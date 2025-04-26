import React from "react"
import HomeTab from "./_components/home-tab"

const TABS = {
  HOME: "home",
  JOBS: "jobs",
  SETTINGS: "settings",
} as const
type TABSType = (typeof TABS)[keyof typeof TABS]

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TABSType>(TABS.HOME)

  return (
    <>
      <div className="bg-background text-foreground">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TABSType)}
          className="grid h-dvh grid-rows-[1fr_max-content]">
          <TabsContent value={TABS.HOME} className="flex-1 overflow-auto">
            <HomeTab />
          </TabsContent>
          {/* No need to show as only one for now */}
          {/* <TabsList className="grid h-14 w-full grid-cols-3">
            <TabsTrigger
              value="home"
              className="data-[state=active]:bg-muted flex flex-col items-center justify-center">
              <Home className="h-5 w-5" />
              <span className="mt-1 text-xs">Home</span>
            </TabsTrigger>
          </TabsList> */}
        </Tabs>
      </div>
      <Toaster />
    </>
  )
}

export default App

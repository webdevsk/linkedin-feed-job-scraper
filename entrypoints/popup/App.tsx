import React from "react"
import { Home, Briefcase, Settings } from "lucide-react"
import HomeTab from "./components/HomeTab"
import JobListTab from "./components/JobListTab"
import SettingsTab from "./components/SettingsTab"

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
          <TabsContent value={TABS.JOBS} className="flex-1 overflow-auto">
            <JobListTab />
          </TabsContent>
          <TabsContent value={TABS.SETTINGS} className="flex-1 overflow-auto">
            <SettingsTab />
          </TabsContent>
          <TabsList className="grid h-14 w-full grid-cols-3">
            <TabsTrigger
              value="home"
              className="data-[state=active]:bg-muted flex flex-col items-center justify-center">
              <Home className="h-5 w-5" />
              <span className="mt-1 text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="data-[state=active]:bg-muted flex flex-col items-center justify-center">
              <Briefcase className="h-5 w-5" />
              <span className="mt-1 text-xs">Jobs</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-muted flex flex-col items-center justify-center">
              <Settings className="h-5 w-5" />
              <span className="mt-1 text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Toaster />
    </>
  )
}

export default App

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Briefcase, Settings } from "lucide-react"
import HomeTab from "./components/HomeTab"
import JobListTab from "./components/JobListTab"
import SettingsTab from "./components/SettingsTab"
import { JobPost } from "@/utils/job-post-schema"
import { Toaster } from "@/components/ui/sonner"

// Mock data for demonstration
const mockJobs: JobPost[] = [
  {
    postId: "job1",
    postBody:
      "We're looking for a Senior React Developer to join our team. Must have 5+ years of experience with React and TypeScript. Remote position available.",
    postContents: [],
    postAuthor: {
      url: "https://linkedin.com/in/company1",
      name: "Tech Company Inc.",
    },
    postedAt: "2025-04-10T10:30:00Z",
    firstScrapedAt: "2025-04-12T15:45:00Z",
    updatedAt: "2025-04-12T15:45:00Z",
  },
  {
    postId: "job2",
    postBody:
      "Product Manager position open at our growing startup. Looking for someone with experience in SaaS products and a passion for user experience.",
    postContents: [],
    postAuthor: {
      url: "https://linkedin.com/in/startup1",
      name: "Startup Innovations",
    },
    postedAt: "2025-04-11T09:15:00Z",
    firstScrapedAt: "2025-04-12T16:20:00Z",
    updatedAt: "2025-04-12T16:20:00Z",
  },
  {
    postId: "job3",
    postBody:
      "Frontend Developer needed for our team. Experience with React, TypeScript, and CSS required. We offer competitive salary and benefits.",
    postContents: [],
    postAuthor: {
      url: "https://linkedin.com/in/techfirm",
      name: "TechFirm Solutions",
    },
    postedAt: "2025-04-09T14:20:00Z",
    firstScrapedAt: "2025-04-12T17:10:00Z",
    updatedAt: "2025-04-12T17:10:00Z",
  },
].map((job) => ({
  ...job,
  postUrl: job.postId,
}))
const TABS = {
  HOME: "home",
  JOBS: "jobs",
  SETTINGS: "settings",
} as const
type TABSType = (typeof TABS)[keyof typeof TABS]

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TABSType>(TABS.HOME)

  const [showExportDialog, setShowExportDialog] = useState(false)

  // Mock LinkedIn ready state
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleExport = () => {
    setShowExportDialog(true)
  }

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
            <JobListTab jobs={mockJobs} formatDate={formatDate} />
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

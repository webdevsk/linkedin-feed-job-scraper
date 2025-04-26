import React from "react"
import {
  CirclePlay,
  Trash,
  Download,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Phone,
  Mail,
  Globe,
  Briefcase,
} from "lucide-react"

const JobListTab: React.FC = () => {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [expandedJobs, setExpandedJobs] = useState<string[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const { jobsMap } = useGetJobsStorage()
  const jobs = Object.values(jobsMap).toReversed()

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const selectAllJobs = () => {
    setSelectedJobs(jobs.map((job) => job.postId))
  }

  const deselectAllJobs = () => {
    setSelectedJobs([])
  }

  const deleteSelectedJobs = () => {
    setSelectedJobs([])
  }

  const handleExport = () => {
    setShowExportDialog(true)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-0">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Found Jobs</h2>
          <Badge variant="outline">{jobs.length}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={selectAllJobs} disabled={selectedJobs.length === jobs.length}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllJobs} disabled={selectedJobs.length === 0}>
              Deselect All
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              disabled={selectedJobs.length === 0}
              onClick={deleteSelectedJobs}>
              <Trash className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={selectedJobs.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>Export to Google Sheets</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {jobs.map((job) => (
            <Card
              key={job.postId}
              className={`overflow-hidden transition-all duration-200 ${expandedJobs.includes(job.postId) ? "border-primary" : ""}`}>
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedJobs.includes(job.postId)}
                    onCheckedChange={() => toggleJobSelection(job.postId)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    {/* Job body gets prominence */}
                    <p className={`text-sm font-medium ${expandedJobs.includes(job.postId) ? "" : "line-clamp-2"}`}>
                      {job.postBody}
                    </p>

                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-muted-foreground max-w-[200px] truncate text-xs">
                        {job.postAuthor?.name || "Unknown Author"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-6 w-6"
                        title="Open on LinkedIn"
                        onClick={() => window.open(job.postUrl, "_blank")}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {!expandedJobs.includes(job.postId) && (
                      <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {job.postContents.length} attachment{job.postContents.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div>{formatDate(job.updatedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {expandedJobs.includes(job.postId) && (
                  <div className="mt-3 border-t px-6 pt-3">
                    {job.postContents.length > 0 && (
                      <div className="mb-3">
                        <h4 className="mb-2 text-sm font-medium">Attachments:</h4>
                        <div className="space-y-2">
                          {job.postContents.map((content, idx) => (
                            <a
                              key={idx}
                              href={
                                content.type === "phone"
                                  ? "tel:"
                                  : content.type === "email"
                                    ? "mailto:"
                                    : "" + (content.type === "video" ? job.postUrl : content.url)
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:bg-muted block rounded border p-2">
                              {content.type === "image" && (
                                <div className="h-auto w-full">
                                  <img src={content.url} alt="image" />
                                </div>
                              )}
                              {content.type === "video" && (
                                <div className="grid h-auto w-full place-content-center *:col-[1/1] *:row-[1/1]">
                                  <img src={content.thumbnailUrl} alt="video thumbnail" />
                                  <div className="hover:bg-muted/10 flex items-center justify-center">
                                    <div className="bg-accent text-accent-foreground rounded-full p-1.5">
                                      <CirclePlay className="size-10" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {content.type !== "image" && content.type !== "video" && (
                                <div className="flex items-center gap-2">
                                  <div className="text-muted-foreground flex h-8 w-8 items-center justify-center rounded">
                                    {
                                      {
                                        phone: <Phone />,
                                        email: <Mail />,
                                        article: <Globe />,
                                        job: <Briefcase />,
                                      }[content.type]
                                    }
                                  </div>
                                  <div className="w-0 grow truncate text-xs">{content.url}</div>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-muted-foreground">Posted:</div>
                      <div>{formatDate(job.postedAt)}</div>

                      <div className="text-muted-foreground">First scraped:</div>
                      <div>{formatDate(job.firstScrapedAt)}</div>

                      <div className="text-muted-foreground">Last updated:</div>
                      <div>{formatDate(job.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-full rounded-none border-t"
                onClick={() => toggleJobExpansion(job.postId)}>
                {expandedJobs.includes(job.postId) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Complete</DialogTitle>
            <DialogDescription>
              {selectedJobs.length} job{selectedJobs.length !== 1 ? "s" : ""} exported successfully.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">Would you like to delete these jobs from storage?</p>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              No, Keep Them
            </Button>
            <Button
              onClick={() => {
                deleteSelectedJobs()
                setShowExportDialog(false)
              }}>
              <Check className="mr-2 h-4 w-4" />
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JobListTab

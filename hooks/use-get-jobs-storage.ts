type JobStorage = {
  jobs: JobPost[]
  scrapedCount: number
  lifeTimeScrapedCount: LifeTimeScrapedStorageValue
}
const jobPostService = getJobPostService()

export const useGetJobsStorage = () => {
  const [data, setData] = useState<JobStorage>({
    jobs: [],
    scrapedCount: 0,
    lifeTimeScrapedCount: 0,
  })

  const handleStorage = (jobs: JobPost[] | undefined, lifeTimeScrapedCount: LifeTimeScrapedStorageValue | undefined) =>
    setData((state) => ({
      jobs: !jobs ? state.jobs : jobs,
      scrapedCount: !jobs ? state.scrapedCount : Object.keys(jobs).length,
      lifeTimeScrapedCount: !lifeTimeScrapedCount ? state.lifeTimeScrapedCount : lifeTimeScrapedCount,
    }))

  useEffect(() => {
    // initial fetches
    jobPostService.listJobs().then((res) => res.status === STATUS.SUCCESS && handleStorage(res.data, undefined))
    lifeTimeScrapedStorage
      .getValue()
      .then((value) => handleStorage(undefined, value))
      .catch((error) => console.error("Failed to get life time scraped count", error))

    // onchange
    const watchers = [
      jobPostService.watchJobs((newValue) => handleStorage(newValue, undefined)),
      lifeTimeScrapedStorage.watch((lifeTimeScrapedCount) => handleStorage(undefined, lifeTimeScrapedCount)),
    ]

    return () => {
      watchers.forEach((dismiss) => dismiss())
    }
  }, [])
  return data
}

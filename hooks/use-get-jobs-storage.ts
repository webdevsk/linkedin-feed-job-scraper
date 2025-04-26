type JobStorage = {
  jobs: Array<JobPostsStorageValue[number]>
  scrapedCount: number
  lifeTimeScrapedCount: LifeTimeScrapedStorageValue
}

export const useGetJobsStorage = () => {
  const [data, setData] = useState<JobStorage>({
    jobs: [],
    scrapedCount: 0,
    lifeTimeScrapedCount: 0,
  })

  const handleStorage = (
    jobs: JobPostsStorageValue | undefined,
    lifeTimeScrapedCount: LifeTimeScrapedStorageValue | undefined
  ) =>
    setData((state) => ({
      jobs: !jobs ? state.jobs : Object.values(jobs).toReversed(),
      scrapedCount: !jobs ? state.scrapedCount : Object.keys(jobs).length,
      lifeTimeScrapedCount: !lifeTimeScrapedCount ? state.lifeTimeScrapedCount : lifeTimeScrapedCount,
    }))

  useEffect(() => {
    storage.getItems([jobPostsStorage, lifeTimeScrapedStorage]).then(([jobs, lifeTimeScrapedCount]) => {
      console.log(jobs, lifeTimeScrapedCount)
      handleStorage(jobs.value, lifeTimeScrapedCount.value)
    })
    const watchers = [
      jobPostsStorage.watch((jobs) => handleStorage(jobs, undefined)),
      lifeTimeScrapedStorage.watch((lifeTimeScrapedCount) => handleStorage(undefined, lifeTimeScrapedCount)),
    ]
    return () => {
      watchers.forEach((dismiss) => dismiss())
    }
  }, [])
  return data
}

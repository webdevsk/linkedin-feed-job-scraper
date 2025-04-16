export type JobPostsStorageValue = Record<JobPost["postId"], JobPost>
export const jobPostsStorage = storage.defineItem<JobPostsStorageValue>("local:jobPosts", {
  fallback: {},
  version: 1,
})

export type ActiveTabIdStorageValue = number | null
export const activeTabIdStorage = storage.defineItem<ActiveTabIdStorageValue>("local:activeTabId")

export type RunningTabIdStorageValue = number | null
export const runningTabIdStorage = storage.defineItem<RunningTabIdStorageValue>("local:runningTabId")

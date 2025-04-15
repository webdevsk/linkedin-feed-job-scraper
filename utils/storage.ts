import type { JobPost } from "./job-post-schema"

export const jobPostsStorage = storage.defineItem<Record<JobPost["postId"], JobPost>>("local:jobPosts", {
  fallback: {},
  version: 1,
})

export const activeTabIdStorage = storage.defineItem<number | null>("local:activeTabId")

export const isRunningStorage = storage.defineItem<boolean>("local:isRunning", { fallback: false })

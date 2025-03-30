import { z } from "zod"
export const jobPostSchema = z.object({
  postId: z.string(),
  content: z.string(),
  author: z.string(),
  postedAt: z.string().datetime(),
  firstScrapedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  url: z.string().url(),
})

export type JobPost = z.infer<typeof jobPostSchema>

export const jobPostsStorage = storage.defineItem<Map<JobPost["postId"], JobPost>>("local:jobPosts", {
  fallback: new Map(),
  version: 1,
})

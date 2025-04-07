import { z } from "zod"
export const jobPostSchema = z.object({
  postId: z.string(),
  postBody: z.string(),
  postContents: z.array(
    z.object({
      url: z.string().url(),
      type: z.string(),
    })
  ),
  postAuthor: z.string(),
  postedAt: z.string().datetime(),
  firstScrapedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type JobPost = z.infer<typeof jobPostSchema>

export const jobPostsStorage = storage.defineItem<Map<JobPost["postId"], JobPost>>("local:jobPosts", {
  fallback: new Map(),
  version: 1,
})

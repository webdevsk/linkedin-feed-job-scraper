import { z } from "zod"
export const PostContentTypes = ["image", "job", "article", "video", "email", "phone"] as const

export const jobPostSchema = z.object({
  postId: z.string(),
  postUrl: z.string().url(),
  postBody: z.string(),
  postContents: z.array(
    z.object({
      url: z.string().url().optional(),
      thumbnailUrl: z.string().url().optional(),
      type: z.enum(PostContentTypes),
    })
  ),
  postAuthor: z
    .object({
      name: z.string().nullable(),
      url: z.string().url().nullable(),
    })
    .nullable(),
  postedAt: z.string().datetime(),
  firstScrapedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type JobPost = z.infer<typeof jobPostSchema>
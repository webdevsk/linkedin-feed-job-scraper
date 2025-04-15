import { z } from "zod"

// example post url https://www.linkedin.com/feed/update/urn:li:activity:11111111111111/
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

export const jobPostsStorage = storage.defineItem<Record<JobPost["postId"], JobPost>>("local:jobPosts", {
  fallback: {},
  version: 1,
})

export const activeTabId = storage.defineItem<number | null>("local:activeTabId")

export const isRunning = storage.defineItem<boolean>("local:isRunning", { fallback: false })

// fetch it from storage
// periodically update it from a github repo
const refineKeywords = (keywords: (string | RegExp)[]) =>
  keywords
    .map((keyword) => (typeof keyword === "string" ? keyword : keyword.source))
    .map((keyword) => keyword.replaceAll(/\s+/g, "\\s+"))

export const extensionConfig = {
  keywordProfiles: {
    en: refineKeywords([
      /(?!(you|they))( is|( are| am|\Sre)) (#)?hiring/, // \S is to match any non-whitespace character like '|"|`|’
      /(?!(you|they))( is|( are| am|\Sre)) looking for/,
      /(?!(you|they))( is|( are| am|\Sre)) seeking/,
      "we seek",
      /(apply|application) (now|here|today)/,
      "help build",
      "open role",
      /join (us|now)/,
    ]),
  },
}

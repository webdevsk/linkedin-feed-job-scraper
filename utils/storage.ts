import { z } from "zod"

// example post url https://www.linkedin.com/feed/update/urn:li:activity:11111111111111/
export const jobPostSchema = z.object({
  postId: z.string(),
  postBody: z.string(),
  postContents: z.array(
    z.union([
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "job", "article", "unknown"]),
      }),
      z.object({
        thumbnailUrl: z.string().url(),
        type: z.literal("video"),
      }),
    ])
  ),
  postAuthor: z
    .object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      profilePictureUrl: z.string().url().optional(),
    })
    .optional(),
  postedAt: z.string().datetime(),
  firstScrapedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type JobPost = z.infer<typeof jobPostSchema>

export const jobPostsStorage = storage.defineItem<Map<JobPost["postId"], JobPost>>("local:jobPosts", {
  fallback: new Map(),
  version: 1,
})

// fetch it from storage
// periodically update it from a github repo
const refineKeywords = (keywords: (string | RegExp)[]) =>
  keywords
    .map((keyword) => (typeof keyword === "string" ? keyword : keyword.source))
    .map((keyword) => keyword.replaceAll(/\s+/g, "\\s+"))

export const extensionConfig = {
  keywordProfiles: {
    en: refineKeywords([
      /(?!(you|they))( is|( are| am|'re)) hiring/,
      /(?!(you|they))( is|( are| am|'re)) looking for/,
      /(?!(you|they))( is|( are| am|'re)) seeking/,
      /(apply|application) (now|here)/,
      "help build",
      "open role",
      /join (us|now)/,
    ]),
  },
}

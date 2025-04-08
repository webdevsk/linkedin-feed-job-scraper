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

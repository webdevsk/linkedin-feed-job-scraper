// import { defineProxyService } from "@webext-core/proxy-service"
import type { JobPost } from "./storage"
import { jobPostSchema, jobPostsStorage } from "./storage"
import { z } from "zod"

const STATUS = {
  SUCCESS: "success",
  ERROR: "error",
} as const

type SuccessResponse<T> = {
  status: typeof STATUS.SUCCESS
  data: T
}
type ErrorResponse = {
  status: typeof STATUS.ERROR
  error: string
}

type ApiResponse<T> = Promise<SuccessResponse<T> | ErrorResponse>
type Nullable<T> = { [K in keyof T]: T[K] | null }

/** Minimally accepted params to send to the api. Validation is done in the Server AKA Service worker */
export type AcceptableJobPostParamsForSubmission = Nullable<Omit<JobPost, "updatedAt" | "firstScrapedAt">> & {
  postContents: JobPost["postContents"]
}

/**
 * Proxy to be called from the Service Worker AKA Background script
 */
class JobPostService {
  async getJobsByIds(postIds: JobPost["postId"][]): ApiResponse<JobPost[]> {
    if (!postIds.length) {
      return { status: STATUS.SUCCESS, data: [] }
    }
    try {
      const data: JobPost[] = []
      const storage = await jobPostsStorage.getValue()
      for (const postId of postIds) {
        const jobPost = storage[postId]
        if (jobPost) data.push(jobPost)
      }
      return { status: STATUS.SUCCESS, data }
    } catch (error) {
      console.error(error)
      return { status: STATUS.ERROR, error: "Failed to get job posts" }
    }
  }

  async listJobs(): ApiResponse<JobPost[]> {
    try {
      const storage = await jobPostsStorage.getValue()
      return { status: STATUS.SUCCESS, data: Object.values(storage) }
    } catch (error) {
      console.error(error)
      return { status: STATUS.ERROR, error: "Failed to list job posts" }
    }
  }

  async postJobs(jobPosts: Nullable<Omit<JobPost, "updatedAt" | "firstScrapedAt">>[]): ApiResponse<JobPost[]> {
    if (!jobPosts.length) {
      return { status: STATUS.SUCCESS, data: [] }
    }
    try {
      const data: JobPost[] = []
      const timeStamp = new Date().toISOString()
      const storage = await jobPostsStorage.getValue()

      for (const jobPost of jobPosts) {
        try {
          const newJobPost = jobPostSchema.parse({
            ...jobPost,
            updatedAt: timeStamp,
            firstScrapedAt: !jobPost.postId ? timeStamp : (storage[jobPost.postId]?.firstScrapedAt ?? timeStamp),
          })
          storage[newJobPost.postId] = newJobPost
          data.push(newJobPost)
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`${error.message} ${JSON.stringify(jobPost)}`)
          }
          throw error
        }
      }
      await jobPostsStorage.setValue(storage)
      return { status: STATUS.SUCCESS, data }
    } catch (error) {
      console.error(error)
      return { status: STATUS.ERROR, error: "Failed to post job posts" }
    }
  }

  async deleteJobs(postIds: JobPost["postId"][]): ApiResponse<undefined> {
    if (!postIds.length) {
      return { status: STATUS.SUCCESS, data: undefined }
    }
    try {
      const storage = await jobPostsStorage.getValue()
      for (const postId of postIds) {
        delete storage[postId]
      }
      await jobPostsStorage.setValue(storage)
      return { status: STATUS.SUCCESS, data: undefined }
    } catch (error) {
      console.error(error)
      return { status: STATUS.ERROR, error: "Failed to delete job posts" }
    }
  }

  async deleteAllJobs(): ApiResponse<undefined> {
    try {
      await jobPostsStorage.setValue({})
      return { status: STATUS.SUCCESS, data: undefined }
    } catch (error) {
      console.error(error)
      return { status: STATUS.ERROR, error: "Failed to delete all job posts" }
    }
  }
}

// If we want to run this code in service-worker
// export const [registerJobPostService, getJobPostService] = defineProxyService(
//   "BookmarkServiceWithTags",
//   () => new JobPostService()
// )

// Run this code in caller's own environment
export const getJobPostService = () => new JobPostService()

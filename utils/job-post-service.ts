import { defineProxyService } from "@webext-core/proxy-service"
import type { JobPost } from "./storage"
import { jobPostSchema, jobPostsStorage } from "./storage"

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
        const jobPost = storage.get(postId)
        if (jobPost) data.push(jobPost)
      }
      return { status: STATUS.SUCCESS, data }
    } catch (error) {
      customError(error)
      return { status: STATUS.ERROR, error: "Failed to get job posts" }
    }
  }

  async listJobs(): ApiResponse<JobPost[]> {
    try {
      const storage = await jobPostsStorage.getValue()
      return { status: STATUS.SUCCESS, data: Array.from(storage.values()) }
    } catch (error) {
      customError(error)
      return { status: STATUS.ERROR, error: "Failed to list job posts" }
    }
  }

  async postJobs(jobPosts: Omit<JobPost, "updatedAt" | "firstScrapedAt">[]): ApiResponse<JobPost[]> {
    if (!jobPosts.length) {
      return { status: STATUS.SUCCESS, data: [] }
    }
    try {
      const data: JobPost[] = []
      const timeStamp = new Date().toISOString()
      const storage = await jobPostsStorage.getValue()

      for (const jobPost of jobPosts) {
        const newJobPost = jobPostSchema.parse({
          ...jobPost,
          updatedAt: timeStamp,
          firstScrapedAt: storage.get(jobPost.postId)?.firstScrapedAt ?? timeStamp,
        })
        storage.set(jobPost.postId, newJobPost)
        data.push(newJobPost)
      }

      await jobPostsStorage.setValue(storage)
      return { status: STATUS.SUCCESS, data }
    } catch (error) {
      customError(error)
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
        storage.delete(postId)
      }
      await jobPostsStorage.setValue(storage)
      return { status: STATUS.SUCCESS, data: undefined }
    } catch (error) {
      customError(error)
      return { status: STATUS.ERROR, error: "Failed to delete job posts" }
    }
  }

  async deleteAllJobs(): ApiResponse<undefined> {
    try {
      const storage = await jobPostsStorage.getValue()
      storage.clear()
      await jobPostsStorage.setValue(storage)
      return { status: STATUS.SUCCESS, data: undefined }
    } catch (error) {
      customError(error)
      return { status: STATUS.ERROR, error: "Failed to delete all job posts" }
    }
  }
}

export const [registerJobPostService, getJobPostService] = defineProxyService(
  "BookmarkServiceWithTags",
  () => new JobPostService()
)

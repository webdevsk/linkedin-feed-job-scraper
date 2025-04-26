import { LinkedinPost, baseUrl } from "@/lib/linkedin-post-class"
import { AcceptableJobPostParamsForSubmission } from "@/utils/job-post-service"
import { jobPostService } from "."

type ScrapedPostData = AcceptableJobPostParamsForSubmission

/** Scrapes a post for job posting data.
 * @param element - The post element to scrape
 * @param isReshared - Whether the post is a reshared post
 * @returns The scraped post data or null if the post is not a hiring post
 */
export const handleScraping = (element: Element, isReshared: boolean = false): ScrapedPostData | null => {
  let post: LinkedinPost | null = new LinkedinPost(element, { isReshared })
  let scrapedPostData: ScrapedPostData | null = null

  try {
    const isHiringPost = post.checkIfHiringPost()
    if (!isHiringPost) return null

    post.element.insertAdjacentHTML(
      "beforeend",
      "<div style='color: red; font-weight: bold; font-size: 1.5rem; position: absolute; top: 0; right: 0; padding: 3.5rem 1rem; display: block; pointer-events: none;'>Hiring</div>"
    )

    const data: AcceptableJobPostParamsForSubmission = {
      postId: post.getPostId(),
      postUrl: `${baseUrl}/feed/update/urn:li:activity:${post.getPostId()}`,
      postBody: post.getPostBody(),
      postAuthor: {
        name: post.getPostAuthorName(),
        url: post.getPostAuthorUrl(),
      },
      postContents: generatePostContents(post),
      postedAt: post.getPostPostedAt(),
    }
    console.table(data)
    scrapedPostData = data
  } catch (error) {
    console.error(error)
    scrapedPostData = null
  } finally {
    // Memory cleanup
    post.dispose()
    post = null
  }
  return scrapedPostData
}

const generatePostContents = (post: LinkedinPost): AcceptableJobPostParamsForSubmission["postContents"] => {
  type ThisFnReturnType = ReturnType<typeof generatePostContents>
  const postContents: ThisFnReturnType = []
  postContents.push(...post.getContactInfo())

  const type = post.getPostContentType()
  if (!type) return []

  // These are slides/documents rendered through a cross origin iframe. Thus we can't get the contents
  if (type === "document__container") return []

  const makePostContentBody = (url: string) => ({
    [type === "linkedin-video" ? "thumbnailUrl" : "url"]: url,
    type: (
      {
        "linkedin-video": "video",
        entity: "job",
        article: "article",
        image: "image",
      } as const
    )[type],
  })

  switch (type) {
    case "image":
      postContents.push(...post.getPostImageLinks().map(makePostContentBody))
      break
    case "entity":
      postContents.push(...post.getPostEntityLinks().map(makePostContentBody))
      break
    case "article":
      postContents.push(...post.getPostArticleLinks().map(makePostContentBody))
      break
    case "linkedin-video": {
      const link = post.getPostVideoThumbLink()
      if (!link) break
      postContents.push(makePostContentBody(link))
      break
    }
    default:
      break
  }
  return postContents
}

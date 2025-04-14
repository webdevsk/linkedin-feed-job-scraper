import { LinkedinPost, postParentSelector, postSelector } from "@/lib/linkedin-post-class"
import { AcceptableJobPostParamsForSubmission } from "@/utils/job-post-service"
import type { ContentScriptContext } from "wxt/client"
import { injectConsole } from "@/utils/injectConsole"
injectConsole()
const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
const jobPostService = getJobPostService()

export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main(ctx) {
    console.log("Injecting content script")

    // Run if initially on feed page
    if (feedUrlWatchPattern.includes(window.location.href)) mainWatch(ctx)

    // Run when dynamically navigated to feed page
    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      if (feedUrlWatchPattern.includes(newUrl)) mainWatch(ctx)
    })
  },
})

// Main function to run when we are in the feed page
async function mainWatch(ctx: ContentScriptContext) {
  // fetching initial posts
  for (const element of document.querySelectorAll(postSelector)) {
    handleScraping(element)
    const sharedPost = element.querySelector<HTMLDivElement>(".feed-shared-update-v2__content-wrapper")
    if (sharedPost) handleScraping(sharedPost, true)
  }

  const rootToObserve = document.querySelector(postParentSelector) ?? document.body
  if (!rootToObserve) {
    console.error("Could not find root to observe")
    return
  }

  // fetching new posts dynamically
  const callback: MutationCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (!mutation.addedNodes.length) continue
      for (const node of mutation.addedNodes) {
        if (isElement(node) && node.matches(postSelector)) {
          handleScraping(node)
          const sharedPost = node.querySelector<HTMLDivElement>(".feed-shared-update-v2__content-wrapper")
          if (sharedPost) handleScraping(sharedPost, true)
        }
      }
    }
  }

  // Setting up observer and shutting it down if extension is invalidated
  const observer = new MutationObserver(callback)
  observer.observe(rootToObserve, {
    childList: true,
    subtree: true,
  })
  ctx.onInvalidated(() => {
    console.error("Content script context invalidated. Shutting down...")
    observer.disconnect()
  })
}

async function handleScraping(element: Element, isReshared: boolean = false) {
  // whatever we wanna do with each post
  let post: LinkedinPost | null = new LinkedinPost(element, { isReshared })

  // Recurse when a reshared post is found
  // This throws for some reason when any imported modules like jobPostService is called within
  // if (!isReshared) {
  //   const sharedPost = post.fetchSharedPost()
  //   if (sharedPost) handleScraping(sharedPost, true)
  // }

  try {
    const isHiringPost = post.checkIfHiringPost()
    if (!isHiringPost) return

    post.element.insertAdjacentHTML(
      "beforeend",
      "<div style='color: red; font-weight: bold; font-size: 1.5rem; position: absolute; top: 0; right: 0; padding: 3.5rem 1rem; display: block; pointer-events: none;'>Hiring</div>"
    )

    const data: AcceptableJobPostParamsForSubmission = {
      postId: post.getPostId(),
      postBody: post.getPostBody(),
      postAuthor: {
        name: post.getPostAuthorName(),
        url: post.getPostAuthorUrl(),
      },
      postContents: generatePostContents(post),
      postedAt: post.getPostPostedAt(),
    }
    console.table(data)
    const res = await jobPostService.postJobs([data])
    console.log(res)
    if (res.status === "error") throw new Error(res.error)
  } catch (error) {
    console.error(error)
  } finally {
    // Memory cleanup
    post.dispose()
    post = null
  }
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

function generatePostContents(post: LinkedinPost): AcceptableJobPostParamsForSubmission["postContents"] {
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
      return post.getPostImageLinks().map(makePostContentBody)
    case "entity":
      return post.getPostEntityLinks().map(makePostContentBody)
    case "article":
      return post.getPostArticleLinks().map(makePostContentBody)
    case "linkedin-video": {
      const link = post.getPostVideoThumbLink()
      if (!link) return []
      return [makePostContentBody(link)]
    }
    default:
      return []
  }
}

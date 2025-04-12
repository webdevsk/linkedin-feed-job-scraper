import { customLog } from "@/utils/customLog"
import { extensionConfig } from "@/utils/storage"

const seeMoreButtonSelector = 'button[aria-label^="see more"]'
let postBodyNotFoundCounter: number = 0
const postBodyNotFoundLimit = 5

/** class ending with */
const contentTypeEnums = ["image", "linkedin-video", "article", "entity"] as const
type ContentType = (typeof contentTypeEnums)[number]

//Urgent hiring for HR recruiter and team lead

// Will feature profile enable|disable system later
const keywords: string[] = Object.values(extensionConfig.keywordProfiles).flat()
export const hiringRegExp = new RegExp(keywords.join("|"), "i")

/**
 * Class to represent a LinkedIn post
 * @param node - The post element
 * @param options - Options for the post
 */

export class LinkedinPost {
  element: Element
  isReshared: boolean = false

  //Implement and test later
  // cacheMap = new Map<unknown, unknown>()

  constructor(
    node: Element,
    options?: {
      /**
       * This post is reshared in another linkedin post
       * @default false
       */
      isReshared?: boolean
    }
  ) {
    Object.assign(this, options)
    this.element = node
  }

  private fetchSeeMoreButton(): HTMLButtonElement | null {
    return this.element.querySelector<HTMLButtonElement>(seeMoreButtonSelector)
  }

  private fetchPostBody(): HTMLDivElement | null {
    const postBody = this.element.querySelector<HTMLDivElement>(".feed-shared-update-v2__description")
    if (!postBody) {
      postBodyNotFoundCounter++
      customLog("Could not find post body", this.element)
      // determine if the selector is outdated
      if (postBodyNotFoundCounter > postBodyNotFoundLimit)
        throw new Error(`Could not find post body for more than ${postBodyNotFoundLimit} times in a row`)
      return null
    }
    postBodyNotFoundCounter = 0
    return postBody
  }

  /** Attachments like images, videos, article or entity */
  private fetchPostContent(): HTMLDivElement | null {
    return this.element.querySelector<HTMLDivElement>(
      this.isReshared ? "update-components-mini-update-v2__reshared-content" : ".feed-shared-update-v2__content"
    )
  }

  /**
   * @warning This may not actually return the ID of the original linkedin post. If your connections "like" "love" or interact with such posts and they show up in your feed, this will return the ID of your connection's post which shares the original post
   * @warning I haven't found a way to get the original post ID yet as its missing from the Element Body.
   */
  getPostId(): string | null {
    const idRegexp = /urn:li:activity:(\d+)/
    if (!this.isReshared) {
      return this.element.closest("[data-id]")?.getAttribute("data-id")?.match(idRegexp)?.at(1) ?? null
    } else {
      return (
        this.element
          .querySelector<HTMLAnchorElement>(".update-components-mini-update-v2__link-to-details-page")
          ?.getAttribute("href")
          ?.match(idRegexp)
          ?.at(1) ?? null
      )
    }
  }

  getPostBody(): string | null {
    const postBody = this.fetchPostBody()
    return postBody?.innerText ?? null
  }

  getPostAuthorName(): string | null {
    return (
      this.element.querySelector<HTMLDivElement>(".update-components-actor__title .visually-hidden")?.innerText ??
      this.element.querySelector<HTMLDivElement>(".update-components-actor__title")?.innerText ??
      null
    )
  }

  getPostAuthorUrl(): string | null {
    const authorInfo = this.element.querySelector<HTMLAnchorElement>(".update-components-actor__meta-link")
    return !authorInfo?.getAttribute("href")
      ? null
      : (new URL(authorInfo.getAttribute("href")!).pathname.match(/(.+)(\/posts)?/)?.at(1) ?? null)
  }

  private getPostContents() {
    /** Parse email and phone from post body and add it to contents as well
     * @example {url: "test@mail.com", type: "email"}
     * @example {url: "999999", type: "phone"}
     */
  }

  getHeaderText(): string | null {
    return this.element.querySelector<HTMLDivElement>(".update-components-header")?.innerText ?? null
  }

  fetchSharedPost(): HTMLDivElement | null {
    return this.element.querySelector<HTMLDivElement>(".feed-shared-update-v2__content-wrapper")
  }

  getPostContentType(): ContentType | null {
    const postContent = this.fetchPostContent()
    if (!postContent) return null
    for (const contentType of contentTypeEnums) {
      if (postContent.matches(`.update-components-${contentType}`)) {
        return contentType
      }
    }
    return null
  }

  /**
   * @warning This may not actually return the date of the original linkedin post. If your connections "like" "love" or interact with such posts and they show up in your feed, this will return the date of your connection's post which shares the original post. Thus the posted date on Linkedin and the posted date here may not be the same.
   * @warning I haven't found a way to get the original post date yet as the original post ID is missing from the Element Body.
   * @warning Parsing date from the on screen text is not reliable as the date format may change based on the user's timezone and language settings.
   */
  getPostPostedAt(): string | null {
    const postId = this.getPostId()
    if (!postId) return null

    // Source: https://trevorfox.com/linkedin-post-date-extractor (Thanks Trevor Fox)

    // Convert the post ID to a BigInt
    const postIdBigInt = BigInt(postId)

    // Convert to binary and get the first 41 bits
    // We shift right by 22 bits to get only the first 41 bits that represent the timestamp
    const timestampBits = postIdBigInt >> 22n

    // Convert the binary timestamp back to decimal (milliseconds since epoch)
    const timestampMs = Number(timestampBits)

    // Create a Date object from the timestamp
    return new Date(timestampMs).toISOString()
  }

  checkIfHiringPost(): boolean {
    const postBody = this.fetchPostBody()
    return !!postBody?.textContent && hiringRegExp.test(postBody.textContent)
  }

  // Not needed for now
  //////////////////////

  // isCollapsed() {
  //   return Boolean(this.fetchSeeMoreButton())
  // }

  // expandBody() {
  //   this.fetchSeeMoreButton()?.click()
  //   // delayed check to give the DOM some time to make changes
  //   setTimeout(() => {
  //     // in-case the click event is handled by frameworks like react
  //     if (this.isCollapsed()) throw new Error(`Failed to expand post`)
  //   }, 100)
  //   return this
  // }
}

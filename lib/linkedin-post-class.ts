import { extensionConfig } from "@/utils/extension-config"

export const baseUrl = "https://www.linkedin.com"
export const postSelector = "[data-view-tracking-scope]"
export const postParentSelector = "[data-finite-scroll-hotkey-context='FEED']"
export const sharedPostSelector = ".feed-shared-update-v2__content-wrapper"
// const seeMoreButtonSelector = "button[aria-label^='see more']"
let postBodyNotFoundCounter: number = 0
const postBodyNotFoundLimit = 5

/** class ending with */
const contentTypeEnums = ["image", "linkedin-video", "article", "entity", "document__container"] as const
type ContentType = (typeof contentTypeEnums)[number]

// Will feature profile enable|disable system later
const keywords: string[] = Object.values(extensionConfig.keywordProfiles).flat()
export const hiringRegExp = new RegExp(keywords.join("|"), "i")

/**
 * Class to represent a LinkedIn post
 * @param node - The post element
 * @param options - Options for the post
 */

type ConstructorOptions = {
  /**
   * This post is reshared in another linkedin post
   * @default false
   */
  isReshared?: boolean
}

export class LinkedinPost {
  element: Element
  isReshared: boolean = false
  private cacheMap = new Map<string, unknown>()

  constructor(node: Element, options?: ConstructorOptions) {
    Object.assign(this, options)
    this.element = node
    // Create proxy to automatically memoize private methods
    return new Proxy(this, {
      get(target: LinkedinPost, prop: string | symbol) {
        const value = Reflect.get(target, prop)

        // Only memoize private methods (methods that start with 'fetch')
        if (typeof value === "function" && typeof prop === "string" && prop.startsWith("fetch")) {
          return function (...args: unknown[]) {
            const cacheKey = `${String(prop)}_${!args ? "" : JSON.stringify(args)}`
            if (!target.cacheMap.has(cacheKey)) {
              target.cacheMap.set(cacheKey, value.apply(target, args))
            }
            return target.cacheMap.get(cacheKey)
          }
        }
        return value
      },
    })
  }

  // Clear cache method to be used when needed
  private clearCache(): void {
    this.cacheMap.clear()
  }

  private fetchPostBody(): HTMLDivElement | null {
    const postBody = this.element.querySelector<HTMLDivElement>(".feed-shared-update-v2__description")
    if (!postBody) {
      postBodyNotFoundCounter++
      console.log("Could not find post body", this.element)
      if (postBodyNotFoundCounter > postBodyNotFoundLimit)
        throw new Error(`Could not find post body for more than ${postBodyNotFoundLimit} times in a row`)
      return null
    }
    postBodyNotFoundCounter = 0
    return postBody
  }

  /** Attachments like images, videos, article or entity */
  private fetchPostContentRootNode(): HTMLDivElement | null {
    return this.element.querySelector<HTMLDivElement>(
      this.isReshared ? "update-components-mini-update-v2__reshared-content" : ".feed-shared-update-v2__content"
    )
  }

  private fetchPostContents(): Element[] {
    return this.fetchPostContentRootNode()?.children[Symbol.iterator]().toArray() ?? []
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
    const rawUrl = this.element
      .querySelector<HTMLAnchorElement>(".update-components-actor__meta-link")
      ?.getAttribute("href")
    if (!rawUrl) return null
    const { origin, pathname } = new URL(rawUrl)
    return `${origin}${pathname.split("/").splice(0, 3).join("/")}`
  }

  getContactInfo(): { url: string; type: "email" | "phone" }[] {
    type ThisFnReturnType = ReturnType<typeof this.getContactInfo>
    const contactInfo: ThisFnReturnType = []
    const postBody = this.fetchPostBody()
    if (!postBody) return contactInfo

    // Phone number regex - handles international formats
    // Supports:
    // - Optional country code with + prefix
    // - Optional spaces, dots, dashes, or parentheses as separators
    // - Various formats: (123) 456-7890, +1 123.456.7890, 123-456-7890, etc.
    // - Minimum 7 digits (excluding formatting), maximum 15 digits total
    const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?(\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})$/g

    // Email regex - RFC 5322 compliant with practical limitations
    // Supports:
    // - Unicode characters in local part
    // - Multiple dots in local part
    // - IP literals and domain literals
    // - Subdomains and various TLDs
    // - Special characters in local part
    // - Prevents consecutive dots and starting/ending with dots
    const emailRegex =
      /^(?=[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@(?=.{1,255}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/g

    const emails = postBody.innerText.match(emailRegex) ?? []
    const phones = postBody.innerText.match(phoneRegex) ?? []

    contactInfo.push(...emails.map<ThisFnReturnType[number]>((email) => ({ url: email, type: "email" })))
    contactInfo.push(...phones.map<ThisFnReturnType[number]>((phone) => ({ url: phone, type: "phone" })))

    return contactInfo
  }

  getPostContentType(): ContentType | null {
    const postContent = this.fetchPostContentRootNode()
    if (!postContent) return null
    for (const contentType of contentTypeEnums) {
      if (postContent.matches(`.update-components-${contentType}`)) {
        return contentType
      }
    }
    return null
  }

  getPostArticleLinks(): string[] {
    // considered: website links
    return (
      this.fetchPostContents()
        .map<string | null>((elm) => elm.querySelector<HTMLAnchorElement>("a")?.href ?? null)
        .filter<string>((href): href is string => Boolean(href)) ?? []
    )
  }

  getPostEntityLinks(): string[] {
    return (
      this.fetchPostContents()
        .map<string | null>((elm) => elm.querySelector<HTMLAnchorElement>("a")?.href ?? null)
        .filter<string>((href): href is string => Boolean(href))
        .map<string>((href) => {
          // remove ref and other stuff
          const url = new URL(href)
          return url.origin + url.pathname
        }) ?? []
    )
  }

  getPostImageLinks(): string[] {
    return (
      this.fetchPostContents()
        .map<string | null>((elm) => elm.querySelector<HTMLImageElement>("img")?.src ?? null)
        .filter<string>((src): src is string => Boolean(src)) ?? []
    )
  }

  getPostVideoThumbLink(): string | null {
    return this.fetchPostContentRootNode()?.querySelector<HTMLVideoElement>("video")?.poster ?? null
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

  /**
   * Cleanup code.
   * Remove any event listeners here.
   */
  dispose(): void {
    this.clearCache()
  }

  // Not needed for now
  //////////////////////

  // getHeaderText(): string | null {
  //   return this.element.querySelector<HTMLDivElement>(".update-components-header")?.innerText ?? null
  // }

  // private fetchSeeMoreButton(): HTMLButtonElement | null {
  //   return this.element.querySelector<HTMLButtonElement>(seeMoreButtonSelector)
  // }

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

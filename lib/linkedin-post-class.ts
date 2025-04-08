import { customLog } from "@/utils/customLog"
import { extensionConfig } from "@/utils/storage"

const seeMoreButtonSelector = 'button[aria-label^="see more"]'
let postBodyNotFoundCounter = 0
const postBodyNotFoundLimit = 5

/** class ending with */
const contentTypeEnums = ["image", "linkedin-video", "article", "entity"] as const
type ContentType = (typeof contentTypeEnums)[number]

//Urgent hiring for HR recruiter and team lead

// Will feature profile enable|disable system later
const keywords: string[] = Object.values(extensionConfig.keywordProfiles).flat()
console.log(keywords)
export const hiringRegExp = new RegExp(keywords.join("|"), "i")
console.log(hiringRegExp)

/**
 * Class to represent a LinkedIn post
 * @param node - The post element
 * @param options - Options for the post
 */

export class LinkedinPost {
  element: Element
  isReshared: boolean = false

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

  private fetchSeeMoreButton() {
    return this.element.querySelector<HTMLButtonElement>(seeMoreButtonSelector)
  }

  private fetchPostBody() {
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
  private fetchPostContent() {
    return this.element.querySelector<HTMLDivElement>(
      this.isReshared ? "update-components-mini-update-v2__reshared-content" : ".feed-shared-update-v2__content"
    )
  }

  private getPostId() {
    if (!this.isReshared) {
      /**
       * can be parsed from the data-id attribute from the root element
       * @example data-id="urn:li:activity:7310726920638251009"
       */
    } else {
      /**
       * can be parsed from the href of an anchor tag with the following class
       * @class update-components-mini-update-v2__link-to-details-page
       * @example href="/feed/update/urn:li:activity:7310359844241186816/"
       */
    }
  }

  private getPostContents() {
    /** Parse email and phone from post body and add it to contents as well
     * @example {url: "test@mail.com", type: "email"}
     * @example {url: "999999", type: "phone"}
     */
  }

  getHeaderText() {
    return this.element.querySelector<HTMLDivElement>(".update-components-header")?.innerText
  }

  fetchSharedPost() {
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

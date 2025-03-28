import { customLog } from "@/utils/customLog"

const seeMoreButtonSelector = 'button[aria-label^="see more"]'
let postBodyNotFoundCounter = 0
const postBodyNotFoundLimit = 5

export class LinkedinPost {
  element: Element

  constructor(node: Element) {
    this.element = node
  }

  private fetchSeeMoreButton() {
    return this.element.querySelector<HTMLButtonElement>(seeMoreButtonSelector)
  }

  private fetchPostBody() {
    return this.element.querySelector<HTMLDivElement>('[class*="feed"][class*="description"]')
  }

  isCollapsed() {
    return Boolean(this.fetchSeeMoreButton())
  }

  expandBody() {
    this.fetchSeeMoreButton()?.click()
    // delayed check to give the DOM some time to make changes
    setTimeout(() => {
      // in-case the click event is handled by frameworks like react
      if (this.isCollapsed()) throw new Error(`Failed to expand post`)
    }, 100)
    return this
  }

  checkIfHiringPost() {
    const postBody = this.fetchPostBody()
    if (!postBody) {
      postBodyNotFoundCounter++
      customLog("Could not find post body", this.element)
      // determine if the selector is outdated
      if (postBodyNotFoundCounter > postBodyNotFoundLimit)
        throw new Error(`Could not find post body for more than ${postBodyNotFoundLimit} times in a row`)
      return false
    }
    postBodyNotFoundCounter = 0
    return postBody.textContent?.includes("hiring")
  }
}

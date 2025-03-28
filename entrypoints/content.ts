import { LinkedinPost } from "@/lib/linkedin-post-class"
import type { ContentScriptContext } from "wxt/client"

const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
const postSelector = "[data-view-tracking-scope]"
const postParentSelector = "[data-finite-scroll-hotkey-context='FEED']"

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
function mainWatch(ctx: ContentScriptContext) {
  // fetching initial posts
  for (const element of document.querySelectorAll(postSelector)) {
    new LinkedinPost(element)
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
          new LinkedinPost(node)
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

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

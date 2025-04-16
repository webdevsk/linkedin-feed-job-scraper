import { postParentSelector, postSelector, sharedPostSelector } from "@/lib/linkedin-post-class"
import type { ContentScriptContext } from "wxt/client"
import { injectConsole } from "@/utils/inject-console"
import { handleScraping } from "./handle-scraping"
import { RemoveListenerCallback } from "@webext-core/messaging"
injectConsole()

const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
export const jobPostService = getJobPostService()

export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main(ctx) {
    console.log("Injecting content script")
    const messageListeners: RemoveListenerCallback[] = []

    onReadyForScripting(ctx, (/** Fires when scraping context is invalidated */ onInvalidated) => {
      let stopObserver: MutationObserver["disconnect"] | null = null
      console.log("Ready for script")
      sendMessage("triggerReadyState", true)

      const m1 = onMessage("triggerStart", () => {
        stopObserver = startObserver()
        isRunningStorage.setValue(true)
        console.log(stopObserver, "onStart")
      })

      const m2 = onMessage("triggerStop", () => {
        stopObserver?.()
        isRunningStorage.setValue(false)
      })

      // Add listeners here so that we can remove them at ease
      messageListeners.push(m1, m2)

      onInvalidated(() => {
        console.log(stopObserver, "invalidated")
        console.log("Not ready")
        sendMessage("triggerReadyState", false)
        stopObserver?.()
        isRunningStorage.setValue(false)
        messageListeners.forEach((cb) => cb())
      })
    })
  },
})

type OnInvalidated = (cb: () => void) => void

/** Check if we are on the correct page and environment for scraping */
function onReadyForScripting(ctx: ContentScriptContext, cb: (onInvalidated: OnInvalidated) => void) {
  const onInvalidated: OnInvalidated = (cb) => {
    ctx.addEventListener(window, "wxt:locationchange", cb)
    // When the tab is closed
    ctx.addEventListener(window, "beforeunload", cb)
    ctx.onInvalidated(cb)
  }

  const lookForSelector = (selector: string, cb: () => void) => {
    const observer = new MutationObserver((_, observer) => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        cb()
      }
    })
    observer.observe(document, { childList: true, subtree: true })
    ctx.addEventListener(window, "wxt:locationchange", observer.disconnect)
  }

  // Run if initially on target page
  if (feedUrlWatchPattern.includes(window.location.href)) lookForSelector(postParentSelector, () => cb(onInvalidated))

  // Run when dynamically navigated to target page
  ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
    if (feedUrlWatchPattern.includes(newUrl)) lookForSelector(postParentSelector, () => cb(onInvalidated))
  })
}

// Main function to run when we are in the feed page
function startObserver(): MutationObserver["disconnect"] {
  const rootToObserve = document.querySelector(postParentSelector)!

  // fetching initial posts
  for (const element of rootToObserve.querySelectorAll(postSelector)) {
    handleScraping(element)
    const sharedPost = element.querySelector<HTMLDivElement>(sharedPostSelector)
    if (sharedPost) handleScraping(sharedPost, true)
  }

  // fetching new posts dynamically
  const callback: MutationCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (!mutation.addedNodes.length) continue
      for (const node of mutation.addedNodes) {
        if (isElement(node) && node.matches(postSelector)) {
          handleScraping(node)
          const sharedPost = node.querySelector<HTMLDivElement>(sharedPostSelector)
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

  return observer.disconnect
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

import { postParentSelector, postSelector, sharedPostSelector } from "@/lib/linkedin-post-class"
import type { ContentScriptContext } from "wxt/client"
import { injectConsole } from "@/utils/inject-console"
import { handleScraping } from "./handle-scraping"
import { onMessageExt } from "@/utils/on-message-ext"
import { WatchForSelectorCallback, watchForSelectors } from "@/utils/watch-for-selectors"
injectConsole()

const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
export const jobPostService = getJobPostService()

export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main(ctx) {
    console.log("Injecting content script")
    const ctrl = new AbortController()

    onReadyForScripting(ctx, () => {
      const triggerCtrl = new AbortController()
      console.log("Ready for script")
      sendMessage("triggerReadyState", true)

      onMessageExt(ctrl, "triggerStart", () => {
        console.log("trigger started")
        startObserver(triggerCtrl)
        sendMessage("triggerRunningState", true)
      })

      onMessageExt(ctrl, "triggerStop", () => {
        triggerCtrl.abort()
        console.log("trigger cancelled")
        sendMessage("triggerRunningState", false)
      })

      return () => {
        // Cleanup code
        console.log("Cleaning...")
        sendMessage("triggerReadyState", false)
        console.log("Saved ready state")
        triggerCtrl.abort()
        console.log("Aborted trigger controller")
        sendMessage("triggerRunningState", false)
        console.log("Saved running state")
        ctrl.abort()
        console.log("Aborted main controller")
      }
    })
  },
})

/** Check if we are on the correct page and environment for scraping */
function onReadyForScripting(ctx: ContentScriptContext, cb: WatchForSelectorCallback) {
  // To stop the watcher and invoke cleanup function when environment is invalidated
  const ctrl = new AbortController()
  // Run if initially on target page
  if (feedUrlWatchPattern.includes(window.location.href)) watchForSelectors([postParentSelector], cb, ctrl)

  // Run when dynamically navigated to target page
  ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
    if (feedUrlWatchPattern.includes(newUrl)) {
      watchForSelectors([postParentSelector], cb, ctrl)
    } else {
      ctrl.abort()
    }
  })
  ctx.addEventListener(window, "beforeunload", ctrl.abort)
  ctx.onInvalidated(ctrl.abort)
}

// Main function to run when we are in the feed page
function startObserver({ signal }: { signal?: AbortSignal } = {}): MutationObserver["disconnect"] {
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

  signal?.addEventListener("abort", observer.disconnect)
  return observer.disconnect
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

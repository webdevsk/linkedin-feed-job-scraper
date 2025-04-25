import { postParentSelector, postSelector, sharedPostSelector } from "@/lib/linkedin-post-class"
import type { ContentScriptContext } from "wxt/client"
import { injectConsole } from "@/utils/inject-console"
import { handleScraping } from "./handle-scraping"
import { WatchForSelectorCallback, watchForSelectors } from "@/utils/watch-for-selectors"
import { simulateMouseWheelScroll } from "@/utils/natural-scroll-simulation"
injectConsole()

const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
export const jobPostService = getJobPostService()
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main(ctx) {
    console.log("Injecting content script")
    const originalAddEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      console.log(type)
      // if (type === 'visibilitychange') {
      //   // Either don't add the listener or add a no-op
      //   return;
      // }
      return originalAddEventListener.call(this, type, listener, options)
    }

    // initial state. Will change when all the requirements are met
    sendMessage("triggerReadyState", false)

    onReadyForScripting(ctx, () => {
      let dismissObserver: (() => void) | null = null
      let autoScroll: boolean = false

      const dismissObserverCallback = () => {
        console.log("stopped")
        dismissObserver?.()
        dismissObserver = null
        autoScroll = false
        sendMessage("triggerRunningState", false)
      }

      console.log("Ready for script")
      sendMessage("triggerReadyState", true)

      const listeners = [
        onMessage("triggerStart", async () => {
          console.log("trigger started")
          dismissObserver = startObserver(dismissObserverCallback)
          sendMessage("triggerRunningState", true)
          autoScroll = true
          while (autoScroll) {
            await simulateMouseWheelScroll(1e3)
            await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 4000))
          }
        }),

        onMessage("triggerStop", dismissObserverCallback),
      ]

      return () => {
        // Cleanup code
        console.log("Cleaning...")
        sendMessage("triggerReadyState", false)
        console.log("Saved ready state")
        console.log("Aborted scraping")
        sendMessage("triggerRunningState", false)
        console.log("Saved running state")
        listeners.forEach((dismiss) => dismiss())
      }
    })
  },
})

/** Check if we are on the correct page and environment for scraping */
const onReadyForScripting = (ctx: ContentScriptContext, cb: WatchForSelectorCallback) => {
  // To stop the watcher and invoke cleanup function when environment is invalidated
  let ctrl: AbortController = new AbortController()
  // Run if initially on target page
  if (feedUrlWatchPattern.includes(window.location.href)) watchForSelectors([postParentSelector], cb, ctrl)

  // Run when dynamically navigated to target page
  ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
    if (feedUrlWatchPattern.includes(newUrl)) {
      watchForSelectors([postParentSelector], cb, ctrl)
    } else {
      ctrl.abort("Location change")
      // Reset
      ctrl = new AbortController()
      ctrl.signal.throwIfAborted()
    }
  })
  ctx.onInvalidated(ctrl.abort)
}

// Main function to run when we are in the feed page
const startObserver = (dismiss: () => void): (() => void) => {
  const scrapeLimit: number = 20
  let scraped: number = 0
  let stopped: boolean = false

  const scrapeAndCount = (...args: Parameters<typeof handleScraping>): boolean => {
    console.log("in here", scraped, stopped)
    if (scraped >= scrapeLimit) {
      if (!stopped) dismiss()
      stopped = true
      return true
    } else {
      handleScraping(...args)
      scraped++
      console.log("scraped :", scraped)
      return false
    }
  }

  const rootToObserve = document.querySelector(postParentSelector)!

  // fetching initial posts
  for (const element of rootToObserve.querySelectorAll(postSelector)) {
    if (scrapeAndCount(element)) break // dismiss inside scrapeAndCount only stops the observer but doesnt stop this loop keeping the whole startObserver function running. So we break it when we're done
    const sharedPost = element.querySelector<HTMLDivElement>(sharedPostSelector)
    if (sharedPost && scrapeAndCount(sharedPost, true)) break
  }

  // fetching new posts dynamically
  const callback: MutationCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (!mutation.addedNodes.length) continue
      for (const node of mutation.addedNodes) {
        if (isElement(node) && node.matches(postSelector)) {
          if (scrapeAndCount(node)) return // dismiss inside scrapeAndCount only stops the observer but doesnt stop this loop keeping the whole startObserver function running. So we break it when we're done
          const sharedPost = node.querySelector<HTMLDivElement>(sharedPostSelector)
          if (sharedPost && scrapeAndCount(sharedPost, true)) return
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

  return observer.disconnect.bind(observer)
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

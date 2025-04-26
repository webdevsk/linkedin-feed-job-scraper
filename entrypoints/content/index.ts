import { postParentSelector, postSelector, sharedPostSelector } from "@/lib/linkedin-post-class"
import type { ContentScriptContext } from "wxt/client"
import { injectConsole } from "@/utils/inject-console"
import { handleScraping } from "./handle-scraping"
import { WatchForSelectorCallback, watchForSelectors } from "@/utils/watch-for-selectors"
import { simulateMouseWheelScroll } from "@/utils/natural-scroll-simulation"
import { Runtime } from "wxt/browser"
import { GetCurrentScrapeSessionMessage } from "@/types/onconnect-types"

const feedUrlWatchPattern = new MatchPattern("*://*.linkedin.com/feed/*")
export const jobPostService = getJobPostService()
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main(ctx) {
    injectConsole()
    console.log("Injecting content script")

    // initial state. Will change when all the requirements are met
    sendMessage("triggerReadyState", false)

    onReadyForScripting(ctx, () => {
      let dismissObserver: (() => void) | null = null
      let autoScroll: boolean = false
      let scrapedPostCount: number = 0
      let scannedPostCount: number = 0

      /** For sending current session state to popup */
      let portForScrapeSession: Runtime.Port | null = null
      const setPortCallback = (port: Runtime.Port) => {
        console.log("Listening for ports: ", port)
        if (port.name === "getCurrentScrapeSession") {
          portForScrapeSession = port
        }
        port.onDisconnect.addListener(() => {
          console.log("port disconnected by popup")
          portForScrapeSession = null
        })
      }
      browser.runtime.onConnect.addListener(setPortCallback)

      console.log("Ready for script")
      sendMessage("triggerReadyState", true)

      const listeners = [
        onMessage("triggerStart", async () => {
          console.log("trigger started")
          scrapedPostCount = 0
          scannedPostCount = 0
          try {
            // Telling service worker to save the running state along with our tabId. It should throw if the connection fails
            await sendMessage("triggerRunningState", true)
            // Starts the mutation observer
            dismissObserver = startObserver((element) => {
              // Scrape the main post
              const scrapedPost = handleScraping(element)
              scannedPostCount++
              if (scrapedPost) {
                scrapedPostCount++
                jobPostService.postJobs([scrapedPost])
              }
              // Scrape any shared post by the main post
              const sharedPost = element.querySelector<HTMLDivElement>(sharedPostSelector)
              if (sharedPost) {
                scannedPostCount++
                const scrapedPost = handleScraping(sharedPost, true)
                if (scrapedPost !== null) {
                  scrapedPostCount++
                  jobPostService.postJobs([scrapedPost])
                }
              }
              // Update popup ui
              portForScrapeSession?.postMessage({
                scrapedPostCount,
                scannedPostCount,
              } satisfies GetCurrentScrapeSessionMessage)
            })

            // Start auto scrolling for the oberver to catch new elements
            autoScroll = true
            while (autoScroll) {
              await simulateMouseWheelScroll(1e3)
              await sleep(3e3, 7e3)
            }
          } catch (error) {
            console.error(error)
          }
        }),

        onMessage("triggerStop", async () => {
          console.log("stopped")
          dismissObserver?.()
          autoScroll = false
          sendMessage("triggerRunningState", false)
        }),
      ]

      return () => {
        // Cleanup code
        sendMessage("triggerReadyState", false)
        sendMessage("triggerRunningState", false)
        listeners.forEach((dismiss) => dismiss())
        portForScrapeSession?.disconnect()
        browser.runtime.onConnect.removeListener(setPortCallback)
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

/**
 * Starts an observer to scrape posts
 * @param cb - Callback function to handle scraped posts
 * @returns A function to stop the observer
 */
const startObserver = (cb: (element: Element) => void): (() => void) => {
  let isDoneFlag: boolean = false
  let firstRun: boolean = true
  const rootToObserve = document.querySelector(postParentSelector)!

  if (firstRun) {
    // fetching initial posts
    for (const element of rootToObserve.querySelectorAll(postSelector)) {
      if (isDoneFlag) break
      cb(element)
    }
  }

  // fetching new posts dynamically
  const callback: MutationCallback = (mutationList) => {
    for (const mutation of mutationList) {
      if (isDoneFlag) return
      if (!mutation.addedNodes.length) continue
      for (const node of mutation.addedNodes) {
        if (isDoneFlag) return
        if (isElement(node) && node.matches(postSelector)) {
          cb(node)
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

  return () => {
    observer.disconnect()
    isDoneFlag = true
    firstRun = false
  }
}

const isElement = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE
/** Sleeps for a random time between min and max */
const sleep = (min: number, max: number) =>
  new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))

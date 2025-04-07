export const customError: typeof console.error = (...parameters) =>
  console.error("[Linkedin Feed Job Scraper] ", ...parameters)

export const customLog: typeof console.log = (...parameters) =>
  console.log("[Linkedin Feed Job Scraper] ", ...parameters)

// fetch it from storage
// periodically update it from a github repo
const refineKeywords = (keywords: (string | RegExp)[]) =>
  keywords
    .map((keyword) => (typeof keyword === "string" ? keyword : keyword.source))
    .map((keyword) => keyword.replaceAll(/\s+/g, "\\s+"))

export const extensionConfig = {
  keywordProfiles: {
    en: refineKeywords([
      /(?!(you|they))( is|( are| am|\Sre)) (#)?hiring/, // \S is to match any non-whitespace character like '|"|`|’
      /(?!(you|they))( is|( are| am|\Sre)) looking for/,
      /(?!(you|they))( is|( are| am|\Sre)) seeking/,
      "we seek",
      /(apply|application) (now|here|today)/,
      "help build",
      "open role",
      /join (us|now)/,
    ]),
  },
}

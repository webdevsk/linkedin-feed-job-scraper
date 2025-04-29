import { csvGenerator } from "@/utils/csv-generator"
import ExcelJS from "exceljs"

type Data = Record<string, unknown>

export const exportFunctions = {
  json: (data: Data[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${i18n.t("extension_name").toLowerCase().replaceAll(" ", "_")}_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  },

  csv: (data: Data[]) => {
    const csv = csvGenerator(data)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${i18n.t("extension_name").toLowerCase().replaceAll(" ", "_")}_export_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  },

  xlsx: async (jobPosts: (Omit<JobPost, "postContents"> & { postContents: string[] })[]): Promise<void> => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(i18n.t("extension_name"))

    // Define columns with headers, keys, and widths
    sheet.columns = [
      { header: "Post ID", key: "postId", width: 10 },
      { header: "Post URL", key: "postUrl", width: 30 },
      { header: "Post Body", key: "postBody", width: 50 },
      { header: "Author", key: "author", width: 20 },
      //   { header: "Author URL", key: "authorUrl", width: 30 },
      { header: "Posted At", key: "postedAt", width: 16 },
      { header: "First Scraped At", key: "firstScrapedAt", width: 16 },
      { header: "Updated At", key: "updatedAt", width: 16 },
      { header: "Post Contents", key: "postContents", width: 50 },
    ]

    // Add rows and apply hyperlinks and formatting
    for (const post of jobPosts) {
      const row = sheet.addRow({
        postId: post.postId,
        postUrl: post.postUrl,
        postBody: post.postBody,
        author: post.postAuthor?.name ?? post.postAuthor?.url ?? "",
        // authorUrl: post.postAuthor?.url ?? "",
        postedAt: new Date(post.postedAt),
        firstScrapedAt: new Date(post.firstScrapedAt),
        updatedAt: new Date(post.updatedAt),
        postContents: post.postContents.join("\n"),
      })

      // Explicit hyperlinks
      row.getCell("postUrl").value = {
        text: post.postUrl,
        hyperlink: post.postUrl,
      }
      if (post.postAuthor?.url) {
        row.getCell("author").value = {
          text: post.postAuthor.name ?? post.postAuthor.url ?? "",
          hyperlink: post.postAuthor.url,
        }
      }

      // postContents: newline-separated URLs will be auto-detected as hyperlinks in Excel/Sheets
    }

    // Set date formatting (Excel/Sheets will render according to viewer locale/timezone)
    ;["postedAt", "firstScrapedAt", "updatedAt"].forEach((colKey) => {
      const col = sheet.getColumn(colKey)
      col.numFmt = "dd-mm-yy hh:mm:ss"
    })

    // Return the XLSX file as a Buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${i18n.t("extension_name").toLowerCase().replaceAll(" ", "_")}_export_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  },
}

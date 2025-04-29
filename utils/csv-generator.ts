type Data = Record<string, unknown>

function flattenObject(obj: Data, parentKey = "", result: Data = {}): Data {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key

    if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== "object" || v === null)) {
        // Array of primitives
        result[newKey] = value.join("; ")
      } else {
        // Array of objects or mixed — serialize as JSON
        result[newKey] = JSON.stringify(value)
      }
    } else if (value !== null && typeof value === "object") {
      // Recursively flatten nested objects
      flattenObject(value as Data, newKey, result)
    } else {
      // Add primitive values directly
      result[newKey] = value
    }
  }

  return result
}

export function csvGenerator(data: Data[]): string {
  if (data.length === 0) return ""

  const flattenedData = data.map((item) => flattenObject(item))
  const headersSet = new Set<string>()

  flattenedData.forEach((item) => {
    Object.keys(item).forEach((key) => headersSet.add(key))
  })

  const headers = Array.from(headersSet)

  const csvRows = flattenedData.map((item) => {
    return headers
      .map((header) => {
        const value = item[header]
        if (value === undefined || value === null) return ""
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`
        return value
      })
      .join(",")
  })

  // Add UTF-8 BOM for emoji/special char safety
  return "\uFEFF" + [headers.join(","), ...csvRows].join("\n")
}

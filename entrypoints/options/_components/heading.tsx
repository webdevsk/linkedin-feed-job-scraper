import * as React from "react"

export const Heading: React.FC<{ title: string }> = ({ title, ...rest }) => {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold" {...rest}>
        {title}
      </h1>
    </div>
  )
}

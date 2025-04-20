import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SettingsTab: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Extension Settings</CardTitle>
          <CardDescription>Configure how the extension works</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings options would go here.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsTab

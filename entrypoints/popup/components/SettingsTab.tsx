const SettingsTab: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Extension Settings</CardTitle>
          <CardDescription>Configure how the extension works</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Settings options would go here.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsTab

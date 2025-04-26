import { JobsPage } from "../_components/jobs-page"
import { SettingsPage } from "../_components/settings-page"
export const routeConfig = {
  navMain: [
    {
      title: "Navigation",
      items: [
        {
          title: "Jobs",
          url: "/jobs",
          render: JobsPage,
        },
        {
          title: "Settings",
          url: "/settings",
          render: SettingsPage,
        },
      ],
    },
  ],
}

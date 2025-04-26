import { Route, Routes, useLocation } from "react-router-dom"
import { JobsPage } from "./_components/jobs-page"
import { AppSidebar } from "./_components/app-sidebar"
import { routeConfig } from "./_utils/route-config"

export default function App() {
  const flattendRoutes = useMemo(() => routeConfig.navMain.map((category) => category.items).flat(), [routeConfig])
  const location = useLocation()
  const currentRoute = flattendRoutes.find((route) => route.url === location.pathname)

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Linkedin Feed Job Scraper</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentRoute?.title ?? location.pathname.replace("/", "")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex-1 px-4">
            <div className="mx-auto max-w-4xl">
              <Routes>
                {flattendRoutes.map((route) => (
                  <Route key={route.title} index={route.title === "Jobs"} path={route.url} element={<route.render />} />
                ))}
                <Route path="*" element={<JobsPage />} />
              </Routes>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  )
}

'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import AuthWrapper from "@/components/AuthWrapper"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthWrapper>
  )
}
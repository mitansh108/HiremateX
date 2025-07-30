"use client"

import * as React from "react"
import {
  Briefcase,
  FileText,
  Mail,
  MessageSquare,
  Users,
  Target,
  Bell,
  HelpCircle,
  Bot,
  CreditCard,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"

const mainNavItems = [
  {
    title: "Jobs",
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Job Tracking",
    url: "/tracking",
    icon: Target,
  },
  {
    title: "Resume",
    url: "/resume",
    icon: FileText,
  },
  {
    title: "Cover Letter",
    url: "/cover-letter",
    icon: FileText,
  },
  {
    title: "Cold Email (AI)",
    url: "/cold-email",
    icon: Bot,
  },
  {
    title: "Cold Email Templates",
    url: "/cold-email-templates",
    icon: Mail,
  },
  {
    title: "LinkedIn DM",
    url: "/linkedin-dm",
    icon: MessageSquare,
  },
  {
    title: "LinkedIn Connection",
    url: "/linkedin-connection",
    icon: Users,
  },
]

const secondaryNavItems = [
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Support",
    url: "/support",
    icon: HelpCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-gray-200" {...props}>
      <SidebarHeader className="px-6 py-6">
        <Link href="/home" className="flex items-center gap-2">
          <Target className="h-6 w-6 text-orange-500" />
          <span className="text-lg font-semibold text-orange-500">HireMateNano</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarMenu className="space-y-1">
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-10 px-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg">
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-8">
          <SidebarSeparator className="mb-4" />
          <SidebarMenu className="space-y-1">
            {secondaryNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild className="h-10 px-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg">
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="px-3 pb-4">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

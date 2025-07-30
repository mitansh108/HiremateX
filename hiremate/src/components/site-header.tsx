"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { checkUserCredits } from "@/lib/credit-api"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function SiteHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [loadingCredits, setLoadingCredits] = useState(false)

  // Fetch user credits from AI service
  const fetchCredits = async (userId: string) => {
    setLoadingCredits(true)
    try {
      const creditInfo = await checkUserCredits(userId)
      if (creditInfo.success) {
        setCredits(creditInfo.credits)
      } else {
        console.error('Failed to fetch credits:', creditInfo.error_message)
        setCredits(0)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      setCredits(0)
    } finally {
      setLoadingCredits(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch credits when user is loaded
      if (user) {
        await fetchCredits(user.id)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        // Fetch credits when user logs in
        if (session?.user) {
          await fetchCredits(session.user.id)
        } else {
          setCredits(0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Refresh credits function (can be called from other components)
  const refreshCredits = async () => {
    if (user) {
      await fetchCredits(user.id)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Job Search Assistant</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Credits Left */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
              <div className={`w-2 h-2 rounded-full ${
                loadingCredits ? 'bg-gray-400 animate-pulse' : 
                credits > 10 ? 'bg-orange-500' : 
                credits > 5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                loadingCredits ? 'text-gray-600' :
                credits > 10 ? 'text-orange-700' : 
                credits > 5 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {loadingCredits ? 'Loading...' : `${credits} credits left`}
              </span>
            </div>
          )}

          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-orange-200 transition-all">
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-medium">
                    {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}

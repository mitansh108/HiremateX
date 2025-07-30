'use client'

import DashboardLayout from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Briefcase, Search, ArrowRight, FileText, Mail, Users, Target, Calendar, TrendingUp, Flame } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function HomePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [username, setUsername] = useState("User")
  const [totalJobs, setTotalJobs] = useState(0)
  const [weeklyLimit, setWeeklyLimit] = useState(50)
  const [userStage, setUserStage] = useState("new") // new, active, advanced
  const [loading, setLoading] = useState(true)

  // Create user profile if it doesn't exist (for OAuth users)
  const createUserProfileIfNeeded = async (user: SupabaseUser) => {
    try {
      console.log('Checking/creating profile for user:', user.id, user.email)

      // Check if profile already exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking existing profile:', selectError)
        return
      }

      if (!existingProfile) {
        console.log('Profile does not exist, creating new profile...')

        // Create profile if it doesn't exist
        const profileData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || '',
          created_at: new Date().toISOString()
        }

        console.log('Inserting profile data:', profileData)

        const { data: insertedProfile, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()

        if (profileError) {
          console.error('Error creating profile:', profileError)
          console.error('Profile error details:', profileError.details, profileError.hint)
        } else {
          console.log('Profile created successfully:', insertedProfile)
        }
      } else {
        console.log('Profile already exists for user:', user.id)
      }
    } catch (error) {
      console.error('Error in createUserProfileIfNeeded:', error)
    }
  }

  // Weekly progress data
  const [weeklyApplications, setWeeklyApplications] = useState(0)
  const [weeklyCoverLetters, setWeeklyCoverLetters] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState(10)
  const [activeStreak, setActiveStreak] = useState(0)

  // Fetch user details and applications from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUser(user)

        // Create user profile if it doesn't exist (for OAuth users)
        await createUserProfileIfNeeded(user)

        // Set username from user metadata or email
        const displayName = user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User'
        setUsername(displayName)

        // Fetch total job applications
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('id, created_at')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching jobs:', error)
        } else {
          setTotalJobs(jobs?.length || 0)

          // Calculate weekly applications (last 7 days)
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

          const weeklyJobs = jobs?.filter(job =>
            new Date(job.created_at) >= oneWeekAgo
          ) || []

          setWeeklyApplications(weeklyJobs.length)
        }

        // TODO: Fetch weekly cover letters count from your cover letter generation logs
        // For now using mock data based on applications
        setWeeklyCoverLetters(Math.floor(weeklyApplications * 0.6)) // Assume 60% of applications have cover letters

        // Fetch weekly search limit (credits) from AI service
        try {
          const { checkUserCredits } = await import('@/lib/credit-api')
          const creditInfo = await checkUserCredits(user.id)
          if (creditInfo.success) {
            setWeeklyLimit(creditInfo.credits)
          } else {
            setWeeklyLimit(50) // Fallback
          }
        } catch (error) {
          console.error('Failed to fetch credits for home page:', error)
          setWeeklyLimit(50) // Fallback
        }

        // TODO: Calculate actual streak from user activity logs
        // For now using mock data based on total applications
        setActiveStreak(Math.min(totalJobs, 14)) // Cap at 14 days for demo

      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const displayName = session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'User'
          setUsername(displayName)
        } else {
          setUser(null)
          setUsername("User")
          setTotalJobs(0)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Determine user stage based on activity
  useEffect(() => {
    if (totalJobs === 0) {
      setUserStage("new")
    } else if (totalJobs < 10) {
      setUserStage("active")
    } else {
      setUserStage("advanced")
    }
  }, [totalJobs])

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-slate-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Dynamic suggestions based on user journey
  const getNextSteps = () => {
    switch (userStage) {
      case "new":
        return [
          {
            title: "Upload Your Resume",
            description: "Start by uploading your resume to get AI-powered analysis",
            icon: FileText,
            href: "/resume",
            color: "blue" as const
          },
          {
            title: "Find Your First Job",
            description: "Browse and extract job requirements from job postings",
            icon: Search,
            href: "/jobs",
            color: "orange" as const
          }
        ]
      case "active":
        return [
          {
            title: "Send Follow-up Emails",
            description: "You've applied to jobs - time to send follow-ups?",
            icon: Mail,
            href: "/email",
            color: "orange" as const
          },
          {
            title: "Generate Cover Letters",
            description: "Create personalized cover letters for your applications",
            icon: FileText,
            href: "/cover-letter",
            color: "blue" as const
          }
        ]
      case "advanced":
        return [
          {
            title: "Cold Email Recruiters",
            description: "Try reaching out to recruiters at target companies",
            icon: Mail,
            href: "/cold-email",
            color: "orange" as const
          },
          {
            title: "LinkedIn Outreach",
            description: "Connect with professionals in your target companies",
            icon: Users,
            href: "/linkedin-connection",
            color: "blue" as const
          }
        ]
      default:
        return []
    }
  }

  return (
    <DashboardLayout>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Welcome Card */}
            <Card className="bg-white border-gray-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Welcome Back
                </CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  Hi, {username}!
                </div>
                <p className="text-sm text-gray-500">
                  Ready to find your next opportunity?
                </p>
              </CardContent>
            </Card>

            {/* Total Applications Card */}
            <Card className="bg-white border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Total Applications
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {totalJobs}
                </div>
                <p className="text-sm text-gray-500">
                  Jobs applied this month
                </p>
              </CardContent>
            </Card>

            {/* Weekly Search Limit Card */}
            <Card className="bg-white border-gray-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Weekly Search Limit
                </CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Search className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {weeklyLimit}
                </div>
                <p className="text-sm text-gray-500">
                  Searches remaining
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Weekly Progress Summary */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">This Week's Progress</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Weekly Activity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Weekly Activity</h3>
                        <p className="text-sm text-gray-500">Your job search progress</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Applications sent</span>
                        <span className="font-semibold text-blue-600">{weeklyApplications}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cover letters generated</span>
                        <span className="font-semibold text-blue-600">{weeklyCoverLetters}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Goal Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Target className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Weekly Goal</h3>
                        <p className="text-sm text-gray-500">Progress towards target</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Goal: {weeklyGoal} applications</span>
                        <span className="font-semibold text-orange-600">{weeklyApplications}/{weeklyGoal}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((weeklyApplications / weeklyGoal) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {weeklyApplications >= weeklyGoal
                          ? "🎉 Goal achieved this week!"
                          : `${weeklyGoal - weeklyApplications} more to reach your goal`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Activity Streak */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Flame className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Activity Streak</h3>
                        <p className="text-sm text-gray-500">Keep the momentum going!</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {activeStreak}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {activeStreak === 1 ? 'day' : 'days'} active
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        {activeStreak > 0 && (
                          <span className="text-lg">🔥</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {activeStreak >= 7
                            ? "Amazing streak!"
                            : activeStreak >= 3
                              ? "Great momentum!"
                              : activeStreak > 0
                                ? "Keep it up!"
                                : "Start your streak today!"
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Search className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">How Our Platform Works</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>

            <Card className="bg-white border-gray-200 mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      step: "1",
                      title: "Upload Resume",
                      description: "Upload your resume and our AI extracts skills, experience, and qualifications",
                      icon: FileText,
                      color: "orange"
                    },
                    {
                      step: "2",
                      title: "Add Job URL",
                      description: "Paste job posting URLs and get instant AI analysis of requirements",
                      icon: Search,
                      color: "orange"
                    },
                    {
                      step: "3",
                      title: "Get Match Analysis",
                      description: "Receive compatibility scores, skill gaps, and personalized recommendations",
                      icon: TrendingUp,
                      color: "orange"
                    },
                    {
                      step: "4",
                      title: "AI Content Generation",
                      description: "Generate cover letters, emails, and LinkedIn messages instantly",
                      icon: Mail,
                      color: "orange"
                    }
                  ].map((workflow, index) => {
                    const IconComponent = workflow.icon
                    return (
                      <div key={index} className="relative">
                        {/* Connecting Line */}
                        {index < 3 && (
                          <div className="hidden lg:block absolute top-8 -right-3 w-6 h-0.5 bg-orange-200 z-10"></div>
                        )}

                        <div className="text-center space-y-4">
                          {/* Step Number */}
                          <div className="w-12 h-12 mx-auto bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {workflow.step}
                          </div>

                          {/* Icon */}
                          <div className="w-10 h-10 mx-auto bg-orange-50 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-orange-600" />
                          </div>

                          {/* Content */}
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">{workflow.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{workflow.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Process Summary */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-600 font-medium text-sm uppercase tracking-wide">AI-Powered Workflow</span>
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-600 text-sm max-w-2xl mx-auto leading-relaxed">
                      Our advanced AI analyzes thousands of data points to create perfect matches between your profile and job requirements,
                      then generates personalized content that increases your response rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps Suggestions */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Target className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">Next Steps</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getNextSteps().map((step, index) => {
                const IconComponent = step.icon
                const colorClasses = {
                  blue: "bg-white border-gray-200 hover:border-blue-300",
                  orange: "bg-white border-gray-200 hover:border-orange-300"
                }
                const iconColors = {
                  blue: "text-blue-600 bg-blue-50",
                  orange: "text-orange-600 bg-orange-50"
                }

                return (
                  <Link key={index} href={step.href}>
                    <Card className={`${colorClasses[step.color]} hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${iconColors[step.color]} group-hover:scale-110 transition-transform duration-200`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                              {step.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* User Stage Indicator */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${userStage === 'new' ? 'bg-blue-500' :
                  userStage === 'active' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></div>
                {userStage === 'new' && 'Getting Started'}
                {userStage === 'active' && 'Building Momentum'}
                {userStage === 'advanced' && 'Power User'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
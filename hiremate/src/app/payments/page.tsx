'use client'

import DashboardLayout from "@/components/DashboardLayout"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    CreditCard,
    Coins,
    Star,
    Check,
    Zap,
    Shield
} from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { createCheckoutSession } from '@/lib/payment-api'

interface CreditPackage {
    id: string
    name: string
    credits: number
    price: number
    popular?: boolean
    bonus?: number
    description: string
}



const creditPackages: CreditPackage[] = [
    {
        id: 'starter',
        name: 'Starter',
        credits: 50,
        price: 9.99,
        description: 'Perfect for getting started'
    },
    {
        id: 'professional',
        name: 'Professional',
        credits: 200,
        price: 24.99,
        popular: true,
        bonus: 50,
        description: 'Most popular for job seekers'
    },
    {
        id: 'premium',
        name: 'Premium',
        credits: 500,
        price: 49.99,
        bonus: 150,
        description: 'Best value for power users'
    },

]

export default function PaymentsPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [currentCredits, setCurrentCredits] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for success/cancel parameters
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('success') === 'true') {
            alert('Payment successful! Your credits have been added to your account.')
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        } else if (urlParams.get('canceled') === 'true') {
            alert('Payment was canceled.')
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
        }

        const fetchUserData = async () => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setLoading(false)
                    return
                }

                setUser(user)

                // Fetch current credits from backend
                try {
                    const { checkUserCredits } = await import('@/lib/credit-api')

                    // Get current credits
                    const creditInfo = await checkUserCredits(user.id)
                    if (creditInfo.success) {
                        setCurrentCredits(creditInfo.credits)
                    }
                } catch (error) {
                    console.error('Failed to fetch credits:', error)
                }

            } catch (error) {
                console.error('Error fetching user data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_, session) => {
                if (session?.user) {
                    setUser(session.user)
                } else {
                    setUser(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const handlePurchase = async (packageId: string) => {
        if (!user) return

        try {
            console.log('Creating checkout session for package:', packageId)

            // Create checkout session
            const checkoutResult = await createCheckoutSession(user.id, packageId)

            if (!checkoutResult.success || !checkoutResult.checkout_url) {
                throw new Error(checkoutResult.error_message || 'Failed to create checkout session')
            }

            // Redirect to Stripe Checkout page
            window.location.href = checkoutResult.checkout_url

        } catch (error) {
            console.error('Payment failed:', error)
            alert(`Payment failed: ${error}`)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-64 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-8 md:gap-6 md:py-12 max-w-7xl mx-auto w-full px-4">

                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full mb-4">
                            <Coins className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-700">Current Balance: {currentCredits} credits</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Unlock the power of AI-driven job applications. Get personalized cover letters, skill analysis, and more.
                        </p>
                    </div>

                    {/* Professional Pricing Table */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold text-gray-900">Plans</h3>
                                </div>
                                {creditPackages.map((pkg) => (
                                    <div key={pkg.id} className="text-center relative">
                                        {pkg.popular && (
                                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-orange-500 text-white px-3 py-1 text-xs">
                                                    Most Popular
                                                </Badge>
                                            </div>
                                        )}
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h4>
                                        <div className="mb-2">
                                            <span className="text-3xl font-bold text-gray-900">${pkg.price}</span>
                                            <span className="text-gray-500 text-sm">/pack</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                                        <Button
                                            onClick={() => handlePurchase(pkg.id)}
                                            className={`w-full ${pkg.popular
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                                                }`}
                                        >
                                            Chose Plan
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feature Rows */}
                        <div className="divide-y divide-gray-100">
                            {/* Credits */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">Total Credits</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <span className="font-semibold text-gray-900">
                                                {pkg.credits + (pkg.bonus || 0)}
                                            </span>
                                            {pkg.bonus && (
                                                <span className="text-xs text-orange-600 block">
                                                    ({pkg.credits} + {pkg.bonus} bonus)
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cover Letters */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">AI Cover Letters</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skill Analysis */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">Skill Matching</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cold Emails */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">Cold Email Generation</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* LinkedIn Messages */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">LinkedIn Messages</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resume Analysis */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">Resume Analysis</span>
                                    </div>
                                    {creditPackages.map((pkg) => (
                                        <div key={pkg.id} className="text-center">
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Support */}
                            <div className="px-8 py-4 hover:bg-gray-50 transition-colors">
                                <div className="grid grid-cols-4 gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">Priority Support</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-600">Basic Support</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-600">Priority Support</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm text-gray-600">Premium Support</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="text-center mt-12">
                        <div className="inline-flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm">Secure payments powered by Stripe • Your data is protected</span>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    )
}
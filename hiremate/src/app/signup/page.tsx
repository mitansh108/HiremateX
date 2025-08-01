'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            })

            if (error) {
                setError(error.message)
            } else if (data.user) {
                console.log('User signed up successfully:', data.user.id, data.user.email)
                console.log('User confirmation status:', data.user.email_confirmed_at)

                // Only create profile if user is immediately confirmed (like with OAuth)
                // For email signups, profile will be created when they first log in after email confirmation
                if (data.user.email_confirmed_at) {
                    try {
                        console.log('Creating profile for confirmed user...')
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert({
                                id: data.user.id,
                                email: data.user.email,
                                full_name: fullName,
                                created_at: new Date().toISOString()
                            })

                        if (profileError) {
                            console.error('Error creating profile:', profileError)
                            // Don't show this error to user as auth was successful
                        } else {
                            console.log('Profile created successfully')
                        }

                        // Assign signup credits via Python API
                        try {
                            console.log('Assigning signup credits...')
                            const creditsResponse = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/user/signup-credits`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    user_id: data.user.id,
                                    email: data.user.email
                                })
                            })

                            if (creditsResponse.ok) {
                                const creditsResult = await creditsResponse.json()
                                console.log('Signup credits assigned:', creditsResult)
                            } else {
                                console.error('Failed to assign signup credits:', await creditsResponse.text())
                            }
                        } catch (creditsErr) {
                            console.error('Credits assignment error:', creditsErr)
                        }
                    } catch (profileErr) {
                        console.error('Profile creation error:', profileErr)
                    }
                }

                setMessage('Check your email for the confirmation link!')
                // Optionally redirect after a delay
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setGoogleLoading(true)
        setError('')
        setMessage('')

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                setError(error.message)
                setGoogleLoading(false)
            }
            // Don't set loading to false here as the page will redirect
        } catch (err) {
            setError('An unexpected error occurred')
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-20 w-64 h-64 bg-orange-100 rounded-full opacity-20"></div>
                <div className="absolute bottom-20 left-20 w-48 h-48 bg-orange-200 rounded-full opacity-30"></div>
            </div>

            <div className="relative z-10 min-h-screen flex">
                {/* Left Side - JPEG Illustration */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
                    <div className="max-w-lg text-center">
                        <img
                            src="/illustrations/login.jpeg"
                            alt="Person working illustration"
                            className="w-full h-auto mb-8 rounded-2xl shadow-lg object-cover max-w-md mx-auto"
                        />
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Start Your Journey!</h3>
                        <p className="text-gray-600 text-lg">Join thousands of job seekers who found their dream jobs with our AI-powered platform.</p>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="max-w-md w-full">
                        {/* Logo */}
                        <div className="text-center mb-8">
                            <Link href="/" className="inline-flex items-center space-x-2">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">H</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">HiremateX</span>
                            </Link>
                        </div>
                       

                        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                                <p className="text-gray-600">Join thousands of job seekers finding their dream jobs</p>
                            </div>

                            {/* OAuth Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignup}
                                    disabled={googleLoading}
                                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {googleLoading ? 'Signing up...' : 'Continue with Google'}
                                </button>
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                                </div>
                            </div>

                            <form className="space-y-6" onSubmit={handleSignup}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="Create a strong password (min 6 characters)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                                )}

                                {message && (
                                    <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{message}</div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Creating account...' : 'Create Account'}
                                    </button>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="text-gray-600">
                                        Already have an account?{' '}
                                        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
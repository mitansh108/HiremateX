'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [magicLinkLoading, setMagicLinkLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const router = useRouter()

    const createUserProfile = async (user: any) => {
        try {
            // Check if profile already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!existingProfile) {
                // Create profile if it doesn't exist
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                } else {
                    console.log('Profile created successfully for user:', user.id);
                }
            }
        } catch (error) {
            console.error('Error in createUserProfile:', error);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        console.log('Attempting login with:', email) // Debug log

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            console.log('Login response:', { data, error }) // Debug log

            if (error) {
                setError(error.message)
                console.error('Login error:', error)
            } else if (data.user) {
                console.log('Login successful, creating profile if needed...')
                await createUserProfile(data.user)
                console.log('Redirecting to home...')
                router.push('/home')
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleMagicLink = async () => {
        if (!email) {
            setError('Please enter your email address first')
            return
        }

        setMagicLinkLoading(true)
        setError('')
        setMessage('')

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                setError(error.message)
            } else {
                setMessage('Check your email for the magic link!')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setMagicLinkLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        setError('')
        setMessage('')

        console.log('Attempting Google login...') // Debug log

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            console.log('Google OAuth response:', { error }) // Debug log

            if (error) {
                setError(error.message)
                console.error('Google OAuth error:', error)
                setGoogleLoading(false)
            }
            // Don't set loading to false here as the page will redirect
        } catch (err) {
            console.error('Google OAuth unexpected error:', err)
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
                {/* Left Side - SVG Illustration */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center p-12">
                    <div className="max-w-lg text-center">
                        <img
                            src="/illustrations/login.jpeg"
                            alt="Person working illustration"
                            className="w-full h-auto mb-8 rounded-2xl shadow-lg object-cover max-w-md mx-auto"
                        />
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back!</h3>
                        <p className="text-gray-600 text-lg">Continue your journey to finding the perfect job with AI-powered tools.</p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
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
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                                <p className="text-gray-600">Sign in to your account to continue</p>
                            </div>

                            {/* OAuth Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={googleLoading}
                                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
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

                            <form className="space-y-6" onSubmit={handleLogin}>
                                <div className="space-y-4">
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
                                            autoComplete="current-password"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                                )}

                                {message && (
                                    <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{message}</div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Signing in...' : 'Sign in with password'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleMagicLink}
                                        disabled={magicLinkLoading || !email}
                                        className="w-full border-2 border-orange-500 text-orange-500 py-3 px-4 rounded-lg hover:bg-orange-50 transition-colors font-medium text-lg disabled:opacity-50"
                                    >
                                        {magicLinkLoading ? 'Sending...' : 'Send magic link'}
                                    </button>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="text-gray-600">
                                        Don't have an account?{' '}
                                        <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                                            Sign up here
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
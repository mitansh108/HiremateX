'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, Edit, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function LinkedInDMPage() {
    const [dmContent, setDmContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Get data from sessionStorage (passed from jobs page)
    useEffect(() => {
        const linkedinData = sessionStorage.getItem('linkedinDMData')

        if (linkedinData) {
            try {
                const { jobData, resumeData, skillMatchData } = JSON.parse(linkedinData)

                // Auto-generate with default prompt
                generateLinkedInDM(jobData, resumeData, skillMatchData)

                // Clear the data after use
                sessionStorage.removeItem('linkedinDMData')
            } catch (error) {
                console.error('Failed to parse LinkedIn DM data:', error)
                setDmContent('Failed to load data. Please try again from the jobs page.')
            }
        } else {
            setDmContent('No data found. Please generate a LinkedIn DM from the jobs page first.')
        }
    }, [])

    const generateLinkedInDM = async (jobData: any, resumeData: any, skillMatchData: any) => {
        setLoading(true)
        try {
            console.log('💼 Generating LinkedIn DM...')

            // Get current user ID
            const { supabase } = await import('@/lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                throw new Error('User not authenticated')
            }

            const response = await fetch('http://localhost:8000/generate-linkedin-dm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    job_data: jobData,
                    resume_data: resumeData,
                    skill_match_data: skillMatchData
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate LinkedIn DM')
            }

            const result = await response.json()

            if (result.success) {
                setDmContent(result.content)
                console.log('✅ LinkedIn DM generated:', result)
            } else {
                throw new Error(result.error || 'Unknown error')
            }

        } catch (error) {
            console.error('❌ LinkedIn DM generation failed:', error)
            setDmContent('Failed to generate LinkedIn DM. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(dmContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleDownload = () => {
        const element = document.createElement('a')
        const file = new Blob([dmContent], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = 'linkedin-dm.txt'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI-Generated LinkedIn DM</h1>
                    <p className="text-gray-600 mt-2">
                        Personalized LinkedIn direct message based on your resume and job requirements
                    </p>
                </div>
                <Link href="/jobs">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Jobs
                    </Button>
                </Link>
            </div>

            {/* Important Notice */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-blue-800 mb-1">
                                💼 LinkedIn DM Ready!
                            </h3>
                            <p className="text-sm text-blue-700">
                                This message is optimized for LinkedIn's character limits and professional tone.
                                <strong> Please review carefully</strong> - personalize further if needed for the specific recipient.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* LinkedIn DM Editor */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                LinkedIn Direct Message
                            </CardTitle>
                            <CardDescription>
                                Review, edit, and personalize your LinkedIn DM before sending
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Preview' : 'Edit'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                disabled={!dmContent}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={!dmContent}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Generating your personalized LinkedIn DM...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isEditing ? (
                                <textarea
                                    value={dmContent}
                                    onChange={(e) => setDmContent(e.target.value)}
                                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                    placeholder="Your LinkedIn DM will appear here..."
                                />
                            ) : (
                                <div className="w-full h-64 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                        {dmContent || 'Your LinkedIn DM will appear here...'}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

        
            </div>
        </DashboardLayout>
    )
}
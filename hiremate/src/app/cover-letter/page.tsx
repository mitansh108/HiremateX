'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

function CoverLetterContent() {
  const [coverLetterContent, setCoverLetterContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const searchParams = useSearchParams()

  // Get data from sessionStorage (passed from jobs page)
  useEffect(() => {
    const coverLetterData = sessionStorage.getItem('coverLetterData')

    if (coverLetterData) {
      try {
        const { jobData, resumeData, skillMatchData } = JSON.parse(coverLetterData)

        // Auto-generate with default prompt
        generateCoverLetter(jobData, resumeData, skillMatchData)

        // Clear the data after use
        sessionStorage.removeItem('coverLetterData')
      } catch (error) {
        console.error('Failed to parse cover letter data:', error)
        setCoverLetterContent('Failed to load data. Please try again from the jobs page.')
      }
    } else {
      setCoverLetterContent('No data found. Please generate a cover letter from the jobs page first.')
    }
  }, [])

  const generateCoverLetter = async (jobData: any, resumeData: any, skillMatchData: any) => {
    setLoading(true)
    try {
      console.log('📄 Generating cover letter...')

      // Get current user ID
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('http://localhost:8000/generate-cover-letter', {
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
        throw new Error('Failed to generate cover letter')
      }

      const result = await response.json()

      if (result.success) {
        setCoverLetterContent(result.content)
        console.log('✅ Cover letter generated:', result)
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('❌ Cover letter generation failed:', error)
      setCoverLetterContent('Failed to generate cover letter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetterContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([coverLetterContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'cover-letter.txt'
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
            <h1 className="text-3xl font-bold">AI-Generated Cover Letter</h1>
            <p className="text-gray-600 mt-2">
              Personalized cover letter based on your resume and job requirements
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
                  🚀 Our AI Team is Working Hard!
                </h3>
                <p className="text-sm text-blue-700">
                  We're generating a highly relevant cover letter using your resume data and job requirements.
                  <strong> Please review carefully</strong> - the AI-generated content might include some mismatches
                  or need adjustments to perfectly fit your style and the specific role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Letter Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  AI-Generated Cover Letter
                </CardTitle>
                <CardDescription>
                  Review, edit, and personalize your cover letter before using
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
                  disabled={!coverLetterContent}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!coverLetterContent}
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
                  <p className="text-gray-600">Generating your personalized cover letter...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isEditing ? (
                  <textarea
                    value={coverLetterContent}
                    onChange={(e) => setCoverLetterContent(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Your cover letter will appear here..."
                  />
                ) : (
                  <div className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {coverLetterContent || 'Your cover letter will appear here...'}
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

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoverLetterContent />
    </Suspense>
  )
}
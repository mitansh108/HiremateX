'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, Edit, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function ColdEmailPage() {
  const [emailContent, setEmailContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Get data from sessionStorage (passed from jobs page)
  useEffect(() => {
    const coldEmailData = sessionStorage.getItem('coldEmailData')
    
    if (coldEmailData) {
      try {
        const { jobData, resumeData, skillMatchData } = JSON.parse(coldEmailData)
        
        // Auto-generate with default prompt
        generateColdEmail(jobData, resumeData, skillMatchData)
        
        // Clear the data after use
        sessionStorage.removeItem('coldEmailData')
      } catch (error) {
        console.error('Failed to parse cold email data:', error)
        setEmailContent('Failed to load data. Please try again from the jobs page.')
      }
    } else {
      setEmailContent('No data found. Please generate a cold email from the jobs page first.')
    }
  }, [])

  const generateColdEmail = async (jobData: any, resumeData: any, skillMatchData: any) => {
    setLoading(true)
    try {
      console.log('🔥 Generating cold email...')
      
      // Get current user ID
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('http://localhost:8000/generate-cold-email', {
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
        throw new Error('Failed to generate cold email')
      }

      const result = await response.json()
      
      if (result.success) {
        setEmailContent(result.content)
        console.log('✅ Cold email generated:', result)
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('❌ Cold email generation failed:', error)
      setEmailContent('Failed to generate cold email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([emailContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'cold-email.txt'
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
          <h1 className="text-3xl font-bold">AI-Generated Cold Email</h1>
          <p className="text-gray-600 mt-2">
            Personalized cold email based on your resume and job requirements
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
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-800 mb-1">
                📧 Cold Email Ready!
              </h3>
              <p className="text-sm text-orange-700">
                This email is crafted to grab attention and showcase your relevant skills. 
                <strong> Please review carefully</strong> - personalize the recipient's name and company details before sending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cold Email Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                AI-Generated Cold Email
              </CardTitle>
              <CardDescription>
                Review, edit, and personalize your cold email before sending
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
                disabled={!emailContent}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!emailContent}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your personalized cold email...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder="Your cold email will appear here..."
                />
              ) : (
                <div className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {emailContent || 'Your cold email will appear here...'}
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
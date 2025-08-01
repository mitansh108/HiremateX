'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, Edit, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function LinkedInConnectionPage() {
  const [connectionNote, setConnectionNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [charCount, setCharCount] = useState(0)

  // Get data from sessionStorage (passed from jobs page)
  useEffect(() => {
    const connectionData = sessionStorage.getItem('linkedinConnectionData')
    
    if (connectionData) {
      try {
        const { jobData, resumeData, skillMatchData } = JSON.parse(connectionData)
        
        // Auto-generate with default prompt
        generateConnectionNote(jobData, resumeData, skillMatchData)
        
        // Clear the data after use
        sessionStorage.removeItem('linkedinConnectionData')
      } catch (error) {
        console.error('Failed to parse LinkedIn connection data:', error)
        setConnectionNote('Failed to load data. Please try again from the jobs page.')
      }
    } else {
      setConnectionNote('No data found. Please generate a LinkedIn connection note from the jobs page first.')
    }
  }, [])

  // Update character count when content changes
  useEffect(() => {
    setCharCount(connectionNote.length)
  }, [connectionNote])

  const generateConnectionNote = async (jobData: any, resumeData: any, skillMatchData: any) => {
    setLoading(true)
    try {
      console.log('🤝 Generating LinkedIn connection note...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'}/generate-linkedin-connection-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_data: jobData,
          resume_data: resumeData,
          skill_match_data: skillMatchData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate LinkedIn connection note')
      }

      const result = await response.json()
      
      if (result.success) {
        setConnectionNote(result.content)
        console.log('✅ LinkedIn connection note generated:', result)
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('❌ LinkedIn connection note generation failed:', error)
      setConnectionNote('Failed to generate LinkedIn connection note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(connectionNote)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([connectionNote], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'linkedin-connection-note.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= 200) { // LinkedIn's character limit
      setConnectionNote(text)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Generated LinkedIn Connection Note</h1>
          <p className="text-gray-600 mt-2">
            Personalized connection request based on your resume and job requirements
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
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                📝 LinkedIn Character Limit: 200 characters
              </h3>
              <p className="text-sm text-amber-700">
                LinkedIn connection requests are limited to 200 characters. 
                <strong> Keep it concise and impactful!</strong> The AI has optimized this message for maximum impact within the limit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Note Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                LinkedIn Connection Request
              </CardTitle>
              <CardDescription>
                Review and personalize your connection note before sending
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
                disabled={!connectionNote}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!connectionNote}
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
                <p className="text-gray-600">Generating your personalized connection note...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={connectionNote}
                    onChange={handleTextChange}
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Your LinkedIn connection note will appear here..."
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      LinkedIn connection request note
                    </span>
                    <span className={`font-medium ${charCount > 180 ? 'text-red-600' : charCount > 150 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {charCount}/200 characters
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full min-h-32 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {connectionNote || 'Your LinkedIn connection note will appear here...'}
                    </pre>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      Preview of your connection request
                    </span>
                    <span className={`font-medium ${charCount > 180 ? 'text-red-600' : charCount > 150 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {charCount}/200 characters
                    </span>
                  </div>
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
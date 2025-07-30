'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Search, Building, User } from 'lucide-react'
import { makeAuthenticatedRequest } from '@/lib/api-client'

interface RecruiterEmail {
  email: string
  firstName?: string
  lastName?: string
  position?: string
  department?: string
  confidence: 'high' | 'medium' | 'low'
}

interface CompanyInfo {
  name: string
  domain: string
  website: string
}

export default function EmailPage() {
  const [jobUrl, setJobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [recruiterEmails, setRecruiterEmails] = useState<RecruiterEmail[]>([])
  const [error, setError] = useState('')

  const handleFindRecruiters = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a job URL')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Extract job data (which includes company info) using existing API
      const jobResponse = await makeAuthenticatedRequest('/api/extract-job', {
        method: 'POST',
        body: JSON.stringify({ url: jobUrl })
      })

      if (!jobResponse.ok) {
        throw new Error('Failed to extract job information')
      }

      const jobData = await jobResponse.json()
      
      if (jobData.error === 'scraping_blocked') {
        setError(jobData.message)
        return
      }

      // Extract domain from job URL for Hunter.io
      const url = new URL(jobUrl)
      let domain = url.hostname.replace(/^(www\.|jobs\.|careers\.|apply\.)/, '')
      
      // Handle special cases like amazon.jobs -> amazon.com
      if (domain.endsWith('.jobs')) {
        domain = domain.replace('.jobs', '.com')
      }
      if (domain.endsWith('.careers')) {
        domain = domain.replace('.careers', '.com')
      }

      // Set company info from job data
      setCompanyInfo({
        name: jobData.company || domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        domain: domain,
        website: `https://${domain}`
      })

      // Find recruiter emails using Hunter.io
      const emailResponse = await fetch('/api/find-recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain })
      })

      if (!emailResponse.ok) {
        throw new Error('Failed to find recruiter emails')
      }

      const emails = await emailResponse.json()
      setRecruiterEmails(emails)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSendColdEmail = (recruiterEmail: RecruiterEmail) => {
    // TODO: Implement cold email generation and sending
    console.log('Sending cold email to:', recruiterEmail.email)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Find Recruiters & Send Cold Emails</h1>
        <p className="text-gray-600">
          Extract company information from job URLs and find recruiter contacts
        </p>
      </div>

      {/* Job URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Recruiters
          </CardTitle>
          <CardDescription>
            Enter a job posting URL to find recruiter contacts at the company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://jobs.company.com/software-engineer"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleFindRecruiters}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find Recruiters'}
            </Button>
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>

      {/* Company Information */}
      {companyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="font-medium">{companyInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Domain</label>
                <p className="font-medium">{companyInfo.domain}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <a 
                  href={companyInfo.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {companyInfo.website}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recruiter Emails */}
      {recruiterEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Recruiter Contacts ({recruiterEmails.length})
            </CardTitle>
            <CardDescription>
              Found potential recruiter and HR contacts at {companyInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recruiterEmails.map((recruiter, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{recruiter.email}</span>
                      <Badge className={getConfidenceColor(recruiter.confidence)}>
                        {recruiter.confidence} confidence
                      </Badge>
                    </div>
                    {(recruiter.firstName || recruiter.lastName) && (
                      <p className="text-sm text-gray-600">
                        {recruiter.firstName} {recruiter.lastName}
                      </p>
                    )}
                    {recruiter.position && (
                      <p className="text-sm text-gray-600">{recruiter.position}</p>
                    )}
                    {recruiter.department && (
                      <p className="text-xs text-gray-500">{recruiter.department}</p>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleSendColdEmail(recruiter)}
                    className="ml-4"
                  >
                    Send Cold Email
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && recruiterEmails.length === 0 && companyInfo && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recruiters found</h3>
            <p className="text-gray-600">
              We couldn't find any recruiter contacts for {companyInfo.name}. 
              Try searching for a different company or check if the job URL is correct.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
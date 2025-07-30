'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import ResumePreview from '@/components/ResumePreview'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import AuthWrapper from '@/components/AuthWrapper'
import { makeAuthenticatedRequest } from '@/lib/api-client'

interface UploadedResume {
  id: string
  filePath: string
  fileName: string
  uploadedAt: Date
}

interface JobData {
  role: string
  skills: string[]
  company?: string
  location?: string
  description?: string
  responsibilities?: string
  qualifications?: string
  preferredQualifications?: string
  education?: string
  experience?: string
  benefits?: string
  salary?: string
}

export default function JobsPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualJobText, setManualJobText] = useState('')
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [currentResume, setCurrentResume] = useState<UploadedResume | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
  const [analyzingResume, setAnalyzingResume] = useState(false)
  const [matchingResults, setMatchingResults] = useState<any>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [showApplicationPopup, setShowApplicationPopup] = useState(false)
  const [savingApplication, setSavingApplication] = useState(false)

  useEffect(() => {
    loadExistingResume()
    loadJobDataFromSession()
  }, [])

  // Removed automatic job match analysis to save credits

  // Show application popup 5 seconds after skill matching is completed
  useEffect(() => {
    if (matchingResults && jobData && resumeAnalysis) {
      const timer = setTimeout(() => {
        setShowApplicationPopup(true)
      }, 45000)

      return () => clearTimeout(timer)
    }
  }, [matchingResults, jobData, resumeAnalysis])

  const loadJobDataFromSession = () => {
    const savedJobData = sessionStorage.getItem('currentJobData')
    if (savedJobData) {
      try {
        const jobData = JSON.parse(savedJobData)
        setJobData(jobData)
        setMatchingResults(null)
      } catch (error) {
        console.error('Failed to parse saved job data:', error)
      }
    }
  }

  const loadExistingResume = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error || !resumes?.length) return

      const resume = resumes[0]
      setCurrentResume({
        id: resume.id,
        filePath: resume.file_path,
        fileName: resume.filename,
        uploadedAt: new Date(resume.created_at)
      })
    } catch (err) {
      console.error('Error loading existing resume:', err)
    }
  }

  const handleSkillsMatching = async () => {
    if (!currentResume || !jobData) return

    setIsMatching(true)
    try {
      let resumeData = resumeAnalysis
      if (!resumeData) {
        setAnalyzingResume(true)
        const { supabase } = await import('@/lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Please sign in to access resume data')

        const response = await fetch('http://localhost:8000/get-parsed-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        })

        if (!response.ok) throw new Error('Failed to get parsed resume data')
        const result = await response.json()
        if (!result.success || !result.data) throw new Error('No parsed resume found')

        resumeData = {
          name: result.data.personal?.name || 'Unknown',
          email: result.data.personal?.email || '',
          phone: result.data.personal?.phone || '',
          location: result.data.personal?.location || '',
          skills: result.data.skills?.map((skill: string) => ({ name: skill })) || [],
          experience: result.data.experience || [],
          projects: result.data.projects || [],
          education: result.data.education || [],
          parsing_confidence: result.data.parsing_confidence || 0.9
        }

        setResumeAnalysis(resumeData)
        setAnalyzingResume(false)
      }

      const jobSkills = jobData.skills || []
      const resumeSkills = resumeData.skills?.map((s: any) => s.name) || []

      // Get current user for credit deduction
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User authentication required for skill analysis')

      const skillMatchResponse = await fetch('http://localhost:8000/skill-match-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          job_skills: jobSkills,
          resume_skills: resumeSkills
        })
      })

      if (!skillMatchResponse.ok) {
        if (skillMatchResponse.status === 402) {
          alert('💳 Insufficient credits! You need credits to perform skill matching analysis. Please wait for your credits to refresh or consider upgrading your plan.')
          return
        }
        throw new Error('Skill matching failed')
      }
      const skillMatchResult = await skillMatchResponse.json()

      setMatchingResults({
        timestamp: new Date().toISOString(),
        jobTitle: jobData.role,
        company: jobData.company,
        resumeData,
        jobData,
        skillMatchResult,
        calculated: true
      })
    } catch (err) {
      console.error('Skills matching failed:', err)
      setAnalyzingResume(false)
    } finally {
      setIsMatching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const response = await makeAuthenticatedRequest('/api/extract-job', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      })

      let result;
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        if (response.status === 402 || result.error === 'insufficient_credits') {
          alert('💳 Insufficient credits! You need credits to extract job data. Please wait for your credits to refresh or consider upgrading your plan.')
          return
        }
        throw new Error(result.message || 'Failed to extract job data')
      }

      if (result.error === 'scraping_blocked') {
        setShowManualInput(true)
        alert(result.message + ' Please use the manual input option below.')
        return
      }

      setJobData(result)
      sessionStorage.setItem('currentJobData', JSON.stringify(result))
      setMatchingResults(null) // Reset matching results for new job

    } catch (error) {
      console.error('Job extraction failed:', error)
      alert('Failed to extract job data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!manualJobText.trim()) return

    setLoading(true)
    try {
      const response = await makeAuthenticatedRequest('/api/extract-job', {
        method: 'POST',
        body: JSON.stringify({ manualText: manualJobText.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract job data')
      }

      const result = await response.json()
      setJobData(result)
      sessionStorage.setItem('currentJobData', JSON.stringify(result))
      setMatchingResults(null) // Reset matching results for new job
      setShowManualInput(false) // Hide manual input after success

    } catch (error) {
      console.error('Manual job extraction failed:', error)
      alert('Failed to extract job data from text. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const navigateWithData = (path: string, dataKey: string) => {
    if (!matchingResults || !jobData || !resumeAnalysis) {
      alert('Please ensure job analysis and resume matching are complete')
      return
    }

    const data = {
      jobData,
      resumeData: resumeAnalysis,
      skillMatchData: matchingResults.skillMatchResult
    }

    sessionStorage.setItem(dataKey, JSON.stringify(data))
    router.push(path)
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadingResume(true)

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to upload a resume')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: filePath
        })
        .select()
        .single()

      if (dbError) throw dbError

      setCurrentResume({
        id: resumeData.id,
        filePath: resumeData.file_path,
        fileName: resumeData.filename,
        uploadedAt: new Date(resumeData.created_at)
      })

      setResumeAnalysis(null)
      setMatchingResults(null)
      setUploadingResume(false)
      setAnalyzingResume(true)

      await triggerComprehensiveParsing(resumeData.id, file)
    } catch (error) {
      console.error('Resume upload failed:', error)
      alert('Failed to upload resume. Please try again.')
    } finally {
      setUploadingResume(false)
    }
  }

  const triggerComprehensiveParsing = async (resumeId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const textResponse = await fetch('/api/extract-pdf-text', {
        method: 'POST',
        body: formData
      })

      if (!textResponse.ok) throw new Error('Failed to extract text from PDF')
      const { text } = await textResponse.json()

      const parseResponse = await fetch('http://localhost:8000/parse-resume-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId, raw_text: text })
      })

      if (!parseResponse.ok) throw new Error('Failed to parse resume comprehensively')
      const result = await parseResponse.json()

      if (result.success) {
        const formattedData = {
          name: result.data.personal?.name || 'Unknown',
          email: result.data.personal?.email || '',
          phone: result.data.personal?.phone || '',
          location: result.data.personal?.location || '',
          skills: result.data.skills?.map((skill: string) => ({ name: skill })) || [],
          experience: result.data.experience || [],
          projects: result.data.projects || [],
          education: result.data.education || [],
          parsing_confidence: result.data.parsing_confidence || 0.9
        }

        setResumeAnalysis(formattedData)
      } else {
        throw new Error(result.error || 'Parsing failed')
      }
    } catch (error) {
      console.error('Comprehensive parsing failed:', error)
      alert('Resume parsing failed. Please try uploading again.')
    } finally {
      setAnalyzingResume(false)
    }
  }

  const saveJobApplication = async () => {
    if (!jobData || !resumeAnalysis) return

    setSavingApplication(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Please sign in to save job applications')
        return
      }



      const applicationData = {
        user_id: user.id,
        url: url || null,
        title: jobData.role,
        company: jobData.company || 'Unknown Company',
        raw_data: {
          status: 'applied'
        }
      }

      const { error } = await supabase
        .from('jobs')
        .insert(applicationData)

      if (error) {
        console.error('Error saving job application:', error)
        alert('Failed to save job application. Please try again.')
        return
      }


      setShowApplicationPopup(false)
    } catch (error) {
      console.error('Error saving job application:', error)
      alert('Failed to save job application. Please try again.')
    } finally {
      setSavingApplication(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Job Analysis & Resume Matching
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Extract job requirements and see how they match with your resume
            </p>
            <Link href="/" className="text-orange-600 hover:text-orange-500 font-medium">
              ← Back to Dashboard
            </Link>

          </div>

          {/* Job URL Input Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Extract Job Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste job posting URL here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                >
                  {loading ? 'Extracting...' : 'Extract Job'}
                </button>
              </div>
            </form>

            {/* Loading Bar */}
            {loading && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-orange-600 font-medium">Extracting job details...</span>
                  <span className="text-orange-600 font-medium">Processing</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            )}

            {/* Manual Input Option */}
            {showManualInput && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Manual Job Description Input</h3>
                  <p className="text-sm text-gray-600">
                    Some job sites block automated scraping. Please copy and paste the job description below:
                  </p>
                </div>
                <form onSubmit={handleManualSubmit}>
                  <div className="space-y-4">
                    <textarea
                      value={manualJobText}
                      onChange={(e) => setManualJobText(e.target.value)}
                      placeholder="Paste the complete job description here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={8}
                      disabled={loading}
                      required
                    />
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={loading || !manualJobText.trim()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Processing...' : 'Extract from Text'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualInput(false)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Manual Input Toggle Button */}
            {!showManualInput && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-orange-600 hover:text-orange-500 text-sm font-medium"
                >
                  Can't extract from URL? Try manual input instead
                </button>
              </div>
            )}
          </div>

          {/* Job Overview + Skills Analysis */}
          {jobData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Job Basic Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{jobData.role}</h2>
                    <div className="space-y-2">
                      {jobData.company && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 4h1m4 0h1M9 16h1" />
                          </svg>
                          {jobData.company}
                        </div>
                      )}
                      {jobData.location && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {jobData.location}
                        </div>
                      )}
                      {jobData.experience && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {jobData.experience}
                        </div>
                      )}
                      {jobData.salary && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {jobData.salary}
                        </div>
                      )}
                    </div>

                    {/* Status indicators */}
                    {analyzingResume && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-600">🤖 AI parsing your resume...</span>
                          <span className="text-purple-600 font-medium">Processing</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full transition-all duration-1000 ease-out animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    )}

                    {currentResume && isMatching && !analyzingResume && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-orange-600">Analyzing skill match...</span>
                          <span className="text-orange-600 font-medium">75%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full transition-all duration-500 ease-out animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Match Analytics */}
                <div className="flex items-center justify-center">
                  {matchingResults ? (
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4">
                        <CircularProgressbar
                          value={matchingResults.skillMatchResult?.match_percentage || 0}
                          text={`${matchingResults.skillMatchResult?.match_percentage || 0}%`}
                          styles={buildStyles({
                            textSize: '16px',
                            pathColor: matchingResults.skillMatchResult?.match_percentage >= 60 ? '#10B981' :
                              matchingResults.skillMatchResult?.match_percentage >= 30 ? '#F59E0B' : '#EF4444',
                            textColor: '#1F2937',
                            trailColor: '#F3F4F6',
                            pathTransitionDuration: 1.5,
                          })}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Skill Match Analysis</h3>
                      <p className="text-sm text-gray-600">
                        {matchingResults.skillMatchResult?.match_level || 'Technical skills compatibility'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Analysis</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {currentResume ? 'Ready for skill matching analysis' : 'Upload resume to see skill matching'}
                      </p>
                      {currentResume && (
                        <button
                          onClick={handleSkillsMatching}
                          disabled={isMatching || !currentResume}
                          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isMatching ? 'Analyzing...' : 'Job Match Analysis'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Comparison Section */}
              {matchingResults && resumeAnalysis && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Skills Analysis</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Matched Skills */}
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Matched Skills ({matchingResults.skillMatchResult?.matched_skills?.length || 0})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {matchingResults.skillMatchResult?.matched_skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {matchingResults.skillMatchResult.matched_skills.map((match: any, index: number) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {match.job_skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No matching skills found</p>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Skills to Add ({matchingResults.skillMatchResult?.missing_skills?.length || 0})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {matchingResults.skillMatchResult?.missing_skills?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {matchingResults.skillMatchResult.missing_skills.map((skill: string, index: number) => (
                              <div key={index} className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm border border-red-200">
                                <div className="font-medium">{skill}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">All required skills are present!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {matchingResults.skillMatchResult?.summary?.total_job_skills || 0}
                        </div>
                        <div className="text-sm text-orange-700">Job Skills</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {matchingResults.skillMatchResult?.summary?.matched_count || 0}
                        </div>
                        <div className="text-sm text-green-700">Matched</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {matchingResults.skillMatchResult?.summary?.missing_count || 0}
                        </div>
                        <div className="text-sm text-red-700">Missing</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {matchingResults.skillMatchResult?.match_percentage || 0}%
                        </div>
                        <div className="text-sm text-purple-700">Match Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {jobData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Content</h2>
              {!matchingResults && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 Complete the skill matching analysis above to unlock personalized content generation
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigateWithData('/cover-letter', 'coverLetterData')}
                  disabled={!matchingResults}
                  className={`p-4 border border-gray-200 rounded-lg text-left transition-all ${
                    matchingResults 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Cover Letter</h3>
                  <p className="text-sm text-gray-600 mt-1">Generate tailored cover letter</p>
                </button>

                <button
                  onClick={() => navigateWithData('/cold-email', 'coldEmailData')}
                  disabled={!matchingResults}
                  className={`p-4 border border-gray-200 rounded-lg text-left transition-all ${
                    matchingResults 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Cold Email</h3>
                  <p className="text-sm text-gray-600 mt-1">Reach out to recruiters</p>
                </button>

                <button
                  onClick={() => navigateWithData('/linkedin-dm', 'linkedinDMData')}
                  disabled={!matchingResults}
                  className={`p-4 border border-gray-200 rounded-lg text-left transition-all ${
                    matchingResults 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">LinkedIn DM</h3>
                  <p className="text-sm text-gray-600 mt-1">Direct message template</p>
                </button>

                <button
                  onClick={() => navigateWithData('/linkedin-connection', 'linkedinConnectionData')}
                  disabled={!matchingResults}
                  className={`p-4 border border-gray-200 rounded-lg text-left transition-all ${
                    matchingResults 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">LinkedIn Connect</h3>
                  <p className="text-sm text-gray-600 mt-1">Connection request message</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Details & Resume Preview Section */}
        {jobData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Analysis & Resume Preview</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Job Details */}


              <div className="space-y-1">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                  <div className="space-y-4">
                    {jobData.description && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobData.description}</p>
                      </div>
                    )}

                    {jobData.responsibilities && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Key Responsibilities</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobData.responsibilities}</p>
                      </div>
                    )}

                    {jobData.qualifications && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Required Qualifications</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobData.qualifications}</p>
                      </div>
                    )}

                    {jobData.preferredQualifications && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Preferred Qualifications</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobData.preferredQualifications}</p>
                      </div>
                    )}

                    {jobData.skills && jobData.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Required Skills ({jobData.skills.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {jobData.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {jobData.education && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Education Requirements</h4>
                        <p className="text-sm text-gray-600">{jobData.education}</p>
                      </div>
                    )}

                    {jobData.benefits && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Benefits & Perks</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{jobData.benefits}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side - Resume Preview */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload-preview"
                    />
                    <label
                      htmlFor="resume-upload-preview"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm"
                    >
                      {uploadingResume ? 'Uploading...' : currentResume ? 'Replace Resume' : 'Upload Resume'}
                    </label>
                  </div>
                </div>

                {currentResume ? (
                  <div>
                    <ResumePreview filePath={currentResume.filePath} />

                    {analyzingResume && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-blue-700">Analyzing resume content...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Resume Uploaded</h4>
                    <p className="text-gray-600 mb-4">Upload your resume to see detailed analysis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}




        {/* Job Application Popup */}
        {showApplicationPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Did you apply to this job?
                </h3>

                <p className="text-gray-600 mb-2">
                  <strong>{jobData?.role}</strong> at <strong>{jobData?.company}</strong>
                </p>

                <p className="text-sm text-gray-500 mb-6">
                  Track your application progress and manage your job search
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={saveJobApplication}
                    disabled={savingApplication}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {savingApplication ? 'Saving...' : 'Yes, I Applied'}
                  </button>

                  <button
                    onClick={() => setShowApplicationPopup(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Not Yet
                  </button>
                </div>

                <div className="mt-4">
                  <Link
                    href="/tracking"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={() => setShowApplicationPopup(false)}
                  >
                    View All Applications →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
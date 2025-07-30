'use client'

import { useState, useEffect } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

interface MatchingAnalyticsProps {
  resumeData: any
  jobData: any
}

interface SkillMatchResult {
  success: boolean
  match_percentage: number
  match_level: string
  matched_skills: Array<{
    job_skill: string
    resume_skill: string
    match_type: string
  }>
  missing_skills: string[]
  bonus_skills: string[]
  summary: {
    total_job_skills: number
    total_resume_skills: number
    matched_count: number
    missing_count: number
    bonus_count: number
  }
}

export default function MatchingAnalytics({ resumeData, jobData }: MatchingAnalyticsProps) {
  const [skillMatchResult, setSkillMatchResult] = useState<SkillMatchResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Perform skill matching analysis
  const performSkillAnalysis = async () => {
    if (!resumeData || !jobData) return

    setIsAnalyzing(true)
    try {
      console.log('🎯 Starting skill match analysis...')
      
      // Extract skills from both sources
      const jobSkills = jobData.skills || []
      const resumeSkills = resumeData.skills?.map((s: any) => s.name) || []
      
      console.log('Job Skills:', jobSkills)
      console.log('Resume Skills:', resumeSkills)

      const response = await fetch('http://localhost:8000/skill-match-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_skills: jobSkills,
          resume_skills: resumeSkills
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Skill match analysis completed:', result)
      setSkillMatchResult(result)

    } catch (error) {
      console.error('❌ Skill match analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-analyze when data is available
  useEffect(() => {
    if (resumeData && jobData && !skillMatchResult && !isAnalyzing) {
      performSkillAnalysis()
    }
  }, [resumeData, jobData])

  const getMatchColor = (score: number): string => {
    if (score >= 80) return '#10B981' // Green
    if (score >= 70) return '#06B6D4' // Cyan
    if (score >= 60) return '#F59E0B' // Yellow
    return '#EF4444' // Red
  }

  const getMatchLabel = (score: number): string => {
    if (score >= 80) return 'EXCELLENT MATCH'
    if (score >= 70) return 'GOOD MATCH'
    if (score >= 60) return 'FAIR MATCH'
    return 'POOR MATCH'
  }

  if (!resumeData || !jobData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
        <p className="text-gray-600">
          Upload resume and extract job to see skill matching
        </p>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Skills...</h3>
        <p className="text-gray-600">
          Comparing your skills with job requirements
        </p>
      </div>
    )
  }

  if (!skillMatchResult) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <button 
            onClick={performSkillAnalysis}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Analyze Skill Match
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
        Skill Match Analysis
      </h3>

      {/* Overall Match Score */}
      <div className="text-center mb-8">
        <div className="w-32 h-32 mx-auto mb-4">
          <CircularProgressbar
            value={skillMatchResult.match_percentage}
            text={`${skillMatchResult.match_percentage}%`}
            styles={buildStyles({
              textSize: '16px',
              pathColor: getMatchColor(skillMatchResult.match_percentage),
              textColor: '#1F2937',
              trailColor: '#F3F4F6',
              pathTransitionDuration: 1.5,
            })}
          />
        </div>
        <h4 className="text-xl font-bold text-gray-900 mb-2">
          {skillMatchResult.match_level.toUpperCase()}
        </h4>
        <p className="text-sm text-gray-600">
          Technical skills compatibility
        </p>
      </div>

      {/* Skills Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{skillMatchResult.summary.matched_count}</div>
          <div className="text-sm text-green-700">Matched Skills</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{skillMatchResult.summary.missing_count}</div>
          <div className="text-sm text-red-700">Skills to Add</div>
        </div>
      </div>

      {/* Matched Skills */}
      {skillMatchResult.matched_skills.length > 0 && (
        <div className="mb-6">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Matched Skills ({skillMatchResult.matched_skills.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {skillMatchResult.matched_skills.map((match, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {match.job_skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {skillMatchResult.missing_skills.length > 0 && (
        <div className="mb-6">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Skills to Add on Resume ({skillMatchResult.missing_skills.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {skillMatchResult.missing_skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}



      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
        <button 
          onClick={performSkillAnalysis}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Re-analyze Skills
        </button>
        <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
          Improve Skills
        </button>
      </div>
    </div>
  )
}
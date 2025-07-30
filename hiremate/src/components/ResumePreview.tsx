'use client'

import { useState, useEffect } from 'react'

interface ResumePreviewProps {
  filePath: string
}

export default function ResumePreview({ filePath }: ResumePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    generatePdfUrl()
  }, [filePath])

  const generatePdfUrl = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/resume-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF URL')
      }

      const result = await response.json()
      setPdfUrl(result.url)
    } catch (err) {
      console.error('Error generating PDF URL:', err)
      setError('Failed to load resume preview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-gray-600 mb-2">{error}</p>
          <button
            onClick={generatePdfUrl}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No preview available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* PDF Embed */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-[800px]"
          title="Resume Preview"
          style={{
            border: 'none',
            display: 'block'
          }}
        />
      </div>
      
      {/* Fallback message for mobile or unsupported browsers */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Can't see the preview?</strong> Some browsers may not display PDFs inline. 
          <button
            onClick={() => window.open(pdfUrl, '_blank')}
            className="ml-1 text-blue-600 hover:text-blue-500 underline"
          >
            Click here to open in a new tab
          </button>
        </p>
      </div>
    </div>
  )
}
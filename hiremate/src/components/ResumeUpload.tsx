'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ResumeUploadProps {
  onUploadSuccess?: (filePath: string, fileName: string, processResult?: any) => void
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file only'
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB'
    }
    
    return null
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(0)

    try {
      // Get authenticated user (we'll add auth next)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign in to upload your resume')
      }
      
      const userId = user.id
      
      // Create file path: userId/timestamp-filename
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const filePath = `${userId}/${fileName}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Save resume record to database
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          filename: file.name,
          file_path: filePath,
          parsed_data: null // Will be populated by N8N workflow later
        })

      if (dbError) {
        throw dbError
      }

      setSuccess(`✅ ${file.name} uploaded successfully! Processing...`)
      setUploadProgress(75)
      
      // Send file to processing API
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)
        formData.append('filename', file.name)
        
        const processResponse = await fetch('/api/process-resume', {
          method: 'POST',
          body: formData
        })

        if (!processResponse.ok) {
          throw new Error('Failed to process resume')
        }

        const processResult = await processResponse.json()
        
        setSuccess(`✅ Resume processed! Found ${processResult.matches?.length || 0} job matches`)
        setUploadProgress(100)
        
        // Call success callback with processing results
        if (onUploadSuccess) {
          onUploadSuccess(filePath, file.name, processResult)
        }
        
      } catch (processError) {
        console.error('Processing error:', processError)
        setSuccess(`✅ ${file.name} uploaded successfully! (Processing will continue in background)`)
        setUploadProgress(100)
        
        // Still call success callback for upload
        if (onUploadSuccess) {
          onUploadSuccess(filePath, file.name)
        }
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    uploadFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Uploading resume...</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your resume here
              </p>
              <p className="text-sm text-gray-500">
                or{' '}
                <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                  browse files
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={isUploading}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PDF files only, max 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}
    </div>
  )
}
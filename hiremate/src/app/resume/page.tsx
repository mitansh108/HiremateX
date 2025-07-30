'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

interface UploadedResume {
    id: string
    filePath: string
    fileName: string
    uploadedAt: Date
}

export default function ResumePage() {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentResume, setCurrentResume] = useState<UploadedResume | null>(null)

    // Load existing resume
    useEffect(() => {
        loadExistingResume()
    }, [])

    const loadExistingResume = async () => {
        try {
            const { supabase } = await import('@/lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: resumes } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (resumes && resumes.length > 0) {
                const resume = resumes[0]
                setCurrentResume({
                    id: resume.id,
                    filePath: resume.file_path,
                    fileName: resume.filename,
                    uploadedAt: new Date(resume.created_at)
                })
            }
        } catch (err) {
            console.error('Error loading resume:', err)
        }
    }

    const uploadFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file only')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }

        setIsUploading(true)
        setError('')
        setSuccess('')
        setUploadProgress(0)

        try {
            const { supabase } = await import('@/lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Please sign in to upload your resume')
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', user.id)
            formData.append('filename', file.name)

            setUploadProgress(50)

            const response = await fetch('/api/process-resume', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const result = await response.json()
            
            // Handle parsing status
            if (result.parsing?.success) {
                setSuccess(`✅ ${file.name} uploaded and parsed successfully!`)
            } else if (result.parsing?.error) {
                setSuccess(`✅ ${file.name} uploaded successfully!`)
                setError(`⚠️ Parsing failed: ${result.parsing.error}. You can still use the resume for job matching.`)
            } else {
                setSuccess(`✅ ${file.name} uploaded successfully!`)
            }
            
            setUploadProgress(100)

            if (result.resume) {
                setCurrentResume({
                    id: result.resume.id,
                    filePath: result.resume.filePath,
                    fileName: result.resume.filename,
                    uploadedAt: new Date(result.resume.uploadedAt)
                })
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return
        uploadFile(files[0])
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
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Upload Your Resume
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Upload your resume for AI-powered job matching
                        </p>
                        <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {isUploading ? (
                                <div className="space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600">Uploading and parsing resume...</p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div>
                                        <p className="text-lg font-medium text-gray-900">Drop your resume here</p>
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
                                        <p className="text-xs text-gray-400 mt-2">PDF files only, max 10MB</p>
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

                    {/* Current Resume */}
                    {currentResume && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{currentResume.fileName}</h2>
                                        <p className="text-sm text-gray-500">
                                            Uploaded {currentResume.uploadedAt.toLocaleDateString()}
                                        </p>
                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                                            ✅ Ready for Job Matching
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href="/jobs"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Start Job Matching →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
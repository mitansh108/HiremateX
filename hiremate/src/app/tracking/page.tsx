'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

interface JobApplication {
    id: string
    user_id: string
    url?: string
    title: string
    company: string
    raw_data: {
        status?: string
        notes?: string
    }
    created_at: string
}

const statusColumns = [
    { 
        id: 'applied', 
        title: 'Applied', 
        count: 0
    },
    { 
        id: 'interviewing', 
        title: 'Interviewing', 
        count: 0
    },
    { 
        id: 'offer', 
        title: 'Offers', 
        count: 0
    },
    { 
        id: 'rejected', 
        title: 'Rejected', 
        count: 0
    },
    { 
        id: 'withdrawn', 
        title: 'Withdrawn', 
        count: 0
    }
]

export default function TrackingPage() {
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editStatus, setEditStatus] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        loadApplications()
    }, [])

    const loadApplications = async () => {
        try {
            const { supabase } = await import('@/lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: jobs, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error loading applications:', error)
                return
            }

            setApplications(jobs || [])
        } catch (error) {
            console.error('Error loading applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
        try {
            const { supabase } = await import('@/lib/supabase')

            // Get current raw_data and update it
            const currentApp = applications.find(app => app.id === id)
            const updatedRawData = {
                ...currentApp?.raw_data,
                status,
                notes: notes || null
            }

            const { error } = await supabase
                .from('jobs')
                .update({
                    raw_data: updatedRawData
                })
                .eq('id', id)

            if (error) {
                console.error('Error updating application:', error)
                alert('Failed to update application status')
                return
            }

            // Update local state
            setApplications(prev => prev.map(app =>
                app.id === id
                    ? { ...app, raw_data: { ...app.raw_data, status, notes: notes || app.raw_data?.notes } }
                    : app
            ))

            setEditingId(null)
            setEditStatus('')
            setEditNotes('')
        } catch (error) {
            console.error('Error updating application:', error)
            alert('Failed to update application status')
        }
    }

    const deleteApplication = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job application?')) {
            return
        }

        try {
            const { supabase } = await import('@/lib/supabase')

            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error deleting application:', error)
                alert('Failed to delete application')
                return
            }

            setApplications(prev => prev.filter(app => app.id !== id))
        } catch (error) {
            console.error('Error deleting application:', error)
            alert('Failed to delete application')
        }
    }

    const startEditing = (app: JobApplication) => {
        setEditingId(app.id)
        setEditStatus(app.raw_data?.status || 'applied')
        setEditNotes(app.raw_data?.notes || '')
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditStatus('')
        setEditNotes('')
    }

    // Group applications by status
    const getApplicationsByStatus = () => {
        const grouped = statusColumns.reduce((acc, column) => {
            acc[column.id] = applications.filter(app => 
                (app.raw_data?.status || 'applied') === column.id
            )
            return acc
        }, {} as Record<string, JobApplication[]>)
        
        return grouped
    }

    const applicationsByStatus = getApplicationsByStatus()
    
    const getStatusStats = () => {
        return statusColumns.map(column => ({
            ...column,
            count: applicationsByStatus[column.id]?.length || 0
        }))
    }

    const stats = getStatusStats()
    const totalApplications = applications.length

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-gray-50 py-8 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Job Application Tracking
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Track and manage all your job applications in one place
                        </p>
                        <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center divide-x divide-gray-200">
                                <div className="text-center pr-6">
                                    <div className="text-2xl font-bold text-gray-900">{totalApplications}</div>
                                    <div className="text-sm text-gray-600">Total Applications</div>
                                </div>
                                {stats.map((stat) => (
                                    <div key={stat.id} className="text-center px-6">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {stat.count}
                                        </div>
                                        <div className="text-sm text-gray-600">{stat.title}</div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/jobs"
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                            >
                                + Add New Application
                            </Link>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    {totalApplications === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
                            <p className="text-gray-600 mb-6">
                                Start applying to jobs and track your progress here!
                            </p>
                            <Link
                                href="/jobs"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Find Jobs to Apply
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-x divide-gray-200 min-h-[600px]">
                                {stats.map((column) => (
                                    <div key={column.id} className="flex flex-col">
                                        {/* Column Header */}
                                        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                                <span className="text-sm font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                                                    {column.count}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Column Content */}
                                        <div className="p-4 space-y-3 bg-gray-50 flex-1">
                                            {applicationsByStatus[column.id]?.map((app) => (
                                                <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                                                    {/* Job Title & Company */}
                                                    <div className="mb-3">
                                                        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                                            {app.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 4h1m4 0h1M9 16h1" />
                                                            </svg>
                                                            {app.company}
                                                        </p>
                                                    </div>

                                                    {/* Application Date */}
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-500 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7h8m-8 0v10a2 2 0 002 2h4a2 2 0 002-2V7" />
                                                            </svg>
                                                            {new Date(app.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    {/* Notes */}
                                                    {app.raw_data?.notes && (
                                                        <div className="mb-3">
                                                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded text-left line-clamp-2">
                                                                {app.raw_data.notes}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                        <div className="flex items-center space-x-1">
                                                            {app.url && (
                                                                <a
                                                                    href={app.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                                    title="View Job"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => startEditing(app)}
                                                                className="p-1 text-gray-400 hover:text-blue-600"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => deleteApplication(app.id)}
                                                                className="p-1 text-gray-400 hover:text-red-600"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Edit Form */}
                                                    {editingId === app.id && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                                                    <select
                                                                        value={editStatus}
                                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                    >
                                                                        {statusColumns.map(option => (
                                                                            <option key={option.id} value={option.id}>
                                                                                {option.title}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                                                                    <textarea
                                                                        value={editNotes}
                                                                        onChange={(e) => setEditNotes(e.target.value)}
                                                                        placeholder="Add notes..."
                                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => updateApplicationStatus(app.id, editStatus, editNotes)}
                                                                        className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEditing}
                                                                        className="flex-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Empty State for Column */}
                                            {applicationsByStatus[column.id]?.length === 0 && (
                                                <div className="text-center py-8">
                                                    <div className="text-gray-400 mb-2">
                                                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs text-gray-500">No {column.title.toLowerCase()} applications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
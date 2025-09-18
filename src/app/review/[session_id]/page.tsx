'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAuthToken } from '@/utils/auth'
import { ChatProvider } from '@/contexts/ChatContext'
import ChatComponent from '@/components/Chat/ChatComponent'
import {
    ArrowLeft,
    MessageSquare,
    FileText,
    User,
    Calendar,
    GitBranch,
    Clock,
    AlertTriangle,
    CheckCircle,
    Star,
    Zap,
    Shield,
    Code,
    Target,
    TrendingUp,
    GripVertical,
} from 'lucide-react'
import { prApi } from '@/api'

interface PRMetadata {
    title: string
    number: number
    author: string
    created_at: string
    base_ref: string
    head_ref: string
    repository: string
    state: string
}

interface CodeQualityRating {
    testing: number
    readability: number
    scalability: number
    maintainability: number
}

interface WellHandledCase {
    area: string
    reason: string
}

interface PRSummaryData {
    pr_summary_id: string
    summary: string
    issues_found: string[]
    suggestions: string[]
    test_recommendations: string[]
    overall_score: number
    security_concerns: string[]
    performance_issues: string[]
    well_handled_cases: WellHandledCase[]
    future_enhancements: string[]
    code_quality_rating: CodeQualityRating
}

interface PRSummaryResponse {
    success: boolean
    message: string
    data: PRSummaryData
}

export default function ReviewPage() {
    const params = useParams()
    const router = useRouter()
    const { isAuthenticated, loading: authLoading, user } = useAuth()
    const [sessionId, setSessionId] = useState<string>('')
    const [pr_summary_id, setSummaryId] = useState<string | null>(null)
    const [token, setToken] = useState<string>('')
    const [prMetadata, setPrMetadata] = useState<PRMetadata | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [prSummary, setPrSummary] = useState<PRSummaryData | null>(null)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)

    // Resizer state
    const [summaryWidth, setSummaryWidth] = useState(40) // 40% initial width
    const [isResizing, setIsResizing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Extract session_id from URL parameters
    useEffect(() => {
        if (params?.session_id) {
            setSessionId(params.session_id as string)
        }
    }, [params])

    useEffect(() => {
        const storedId = localStorage.getItem('pr_summary_id')
        console.log(storedId)
        if (storedId) setSummaryId(storedId)
        if (pr_summary_id) {
            fetchPRSummary(pr_summary_id)
        }
    }, [token])

    // Handle authentication and token extraction
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/login')
                return
            }

            // Try to get token from useAuth hook first
            if (user?.accessToken) {
                console.log('✅ Using token from useAuth hook')
                setToken(user.accessToken)
                setIsInitialized(true)
            } else {
                // Fallback to cookie extraction
                const authToken = getAuthToken()
                if (authToken) {
                    console.log('✅ Using token from cookie')
                    setToken(authToken)
                    setIsInitialized(true)
                } else {
                    console.error('❌ No auth token found in either location')
                    // Don't redirect immediately, wait a bit for auth to settle
                    setTimeout(() => {
                        if (!token) {
                            router.push('/login')
                        }
                    }, 2000)
                }
            }
        }

        console.log(
            '🔄 Auth useEffect - Loading:',
            authLoading,
            'Authenticated:',
            isAuthenticated,
            'User:',
            user
        )
    }, [isAuthenticated, authLoading, router, token, user])

    // Fetch PR Summary
    const fetchPRSummary = async (prSummaryId: string) => {
        setSummaryLoading(true)
        setSummaryError(null)

        try {
            console.log(prSummaryId, 'summary_idd localhost')
            const data = await prApi.getPRById(prSummaryId)
            console.log(data)
            if (data) {
                setPrSummary(data.data)
            } else {
                setSummaryError('Failed to fetch PR summary')
            }
        } catch (error) {
            console.error('Error fetching PR summary:', error)
            setSummaryError(
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch PR summary'
            )
        } finally {
            setSummaryLoading(false)
        }
    }

    // Resizer handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const newWidth =
                ((e.clientX - containerRect.left) / containerRect.width) * 100

            // Constrain between 20% and 70%
            const constrainedWidth = Math.min(Math.max(newWidth, 20), 70)
            setSummaryWidth(constrainedWidth)
        },
        [isResizing]
    )

    const handleMouseUp = useCallback(() => {
        setIsResizing(false)
    }, [])

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, handleMouseMove, handleMouseUp])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getStateColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'open':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'closed':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'merged':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 dark:text-green-400'
        if (score >= 6) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 8) return 'bg-green-500'
        if (rating >= 6) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    if (authLoading || !isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/30 flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                </div>
            </div>
        )
    }

    if (!pr_summary_id) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/30 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Invalid Summary Id
                    </h1>
                    <p className="text-gray-600 mb-4">No PR session ID</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <ChatProvider>
            <div className="bg-gradient-to-br from-background via-background to-surface/30">
                <div className="container mx-auto px-6 py-8 max-w-full">
                    <div
                        ref={containerRef}
                        className="flex gap-1 h-[calc(120vh-12rem)] relative"
                    >
                        {/* Chat Panel */}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            style={{ width: `${100 - summaryWidth}%` }}
                        >
                            <ChatComponent
                                sessionId={sessionId}
                                token={user?.user_id}
                                className="h-full"
                            />
                        </div>

                        {/* Resizer */}
                        <div
                            className={`w-1 bg-gray-300 dark:bg-gray-600 hover:bg-primary dark:hover:bg-primary cursor-col-resize transition-colors relative group ${
                                isResizing ? 'bg-primary' : ''
                            }`}
                            onMouseDown={handleMouseDown}
                        >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>

                        {/* PR Summary Panel */}
                        <div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                            style={{ width: `${summaryWidth}%` }}
                        >
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        PR Summary
                                    </h2>
                                    {prSummary && (
                                        <div
                                            className={`text-2xl font-bold ${getScoreColor(
                                                prSummary.overall_score
                                            )}`}
                                        >
                                            {prSummary.overall_score}/10
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {summaryLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
                                    </div>
                                ) : summaryError ? (
                                    <div className="text-center text-red-600 dark:text-red-400 p-8">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-lg font-medium mb-2">
                                            Error loading summary
                                        </p>
                                        <p className="text-sm">
                                            {summaryError}
                                        </p>
                                        <button
                                            onClick={() =>
                                                pr_summary_id &&
                                                fetchPRSummary(pr_summary_id)
                                            }
                                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : prSummary ? (
                                    <>
                                        {/* Summary */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Summary
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {prSummary.summary}
                                            </p>
                                        </div>

                                        {/* Code Quality Rating */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Star className="w-4 h-4" />
                                                Code Quality Rating
                                            </h3>
                                            <div className="space-y-3">
                                                {Object.entries(
                                                    prSummary.code_quality_rating
                                                ).map(([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                                            {key}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${getRatingColor(
                                                                        value
                                                                    )} transition-all`}
                                                                    style={{
                                                                        width: `${
                                                                            (value /
                                                                                10) *
                                                                            100
                                                                        }%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-bold w-6">
                                                                {value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Well Handled Cases */}
                                        {prSummary.well_handled_cases.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    Well Handled Cases
                                                </h3>
                                                <div className="space-y-2">
                                                    {prSummary.well_handled_cases.map(
                                                        (item, index) => (
                                                            <div
                                                                key={index}
                                                                className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                                                            >
                                                                <p className="font-medium text-green-800 dark:text-green-300 text-sm">
                                                                    {item.area}
                                                                </p>
                                                                <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                                                                    {
                                                                        item.reason
                                                                    }
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {prSummary.suggestions.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-blue-500" />
                                                    Suggestions
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.suggestions.map(
                                                        (suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                                                            >
                                                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                                                    {suggestion}
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Issues Found */}
                                        {prSummary.issues_found.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    Issues Found
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.issues_found.map(
                                                        (issue, index) => (
                                                            <li
                                                                key={index}
                                                                className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                                                            >
                                                                <p className="text-red-800 dark:text-red-300 text-sm">
                                                                    {issue}
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Performance Issues */}
                                        {prSummary.performance_issues.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-orange-500" />
                                                    Performance Issues
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.performance_issues.map(
                                                        (issue, index) => (
                                                            <li
                                                                key={index}
                                                                className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800"
                                                            >
                                                                <p className="text-orange-800 dark:text-orange-300 text-sm">
                                                                    {issue}
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Security Concerns */}
                                        {prSummary.security_concerns.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-red-500" />
                                                    Security Concerns
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.security_concerns.map(
                                                        (concern, index) => (
                                                            <li
                                                                key={index}
                                                                className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                                                            >
                                                                <p className="text-red-800 dark:text-red-300 text-sm">
                                                                    {concern}
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Test Recommendations */}
                                        {prSummary.test_recommendations.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Code className="w-4 h-4 text-purple-500" />
                                                    Test Recommendations
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.test_recommendations.map(
                                                        (
                                                            recommendation,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={index}
                                                                className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800"
                                                            >
                                                                <p className="text-purple-800 dark:text-purple-300 text-sm">
                                                                    {
                                                                        recommendation
                                                                    }
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Future Enhancements */}
                                        {prSummary.future_enhancements.length >
                                            0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                                                    Future Enhancements
                                                </h3>
                                                <ul className="space-y-2">
                                                    {prSummary.future_enhancements.map(
                                                        (
                                                            enhancement,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={index}
                                                                className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800"
                                                            >
                                                                <p className="text-indigo-800 dark:text-indigo-300 text-sm">
                                                                    {
                                                                        enhancement
                                                                    }
                                                                </p>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ChatProvider>
    )
}

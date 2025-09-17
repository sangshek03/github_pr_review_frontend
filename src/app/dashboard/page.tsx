'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prApi, type FetchPRRequest, type AnalyzePRRequest, type AnalysisResponse, type PRSummary } from '@/api';
import { PRDetailsResponse, FetchAndSaveResponse, UserPRsResponse, PRMetadata } from '@/types/pr';
import { Accordion } from '@/components/ui/Accordion';

const loadingQuotes = [
  "🤖 AI is analyzing your code patterns...",
  "🔍 Examining PR structure and changes...",
  "📊 Calculating code quality metrics...",
  "🛡️ Checking for security concerns...",
  "⚡ Evaluating performance implications...",
  "🧪 Generating test recommendations...",
  "💡 Formulating improvement suggestions...",
  "🎯 Almost there, finalizing analysis..."
];

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);
  const [prDetails, setPrDetails] = useState<FetchAndSaveResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [recentPRs, setRecentPRs] = useState<PRDetailsResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [prSummaries, setPrSummaries] = useState<PRSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentPRs();
    fetchPRSummaries();
  }, []);

  useEffect(() => {
    if (analyzing) {
      const interval = setInterval(() => {
        setLoadingQuoteIndex((prev) => (prev + 1) % loadingQuotes.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [analyzing]);

  const fetchRecentPRs = async () => {
    setLoadingRecent(true);
    try {
      const data = await prApi.getMyPRs();
      setRecentPRs(data);
    } catch (err) {
      console.error('Failed to fetch recent PRs:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchPRSummaries = async () => {
    setLoadingSummaries(true);
    try {
      const data = await prApi.getPRSummaries();
      setPrSummaries(data);
    } catch (err) {
      console.error('Failed to fetch PR summaries:', err);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const handleCheckPR = async () => {
    const prUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+$/;

    if (!prUrl || !prUrlPattern.test(prUrl)) {
      setError('Invalid GitHub PR URL format. Expected: https://github.com/{owner}/{repo}/pull/{pr_number}');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fetchRequest: FetchPRRequest = { pr_url: prUrl };
      const data = await prApi.fetchPR(fetchRequest);
      setPrDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch PR details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePR = async () => {
    setAnalyzing(true);
    setLoadingQuoteIndex(0);

    try {
      const analyzeRequest: AnalyzePRRequest = { pr_url: prUrl };
      const data = await prApi.analyzePR(analyzeRequest);
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze PR. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQARedirect = () => {
    if (prDetails?.data.fetchedData.metadata.id) {
      router.push(`/review/${prDetails.data.fetchedData.metadata.id}`);
    }
  };

  const handleReviewPR = (prId: string | number) => {
    // Find the corresponding summary for this PR
    const correspondingSummary = prSummaries.find((summary, index) => {
      // Assuming the first summary corresponds to the most recent PR
      return index === 0; // You might need to adjust this logic based on your actual data structure
    });

    if (correspondingSummary) {
      router.push(`/review/${correspondingSummary.pr_summary_id}`);
    } else {
      router.push(`/review/${prId}`);
    }
  };

  // Helper function to get summary for a PR
  const getSummaryForPR = (prIndex: number): PRSummary | null => {
    // Assuming summaries are ordered same as PRs (most recent first)
    return prSummaries[prIndex] || null;
  };

  // Helper function to check if PR has a summary
  const hasSummary = (prIndex: number): boolean => {
    return getSummaryForPR(prIndex) !== null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setPrUrl('');
    setPrDetails(null);
    setAnalysisResult(null);
    setError('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingEmoji = (rating: number) => {
    if (rating >= 8) return '🌟';
    if (rating >= 6) return '👍';
    if (rating >= 4) return '🤔';
    return '⚠️';
  };

  // Unified PR Item Component
  const UnifiedPRItem = ({ pr, summary, hasAnalysis, formatDate, router }: {
    pr: PRDetailsResponse;
    summary: PRSummary | null;
    hasAnalysis: boolean;
    formatDate: (date: string) => string;
    router: any;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="border border-divider rounded-2xl bg-gradient-to-br from-surface to-background/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* PR Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-200 hover:bg-background/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <img
                    src={pr.data.metadata.user.avatar_url}
                    alt={pr.data.metadata.user.login}
                    className="w-12 h-12 rounded-full border-2 border-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-text-primary">
                      {pr.data.metadata.user.login}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      pr.data.metadata.state === 'open'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : pr.data.metadata.state === 'closed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        pr.data.metadata.state === 'open' ? 'bg-green-500' :
                        pr.data.metadata.state === 'closed' ? 'bg-red-500' : 'bg-purple-500'
                      }`}></div>
                      {pr.data.metadata.state}
                    </span>
                    {hasAnalysis && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        AI Analysis Available
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    #{pr.data.metadata.number} {pr.data.metadata.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {pr.data.metadata.base.ref} ← {pr.data.metadata.head.ref}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(pr.data.metadata.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {pr.data.files.length} files
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {pr.data.reviews.length} reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasAnalysis && summary && (
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(summary.overall_score)}`}>
                    {summary.overall_score}/10
                  </span>
                  <span className="text-2xl">{getRatingEmoji(summary.overall_score)}</span>
                </div>
              )}
              <svg
                className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-6 pb-6 border-t border-divider/50">
            {hasAnalysis && summary ? (
              <div className="space-y-4 pt-6">
                {/* Summary Overview */}
                <div className="bg-background rounded-lg p-4">
                  <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <span>📊</span> Analysis Summary
                  </h4>
                  <p className="text-text-secondary mb-4">{summary.summary}</p>

                  {/* Code Quality Ratings */}
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(summary.code_quality_rating).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-text-secondary capitalize">{key}:</span>
                        <span className="flex items-center gap-1">
                          <span className={`font-medium ${getScoreColor(value)}`}>{value}/10</span>
                          <span>{getRatingEmoji(value)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues Found */}
                {summary.issues_found.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                      <span>⚠️</span> Issues Found ({summary.issues_found.length})
                    </h4>
                    <ul className="space-y-1">
                      {summary.issues_found.slice(0, 3).map((issue, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                          <span>•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                      {summary.issues_found.length > 3 && (
                        <li className="text-sm text-red-600 dark:text-red-400 italic">
                          +{summary.issues_found.length - 3} more issues
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {summary.suggestions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <span>💡</span> Key Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {summary.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                      {summary.suggestions.length > 3 && (
                        <li className="text-sm text-blue-600 dark:text-blue-400 italic">
                          +{summary.suggestions.length - 3} more suggestions
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Chat Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => router.push(`/review/${summary.pr_summary_id}`)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat with AI to know more
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-6 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="font-medium text-text-primary mb-2">No AI Analysis Available</h4>
                  <p className="text-sm text-text-secondary">This PR hasn't been analyzed yet. Run an analysis to see detailed insights and recommendations.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/30">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            PR Review Dashboard
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            AI-powered GitHub Pull Request reviews with comprehensive analysis and insights
          </p>
        </div>

        {/* Enhanced Review New PR Section */}
        <div className="mb-12 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="relative bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Analyze New GitHub PR
            </button>
          </div>
        </div>

        {/* Enhanced Unified PR Dashboard */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Recent Pull Requests
            </h2>
          </div>

          {(loadingRecent || loadingSummaries) ? (
            <div className="flex justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : recentPRs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-surface to-background border border-divider/50 shadow-lg">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">No PRs Found</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">Start by analyzing your first GitHub Pull Request to see it appear here with detailed insights</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Analyze Your First PR
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPRs.map((pr, prIndex) => {
                const correspondingSummary = getSummaryForPR(prIndex);
                const hasAnalysis = hasSummary(prIndex);

                return (
                  <UnifiedPRItem
                    key={pr.data.metadata.id}
                    pr={pr}
                    summary={correspondingSummary}
                    hasAnalysis={hasAnalysis}
                    formatDate={formatDate}
                    router={router}
                  />
                );
              })}
            </div>
            ) : recentPRs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-gradient-to-br from-surface to-background border border-divider/50 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No PRs Reviewed Yet</h3>
                <p className="text-text-secondary mb-4">Start by analyzing your first GitHub Pull Request</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Analyze First PR
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPRs.map((pr, prIndex) => {
                  const correspondingSummary = getSummaryForPR(prIndex);
                  const hasAnalysis = hasSummary(prIndex);

                  return (
                    <div
                      key={pr.data.metadata.id}
                      className={`group relative rounded-2xl bg-gradient-to-br from-surface to-background/50 border transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden ${
                        hasAnalysis
                          ? 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-600'
                          : 'border-divider/50 hover:border-primary/30'
                      }`}
                    >
                      {/* Analysis Available Indicator */}
                      {hasAnalysis && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analysis Ready
                          </div>
                        </div>
                      )}

                      {/* Connection Line Visual Indicator */}
                      {hasAnalysis && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500"></div>
                      )}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <img
                                src={pr.data.metadata.user.avatar_url}
                                alt={pr.data.metadata.user.login}
                                className="w-10 h-10 rounded-full border-2 border-primary/20"
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface"></div>
                            </div>
                            <div>
                              <span className="font-semibold text-text-primary block">
                                {pr.data.metadata.user.login}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pr.data.metadata.state === 'open'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : pr.data.metadata.state === 'closed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${
                                  pr.data.metadata.state === 'open' ? 'bg-green-500' :
                                  pr.data.metadata.state === 'closed' ? 'bg-red-500' : 'bg-purple-500'
                                }`}></div>
                                {pr.data.metadata.state}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold mb-3 text-text-primary group-hover:text-primary transition-colors">
                            #{pr.data.metadata.number} {pr.data.metadata.title}
                          </h3>

                          <div className="flex items-center gap-3 text-sm text-text-secondary mb-3">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              {pr.data.metadata.base.ref} ← {pr.data.metadata.head.ref}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(pr.data.metadata.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {pr.data.files.length} files
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {pr.data.reviews.length} reviews
                            </span>
                          </div>
                        </div>

                        <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                          hasAnalysis
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50'
                            : 'bg-primary/10 group-hover:bg-primary/20'
                        }`}>
                          {hasAnalysis ? (
                            <svg
                              className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced PR Summaries Section */}
          <div className="space-y-6 min-h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">
                Analysis Summaries
              </h2>
            </div>

            {loadingSummaries ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-500"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : prSummaries.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-gradient-to-br from-surface to-background border border-divider/50 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Analysis Summaries</h3>
                <p className="text-text-secondary mb-4">AI analysis summaries will appear here after you analyze PRs</p>
                <div className="text-sm text-text-secondary bg-primary/5 rounded-lg p-3 max-w-sm mx-auto">
                  💡 Tip: Complete PR analysis to generate detailed summaries with insights
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-text-secondary text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click on any summary to expand and see detailed analysis results
                </div>
                <Accordion summaries={prSummaries} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Analyzing State */}
              {analyzing && (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="text-6xl animate-bounce">🤖</div>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    AI Analysis in Progress
                  </h3>
                  <div className="mb-6">
                    <div className="animate-pulse text-lg text-text-secondary">
                      {loadingQuotes[loadingQuoteIndex]}
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {!analyzing && analysisResult && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                    <span className="text-3xl">📊</span> PR Analysis Complete
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-text-primary">Overall Score</h3>
                        <span className={`text-3xl font-bold ${getScoreColor(analysisResult.data.overall_score)}`}>
                          {analysisResult.data.overall_score}/10
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm">{analysisResult.data.summary}</p>
                    </div>

                    {/* Code Quality Ratings */}
                    <div className="bg-background rounded-lg p-4">
                      <h3 className="font-semibold text-text-primary mb-3">Code Quality Metrics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(analysisResult.data.code_quality_rating).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-text-secondary capitalize">{key}:</span>
                            <span className="flex items-center gap-1">
                              <span className={`font-medium ${getScoreColor(value)}`}>{value}/10</span>
                              <span>{getRatingEmoji(value)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues Found */}
                    {analysisResult.data.issues_found.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                          <span>⚠️</span> Issues Found ({analysisResult.data.issues_found.length})
                        </h3>
                        <ul className="space-y-1">
                          {analysisResult.data.issues_found.map((issue, index) => (
                            <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {analysisResult.data.suggestions.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <span>💡</span> Suggestions
                        </h3>
                        <ul className="space-y-1">
                          {analysisResult.data.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Security Concerns */}
                    {analysisResult.data.security_concerns.length > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                          <span>🛡️</span> Security Concerns
                        </h3>
                        <ul className="space-y-1">
                          {analysisResult.data.security_concerns.map((concern, index) => (
                            <li key={index} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Test Recommendations */}
                    {analysisResult.data.test_recommendations.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                          <span>🧪</span> Test Recommendations
                        </h3>
                        <ul className="space-y-1">
                          {analysisResult.data.test_recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Well Handled Cases */}
                    {analysisResult.data.well_handled_cases.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                          <span>✅</span> Well Handled
                        </h3>
                        <ul className="space-y-2">
                          {analysisResult.data.well_handled_cases.map((item, index) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300">
                              <div className="flex items-start gap-2">
                                <span>•</span>
                                <div>
                                  <span className="font-medium">{item.area}:</span>
                                  <span className="ml-1">{item.reason}</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={resetModal}
                      className="px-4 py-2 rounded-lg border border-divider text-text-secondary hover:bg-background transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleQARedirect}
                      className="gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>💬</span>
                      <span>Q/A Related to this PR with AI</span>
                    </button>
                  </div>
                </>
              )}

              {/* Initial PR Details View */}
              {!analyzing && !analysisResult && !prDetails && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-text-primary">
                    Review New GitHub PR
                  </h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-text-secondary">
                      GitHub PR URL
                    </label>
                    <input
                      type="url"
                      value={prUrl}
                      onChange={(e) => setPrUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo/pull/123"
                      className="w-full px-4 py-2 rounded-lg border border-divider bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {error && (
                      <p className="mt-2 text-sm text-red-500">{error}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={resetModal}
                      className="px-4 py-2 rounded-lg border border-divider text-text-secondary hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCheckPR}
                      disabled={loading}
                      className="gradient-primary text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Checking...' : 'Check PR'}
                    </button>
                  </div>
                </>
              )}

              {/* PR Details View (before analysis) */}
              {!analyzing && !analysisResult && prDetails && (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-text-primary">
                    PR Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-background rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-text-primary">
                        #{prDetails.data.fetchedData.metadata.number} {prDetails.data.fetchedData.metadata.title}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">Author:</span>
                          <span className="ml-2 text-text-primary">
                            {prDetails.data.fetchedData.metadata.user.login}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">State:</span>
                          <span className="ml-2 capitalize text-text-primary">
                            {prDetails.data.fetchedData.metadata.state}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Base:</span>
                          <span className="ml-2 text-text-primary">
                            {prDetails.data.fetchedData.metadata.base.ref}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Head:</span>
                          <span className="ml-2 text-text-primary">
                            {prDetails.data.fetchedData.metadata.head.ref}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={resetModal}
                      className="px-4 py-2 rounded-lg border border-divider text-text-secondary hover:bg-background transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleAnalyzePR}
                      className="gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>🤖</span>
                      <span>Analyze This PR</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
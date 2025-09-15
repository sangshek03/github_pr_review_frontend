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
    router.push(`/review/${prId}`);
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

  return (
    <div className="min-h-screen bg-background px-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            PR Review Dashboard
          </h1>
          <p className="text-text-secondary">
            Review and manage GitHub pull requests
          </p>
        </div>

        {/* Review New PR Button */}
        <div className="mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Review New GitHub PR
          </button>
        </div>

        <div className='flex'>
            {/* Recent Reviewed PRs */}
        <div className=''>
          <h2 className="text-2xl font-semibold mb-4 text-text-primary">
            Recent Reviewed PRs
          </h2>
          
          {loadingRecent ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : recentPRs.length === 0 ? (
            <div className="text-center py-8 rounded-lg bg-surface text-text-secondary">
              No reviewed PRs yet. Start by reviewing a new PR!
            </div>
          ) : (
            <div className="grid gap-4">
              {recentPRs.map((pr) => (
                <div 
                  key={pr.data.metadata.id}
                  className="rounded-lg p-6 bg-surface hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-primary"
                  onClick={() => handleReviewPR(pr.data.metadata.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={pr.data.metadata.user.avatar_url} 
                          alt={pr.data.metadata.user.login}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-text-primary">
                          {pr.data.metadata.user.login}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pr.data.metadata.state === 'open' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : pr.data.metadata.state === 'closed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {pr.data.metadata.state}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 text-text-primary">
                        #{pr.data.metadata.number} {pr.data.metadata.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>Base: {pr.data.metadata.base.ref}</span>
                        <span>→</span>
                        <span>Head: {pr.data.metadata.head.ref}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
                        <span>Created: {formatDate(pr.data.metadata.created_at)}</span>
                        <span>•</span>
                        <span>Updated: {formatDate(pr.data.metadata.updated_at)}</span>
                        <span>•</span>
                        <span>{pr.data.files.length} files changed</span>
                        <span>•</span>
                        <span>{pr.data.reviews.length} reviews</span>
                      </div>
                    </div>
                    
                    <svg 
                      className="w-5 h-5 ml-4 text-text-secondary" 
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PR Summaries Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4 text-text-primary">
            Recent PR Analysis Summaries
          </h2>

          {loadingSummaries ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : prSummaries.length === 0 ? (
            <div className="text-center py-8 rounded-lg bg-surface text-text-secondary">
              <div className="mb-4 text-4xl">📊</div>
              <p className="mb-2 font-medium">No PR summaries available yet</p>
              <p className="text-sm">Analyze some PRs to see detailed summaries here</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-text-secondary text-sm">
                Click on any summary to see detailed analysis results
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
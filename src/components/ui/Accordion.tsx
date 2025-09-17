"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRSummary } from '@/api'

interface AccordionProps {
  summaries: PRSummary[]
}

interface AccordionItemProps {
  summary: PRSummary
  isOpen: boolean
  onToggle: () => void
}

const AccordionItem = ({ summary, isOpen, onToggle }: AccordionItemProps) => {
  const router = useRouter()
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingEmoji = (rating: number) => {
    if (rating >= 8) return '🌟'
    if (rating >= 6) return '👍'
    if (rating >= 4) return '🤔'
    return '⚠️'
  }

  return (
    <div className="border border-divider rounded-lg bg-surface overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors duration-200 hover:bg-background/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl font-bold ${getScoreColor(summary.overall_score)}`}>
                {summary.overall_score}/10
              </span>
              <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                PR Summary
              </span>
            </div>
            <p className="text-text-primary font-medium text-sm line-clamp-2">
              {summary.summary}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <span className="text-2xl">{getRatingEmoji(summary.overall_score)}</span>
            <svg
              className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
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

      {/* Accordion Content */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {/* Code Quality Ratings */}
            <div className="bg-background rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span>📊</span> Code Quality Metrics
              </h4>
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
                  {summary.issues_found.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {summary.suggestions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>💡</span> Suggestions
                </h4>
                <ul className="space-y-1">
                  {summary.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security Concerns */}
            {summary.security_concerns.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>🛡️</span> Security Concerns
                </h4>
                <ul className="space-y-1">
                  {summary.security_concerns.map((concern, index) => (
                    <li key={index} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test Recommendations */}
            {summary.test_recommendations.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <span>🧪</span> Test Recommendations
                </h4>
                <ul className="space-y-1">
                  {summary.test_recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Well Handled Cases */}
            {summary.well_handled_cases.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>✅</span> Well Handled
                </h4>
                <ul className="space-y-2">
                  {summary.well_handled_cases.map((item, index) => (
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

            {/* Future Enhancements */}
            {summary.future_enhancements.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <span>🚀</span> Future Enhancements
                </h4>
                <ul className="space-y-1">
                  {summary.future_enhancements.map((enhancement, index) => (
                    <li key={index} className="text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                      <span>•</span>
                      <span>{enhancement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chat with AI Button */}
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
        </div>
      </div>
    </div>
  )
}

export const Accordion = ({ summaries }: AccordionProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (summaryId: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(summaryId)) {
      newOpenItems.delete(summaryId)
    } else {
      newOpenItems.add(summaryId)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <AccordionItem
          key={summary.pr_summary_id}
          summary={summary}
          isOpen={openItems.has(summary.pr_summary_id)}
          onToggle={() => toggleItem(summary.pr_summary_id)}
        />
      ))}
    </div>
  )
}

export default Accordion
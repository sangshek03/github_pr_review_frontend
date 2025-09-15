// app/review/[id]/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  GitPullRequest, 
  MessageCircle, 
  Send, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Code,
  Shield,
  Zap,
  Star,
  GitBranch,
  Clock,
  User,
  Hash,
  TrendingUp,
  FileText,
  Bot
} from 'lucide-react';

// Types
interface PRReview {
  id: string;
  prNumber: number;
  title: string;
  author: string;
  createdAt: string;
  status: 'open' | 'merged' | 'closed';
  branch: string;
  reviewData?: {
    summary: string;
    issues_found: string[];
    suggestions: string[];
    test_recommendations: string[];
    overall_score: number;
    security_concerns: string[];
    performance_issues: string[];
    well_handled_cases: string[];
    future_enhancements: string[];
    code_quality_rating: {
      readability: number;
      maintainability: number;
      scalability: number;
      testing: number;
    };
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Dummy data
const dummyPRs: PRReview[] = [
  {
    id: '1',
    prNumber: 245,
    title: 'Update axios dependency to 1.12.0',
    author: 'john.doe',
    createdAt: '2024-01-15',
    status: 'open',
    branch: 'feature/update-axios',
    reviewData: {
      summary: "This PR updates the axios dependency from version 1.11.0 to 1.12.0. The change appears to be straightforward, but there are concerns regarding the React version downgrade noted in the existing review.",
      issues_found: [
        "Potential React version downgrade from 19.1.0 to 18.3.1",
        "No changeset found, which may affect versioning"
      ],
      suggestions: [
        "Confirm the React version downgrade is intentional and does not introduce compatibility issues",
        "Consider adding a changeset to reflect the dependency update"
      ],
      test_recommendations: [
        "Run existing tests to ensure compatibility with the new axios version",
        "Add tests to cover any new features or bug fixes introduced in axios 1.12.0"
      ],
      overall_score: 6,
      security_concerns: [],
      performance_issues: [],
      well_handled_cases: [],
      future_enhancements: [
        "Monitor axios for future updates and assess their impact on the codebase",
        "Implement automated dependency updates to streamline future maintenance"
      ],
      code_quality_rating: {
        readability: 7,
        maintainability: 6,
        scalability: 6,
        testing: 5
      }
    }
  },
  {
    id: '2',
    prNumber: 244,
    title: 'Implement user authentication flow',
    author: 'jane.smith',
    createdAt: '2024-01-14',
    status: 'open',
    branch: 'feature/auth-flow',
    reviewData: {
      summary: "Comprehensive implementation of JWT-based authentication with refresh token mechanism.",
      issues_found: [
        "Missing rate limiting on login endpoint",
        "Passwords stored without salt"
      ],
      suggestions: [
        "Add rate limiting to prevent brute force attacks",
        "Implement bcrypt with salt rounds"
      ],
      test_recommendations: [
        "Add integration tests for auth flow",
        "Test token expiration scenarios"
      ],
      overall_score: 7,
      security_concerns: ["Password hashing needs improvement"],
      performance_issues: [],
      well_handled_cases: ["Token refresh mechanism", "Session management"],
      future_enhancements: ["Add OAuth support", "Implement 2FA"],
      code_quality_rating: {
        readability: 8,
        maintainability: 7,
        scalability: 8,
        testing: 6
      }
    }
  },
  {
    id: '3',
    prNumber: 243,
    title: 'Refactor dashboard components',
    author: 'alice.johnson',
    createdAt: '2024-01-13',
    status: 'merged',
    branch: 'refactor/dashboard',
    reviewData: {
      summary: "Major refactoring of dashboard components for better performance and maintainability.",
      issues_found: [],
      suggestions: ["Consider memoization for expensive computations"],
      test_recommendations: ["Add performance benchmarks"],
      overall_score: 9,
      security_concerns: [],
      performance_issues: [],
      well_handled_cases: ["Component composition", "State management", "Code splitting"],
      future_enhancements: ["Add real-time updates"],
      code_quality_rating: {
        readability: 9,
        maintainability: 9,
        scalability: 8,
        testing: 8
      }
    }
  }
];

const dummyMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m here to help you understand this PR. Feel free to ask me anything about the code changes, potential issues, or suggestions for improvement.',
    timestamp: new Date()
  }
];

export default function PRReviewPage() {
  const params = useParams();
  const [selectedPR, setSelectedPR] = useState<PRReview | null>(dummyPRs[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(dummyMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find PR by ID from params
    const pr = dummyPRs.find(p => p.id === params.id) || dummyPRs[0];
    setSelectedPR(pr);
    // Reset chat when PR changes
    setMessages(dummyMessages);
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the PR analysis, I can see that ${selectedPR?.reviewData?.issues_found.length || 0} issues were found. The main concern is about the dependency update. Would you like me to explain the potential risks?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-500';
      case 'merged': return 'text-purple-500';
      case 'closed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderRatingBar = (value: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-divider rounded-full h-2 overflow-hidden">
          <div 
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${value * 10}%` }}
          />
        </div>
        <span className="text-sm font-medium text-text-secondary">{value}/10</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - PR List */}
      <div className="w-80 bg-surface border-r border-divider flex flex-col">
        <div className="p-4 border-b border-divider">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Pull Requests
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {dummyPRs.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setSelectedPR(pr)}
              className={`w-full p-4 text-left hover:bg-background transition-colors border-b border-divider ${
                selectedPR?.id === pr.id ? 'bg-background border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">
                  #{pr.prNumber}
                </span>
                <span className={`text-xs font-medium ${getStatusColor(pr.status)}`}>
                  {pr.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-medium text-text-primary mb-2 line-clamp-2">
                {pr.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <User className="w-3 h-3" />
                <span>{pr.author}</span>
                <Clock className="w-3 h-3 ml-2" />
                <span>{pr.createdAt}</span>
              </div>
              {pr.reviewData && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`text-lg font-bold ${getScoreColor(pr.reviewData.overall_score)}`}>
                    {pr.reviewData.overall_score}/10
                  </div>
                  <div className="flex gap-1">
                    {pr.reviewData.issues_found.length > 0 && (
                      <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded">
                        {pr.reviewData.issues_found.length} issues
                      </span>
                    )}
                    {pr.reviewData.suggestions.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded">
                        {pr.reviewData.suggestions.length} suggestions
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Middle - Chat Interface */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-divider bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">PR Review Assistant</h3>
                <p className="text-xs text-text-secondary">Ask me anything about PR #{selectedPR?.prNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-text-secondary">Connected</span>
            </div>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'gradient-primary text-white'
                    : 'bg-surface border border-divider text-text-primary'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface border border-divider rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-divider bg-surface">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about the PR..."
              className="flex-1 px-4 py-2 bg-background border border-divider rounded-lg focus:outline-none focus:border-primary transition-colors text-text-primary placeholder-text-secondary"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - PR Summary */}
      <div className="w-96 bg-surface border-l border-divider flex flex-col overflow-y-auto">
        {selectedPR?.reviewData ? (
          <>
            <div className="p-4 border-b border-divider">
              <h2 className="text-lg font-semibold text-text-primary mb-2">PR Analysis</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <GitBranch className="w-4 h-4" />
                <span>{selectedPR.branch}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Overall Score */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Overall Score
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedPR.reviewData.overall_score)}`}>
                    {selectedPR.reviewData.overall_score}/10
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-divider rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full gradient-primary transition-all duration-300"
                        style={{ width: `${selectedPR.reviewData.overall_score * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {selectedPR.reviewData.summary}
                </p>
              </div>

              {/* Code Quality Ratings */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Quality
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-secondary">Readability</span>
                    </div>
                    {renderRatingBar(selectedPR.reviewData.code_quality_rating.readability)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-secondary">Maintainability</span>
                    </div>
                    {renderRatingBar(selectedPR.reviewData.code_quality_rating.maintainability)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-secondary">Scalability</span>
                    </div>
                    {renderRatingBar(selectedPR.reviewData.code_quality_rating.scalability)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-text-secondary">Testing</span>
                    </div>
                    {renderRatingBar(selectedPR.reviewData.code_quality_rating.testing)}
                  </div>
                </div>
              </div>

              {/* Issues Found */}
              {selectedPR.reviewData.issues_found.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Issues Found ({selectedPR.reviewData.issues_found.length})
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.issues_found.map((issue, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {selectedPR.reviewData.suggestions.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Suggestions ({selectedPR.reviewData.suggestions.length})
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Test Recommendations */}
              {selectedPR.reviewData.test_recommendations.length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-500 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Test Recommendations
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.test_recommendations.map((test, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Security Concerns */}
              {selectedPR.reviewData.security_concerns.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Concerns
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.security_concerns.map((concern, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Issues */}
              {selectedPR.reviewData.performance_issues.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-500 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Performance Issues
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.performance_issues.map((issue, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Well Handled Cases */}
              {selectedPR.reviewData.well_handled_cases.length > 0 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Well Handled
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.well_handled_cases.map((handled, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{handled}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Future Enhancements */}
              {selectedPR.reviewData.future_enhancements.length > 0 && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-500 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Future Enhancements
                  </h3>
                  <ul className="space-y-1">
                    {selectedPR.reviewData.future_enhancements.map((enhancement, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{enhancement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <GitPullRequest className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary">No review data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
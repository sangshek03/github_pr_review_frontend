import React, { useState } from 'react';
import { Calendar, GitBranch, User, MessageSquare, FileText, ExternalLink, Eye, GitCommit, Tag, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PRReviewDisplay = ({ reviewData }) => {
  
  if (!reviewData || !reviewData.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No PR data available</p>
      </div>
    );
  }

  const { metadata, reviews, comments, files } = reviewData.data;

  const getStatusBadge = (state) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (state) {
      case 'open':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'closed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'merged':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="w-5 h-5" />
              <span className="text-sm opacity-90">#{metadata.number}</span>
              <span className={getStatusBadge(metadata.state)}>
                {metadata.state}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{metadata.user.login}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(metadata.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(metadata.updated_at)}</span>
              </div>
            </div>
          </div>
          <a
            href={metadata.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">+{metadata.additions}</div>
          <div className="text-sm text-gray-600">Additions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">-{metadata.deletions}</div>
          <div className="text-sm text-gray-600">Deletions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{metadata.commits}</div>
          <div className="text-sm text-gray-600">Commits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{metadata.changed_files}</div>
          <div className="text-sm text-gray-600">Files Changed</div>
        </div>
      </div>

    </div>
  );
};

export default PRReviewDisplay;
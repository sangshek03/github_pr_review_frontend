// types/pr.ts

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url?: string;
  html_url?: string;
  type?: string;
}

export interface GitHubBranch {
  ref: string;
  sha?: string;
  repo?: {
    name: string;
    full_name: string;
    owner: GitHubUser;
  };
}

export interface PRMetadata {
  id: string | number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  user: GitHubUser;
  assignee?: GitHubUser;
  assignees?: GitHubUser[];
  requested_reviewers?: GitHubUser[];
  base: GitHubBranch;
  head: GitHubBranch;
  draft?: boolean;
  mergeable?: boolean;
  mergeable_state?: string;
  merged?: boolean;
  merge_commit_sha?: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  url?: string;
  html_url?: string;
}

export interface PRReview {
  id: number;
  user: GitHubUser;
  body?: string;
  state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED';
  html_url?: string;
  pull_request_url?: string;
  submitted_at?: string;
}

export interface PRComment {
  id: number;
  user: GitHubUser;
  body: string;
  created_at: string;
  updated_at: string;
  html_url?: string;
  issue_url?: string;
}

export interface PRFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  raw_url?: string;
  blob_url?: string;
  patch?: string;
  sha?: string;
  contents_url?: string;
  previous_filename?: string;
}

export interface PRCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: GitHubUser;
  committer?: GitHubUser;
  parents: Array<{
    sha: string;
    url: string;
  }>;
}

export interface PRData {
  metadata: PRMetadata;
  reviews: PRReview[];
  comments: PRComment[];
  files: PRFile[];
  commits?: PRCommit[];
}

// API Response Types
export interface BaseAPIResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface FetchAndSaveResponse extends BaseAPIResponse {
  data: {
    fetchedData: PRData;
    saved: boolean;
    prId?: string;
  };
}

export interface PRDetailsResponse extends BaseAPIResponse {
  data: PRData;
}

export interface UserPRsResponse extends BaseAPIResponse {
  data: PRDetailsResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface FetchPRRequest {
  pr_url: string;
}

export interface ReviewPRRequest {
  pr_id: string;
  review_data: {
    body?: string;
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    comments?: Array<{
      path: string;
      line?: number;
      body: string;
      side?: 'LEFT' | 'RIGHT';
    }>;
  };
}

export interface CreateCommentRequest {
  pr_id: string;
  body: string;
}

// Utility Types
export type PRState = PRMetadata['state'];
export type ReviewState = PRReview['state'];
export type FileStatus = PRFile['status'];

// Filter and Search Types
export interface PRFilters {
  state?: PRState[];
  author?: string[];
  assignee?: string[];
  reviewer?: string[];
  label?: string[];
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  since?: string;
  before?: string;
}

export interface PRSearchParams {
  query?: string;
  filters?: PRFilters;
  page?: number;
  per_page?: number;
}

// Statistics Types
export interface PRStats {
  total: number;
  open: number;
  closed: number;
  merged: number;
  draft: number;
  avg_time_to_merge?: number;
  avg_time_to_close?: number;
  most_active_reviewers?: Array<{
    user: GitHubUser;
    review_count: number;
  }>;
}

// Error Types
export interface APIError extends BaseAPIResponse {
  success: false;
  error: {
    code: string;
    details?: any;
  };
}

// Webhook Types (if needed for real-time updates)
export interface PRWebhookPayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'assigned' | 'unassigned' | 
          'review_requested' | 'review_request_removed' | 'labeled' | 'unlabeled' | 
          'synchronize' | 'ready_for_review' | 'converted_to_draft';
  number: number;
  pull_request: PRMetadata;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: GitHubUser;
  };
  sender: GitHubUser;
}
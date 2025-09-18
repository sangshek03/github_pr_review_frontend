import { apiClient, ApiResponse } from './api'
import { PRDetailsResponse, FetchAndSaveResponse, UserPRsResponse } from '@/types/pr'

// PR API request types
export interface FetchPRRequest {
  pr_url: string
}

export interface ReviewPRRequest {
  pr_id: string
  review_type?: 'detailed' | 'quick'
  focus_areas?: string[]
}

export interface AnalyzePRRequest {
  pr_url: string
}

export interface AnalysisResponse {
  
  success: boolean
  message: string
  data: {
    pr_summary_id:string
    summary: string
    issues_found: string[]
    suggestions: string[]
    test_recommendations: string[]
    overall_score: number
    security_concerns: string[]
    performance_issues: string[]
    well_handled_cases: Array<{
      area: string
      reason: string
    }>
    future_enhancements: string[]
    code_quality_rating: {
      readability: number
      maintainability: number
      scalability: number
      testing: number
    }
    session_id:string
  }
}

export interface PRSummary {
  pr_summary_id: string
  summary: string
  issues_found: string[]
  suggestions: string[]
  test_recommendations: string[]
  overall_score: number
  security_concerns: string[]
  performance_issues: string[]
  well_handled_cases: Array<{
    area: string
    reason: string
  }>
  future_enhancements: string[]
  code_quality_rating: {
    testing: number
    readability: number
    scalability: number
    maintainability: number
  }
  session_id: string
}

export interface PRSummariesResponse {
  success: boolean
  message: string
  data: PRSummary[]
}

// PR API functions
export const prApi = {
  // Fetch and save PR details from GitHub URL
  fetchPR: async (request: FetchPRRequest): Promise<FetchAndSaveResponse> => {
    try {
      const response = await apiClient.post<FetchAndSaveResponse>('/pr/fetch', request)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch PR details')
    }
  },

  // Get user's reviewed PRs
  getMyPRs: async (): Promise<PRDetailsResponse[]> => {
    try {
      const response = await apiClient.get<UserPRsResponse>('/pr/my-prs')
      return response.data.data || []
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your PRs')
    }
  },

  // Get PR summaries
  getPRSummaries: async (): Promise<PRSummary[]> => {
    try {
      const response = await apiClient.get<PRSummariesResponse>('/pr/pr_summaries')
      return response.data.data || []
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch PR summaries')
    }
  },

  // Get specific PR details by ID
  getPRById: async (prId: string): Promise<PRSummary> => {
    try {
      console.log(prId)
      const response = await apiClient.get<PRSummary>(`/pr/pr_summary/${prId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch PR details')
    }
  },

  // Generate AI review for a PR
  reviewPR: async (request: ReviewPRRequest): Promise<any> => {
    try {
      const response = await apiClient.post<ApiResponse>(`/pr/${request.pr_id}/review`, {
        review_type: request.review_type || 'detailed',
        focus_areas: request.focus_areas || []
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate PR review')
    }
  },

  // Delete a PR from history
  deletePR: async (prId: string): Promise<void> => {
    try {
      await apiClient.delete(`/pr/${prId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete PR')
    }
  },

  // Analyze PR with AI
  analyzePR: async (request: AnalyzePRRequest): Promise<AnalysisResponse> => {
    try {
      const response = await apiClient.post<AnalysisResponse>('/pr/analyze', request)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to analyze PR')
    }
  },

  // Search PRs
  searchPRs: async (query: string, filters?: any): Promise<PRDetailsResponse[]> => {
    try {
      const response = await apiClient.get<ApiResponse<PRDetailsResponse[]>>('/pr/search', {
        params: { q: query, ...filters }
      })
      return response.data.data || []
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search PRs')
    }
  },
}

export default prApi
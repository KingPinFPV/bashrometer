// lib/cutsApi.ts
// API client for cuts normalization system

import { 
  NormalizedCut, 
  CutVariation, 
  CreateNormalizedCutRequest,
  UpdateNormalizedCutRequest,
  CreateCutVariationRequest,
  UpdateCutVariationRequest,
  NormalizeCutRequest,
  NormalizeCutResponse,
  CutSuggestionsResponse,
  CutsListResponse,
  CutsFilters,
  CutsPaginationParams,
  CutNormalizationStats,
  CutAnalysisResult,
  BulkImportRequest,
  BulkImportResponse
} from '@/types/cuts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bashrometer-api.onrender.com';

// Helper function to build query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  return searchParams.toString();
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export class CutsApiClient {
  
  // Normalized Cuts endpoints
  
  /**
   * Get all normalized cuts with filtering and pagination
   */
  static async getNormalizedCuts(
    filters?: CutsFilters,
    pagination?: CutsPaginationParams
  ): Promise<CutsListResponse<NormalizedCut>> {
    const queryParams = {
      ...filters,
      ...pagination
    };
    
    const queryString = buildQueryString(queryParams);
    const url = `${API_BASE_URL}/api/cuts${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse<CutsListResponse<NormalizedCut>>(response);
  }
  
  /**
   * Get a single normalized cut by ID
   */
  static async getNormalizedCutById(id: number): Promise<NormalizedCut> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse<NormalizedCut>(response);
  }
  
  /**
   * Create a new normalized cut
   */
  static async createNormalizedCut(data: CreateNormalizedCutRequest): Promise<{ message: string; cut: NormalizedCut }> {
    const response = await fetch(`${API_BASE_URL}/api/cuts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<{ message: string; cut: NormalizedCut }>(response);
  }
  
  /**
   * Update a normalized cut
   */
  static async updateNormalizedCut(data: UpdateNormalizedCutRequest): Promise<{ message: string; cut: NormalizedCut }> {
    const { id, ...updateData } = data;
    
    const response = await fetch(`${API_BASE_URL}/api/cuts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    return handleResponse<{ message: string; cut: NormalizedCut }>(response);
  }
  
  /**
   * Delete a normalized cut
   */
  static async deleteNormalizedCut(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete cut`);
    }
  }
  
  // Variations endpoints
  
  /**
   * Get all variations with filtering and pagination
   */
  static async getVariations(
    filters?: CutsFilters & { normalizedCutId?: number },
    pagination?: CutsPaginationParams
  ): Promise<CutsListResponse<CutVariation>> {
    const queryParams = {
      ...filters,
      ...pagination
    };
    
    const queryString = buildQueryString(queryParams);
    const url = `${API_BASE_URL}/api/cuts/variations${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse<CutsListResponse<CutVariation>>(response);
  }
  
  /**
   * Create a new variation
   */
  static async createVariation(data: CreateCutVariationRequest): Promise<{ message: string; variation: CutVariation }> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/variations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<{ message: string; variation: CutVariation }>(response);
  }
  
  /**
   * Update a variation
   */
  static async updateVariation(data: UpdateCutVariationRequest): Promise<{ message: string; variation: CutVariation }> {
    const { id, ...updateData } = data;
    
    const response = await fetch(`${API_BASE_URL}/api/cuts/variations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    return handleResponse<{ message: string; variation: CutVariation }>(response);
  }
  
  /**
   * Delete a variation
   */
  static async deleteVariation(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/variations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete variation`);
    }
  }
  
  // Normalization and analysis endpoints
  
  /**
   * Normalize a cut name
   */
  static async normalizeCut(data: NormalizeCutRequest): Promise<NormalizeCutResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/normalize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<NormalizeCutResponse>(response);
  }
  
  /**
   * Analyze a cut name without creating records
   */
  static async analyzeCut(cutName: string): Promise<CutAnalysisResult> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cutName })
    });
    
    return handleResponse<CutAnalysisResult>(response);
  }
  
  /**
   * Get suggestions for a cut name
   */
  static async getSuggestions(
    query: string, 
    options?: { minConfidence?: number; limit?: number }
  ): Promise<CutSuggestionsResponse> {
    const queryParams = buildQueryString({
      minConfidence: options?.minConfidence || 0.3,
      limit: options?.limit || 5
    });
    
    const url = `${API_BASE_URL}/api/cuts/suggest/${encodeURIComponent(query)}${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse<CutSuggestionsResponse>(response);
  }
  
  /**
   * Get normalization statistics
   */
  static async getStats(): Promise<CutNormalizationStats[]> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse<CutNormalizationStats[]>(response);
  }
  
  // Bulk operations (for admin use)
  
  /**
   * Bulk import cuts from CSV or other sources
   */
  static async bulkImport(data: BulkImportRequest): Promise<BulkImportResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cuts/bulk-import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<BulkImportResponse>(response);
  }
  
  // Utility methods
  
  /**
   * Search cuts with autocomplete functionality
   */
  static async searchCuts(
    query: string,
    filters?: Partial<CutsFilters>
  ): Promise<NormalizedCut[]> {
    const searchFilters = {
      search: query,
      ...filters
    };
    
    const result = await this.getNormalizedCuts(searchFilters, { limit: 10 });
    return result.data;
  }
  
  /**
   * Get cuts by category
   */
  static async getCutsByCategory(category: string): Promise<NormalizedCut[]> {
    const result = await this.getNormalizedCuts({ category }, { limit: 100 });
    return result.data;
  }
  
  /**
   * Verify a variation (mark as verified)
   */
  static async verifyVariation(id: number): Promise<void> {
    await this.updateVariation({ id, verified: true });
  }
  
  /**
   * Get unverified variations for review
   */
  static async getUnverifiedVariations(limit = 20): Promise<CutVariation[]> {
    const result = await this.getVariations(
      { verified: false }, 
      { limit, sortBy: 'confidenceScore', sortOrder: 'desc' }
    );
    return result.data;
  }
  
  /**
   * Get variations for a specific normalized cut
   */
  static async getVariationsForCut(normalizedCutId: number): Promise<CutVariation[]> {
    const result = await this.getVariations({ normalizedCutId }, { limit: 100 });
    return result.data;
  }
}

// Export individual functions for convenience
export const {
  getNormalizedCuts,
  getNormalizedCutById,
  createNormalizedCut,
  updateNormalizedCut,
  deleteNormalizedCut,
  getVariations,
  createVariation,
  updateVariation,
  deleteVariation,
  normalizeCut,
  analyzeCut,
  getSuggestions,
  getStats,
  bulkImport,
  searchCuts,
  getCutsByCategory,
  verifyVariation,
  getUnverifiedVariations,
  getVariationsForCut
} = CutsApiClient;

export default CutsApiClient;
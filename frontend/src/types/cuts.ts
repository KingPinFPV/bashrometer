// types/cuts.ts
// TypeScript types for meat cuts normalization system

export type MeatCategory = 'בקר' | 'עוף' | 'טלה' | 'חזיר' | 'דגים' | 'אחר';

export type CutType = 
  | 'סטייק'
  | 'צלי' 
  | 'טחון'
  | 'פילה'
  | 'שוק'
  | 'כנף'
  | 'חזה'
  | 'צלעות'
  | 'גיד'
  | 'שלם'
  | 'אחר';

export type VariationSource = 'manual' | 'automatic' | 'csv_import' | 'api';

export interface NormalizedCut {
  id: number;
  name: string;
  category: MeatCategory;
  cutType?: CutType;
  subcategory?: string;
  description?: string;
  isPremium: boolean;
  typicalWeightRange?: string;
  cookingMethods?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CutVariation {
  id: number;
  originalName: string;
  normalizedCutId: number;
  confidenceScore: number; // 0.0 to 1.0
  source: VariationSource;
  verified: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  
  // Populated when joining with normalized_cuts
  normalizedCut?: NormalizedCut;
}

export interface CutNormalizationStats {
  category: MeatCategory;
  normalizedCutsCount: number;
  variationsCount: number;
  avgConfidence: number;
  verifiedVariations: number;
}

// Request/Response types for API
export interface CreateNormalizedCutRequest {
  name: string;
  category: MeatCategory;
  cutType?: CutType;
  subcategory?: string;
  description?: string;
  isPremium?: boolean;
  typicalWeightRange?: string;
  cookingMethods?: string[];
}

export interface UpdateNormalizedCutRequest extends Partial<CreateNormalizedCutRequest> {
  id: number;
}

export interface CreateCutVariationRequest {
  originalName: string;
  normalizedCutId: number;
  confidenceScore?: number;
  source?: VariationSource;
  verified?: boolean;
}

export interface UpdateCutVariationRequest extends Partial<CreateCutVariationRequest> {
  id: number;
}

export interface NormalizeCutRequest {
  cutName: string;
  forceCreate?: boolean; // If true, create new normalized cut if no match found
  category?: MeatCategory; // Used when creating new cut
  cutType?: CutType; // Used when creating new cut
}

export interface NormalizeCutResponse {
  success: boolean;
  normalizedCut: NormalizedCut;
  variation?: CutVariation;
  isNewCut: boolean;
  confidence: number;
  alternatives?: Array<{
    cut: NormalizedCut;
    confidence: number;
  }>;
}

export interface CutSuggestion {
  cut: NormalizedCut;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'semantic';
  variation?: CutVariation;
}

export interface CutSuggestionsResponse {
  query: string;
  suggestions: CutSuggestion[];
  hasExactMatch: boolean;
}

// Filters and pagination
export interface CutsFilters {
  category?: MeatCategory | MeatCategory[];
  cutType?: CutType | CutType[];
  isPremium?: boolean;
  search?: string;
  verified?: boolean; // For variations
  minConfidence?: number; // For variations
}

export interface CutsPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'category' | 'cutType' | 'createdAt' | 'confidence';
  sortOrder?: 'asc' | 'desc';
}

export interface CutsListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: CutsFilters;
}

// Analysis and import types
export interface CutAnalysisResult {
  originalName: string;
  suggestedCategory?: MeatCategory;
  suggestedCutType?: CutType;
  suggestedNormalizedName: string;
  confidence: number;
  reasons: string[];
  possibleMatches: Array<{
    normalizedCut: NormalizedCut;
    confidence: number;
    reasons: string[];
  }>;
}

export interface BulkImportRequest {
  cuts: Array<{
    originalName: string;
    category?: MeatCategory;
    cutType?: CutType;
    description?: string;
    source?: string;
  }>;
  options: {
    skipExisting?: boolean;
    minConfidence?: number;
    autoVerify?: boolean;
    dryRun?: boolean;
  };
}

export interface BulkImportResponse {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    originalName: string;
    error: string;
  }>;
  results: Array<{
    originalName: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    normalizedCut?: NormalizedCut;
    variation?: CutVariation;
    confidence?: number;
  }>;
}

// UI Component props types
export interface CutCardProps {
  cut: NormalizedCut;
  showVariations?: boolean;
  onEdit?: (cut: NormalizedCut) => void;
  onDelete?: (cut: NormalizedCut) => void;
  onViewVariations?: (cut: NormalizedCut) => void;
}

export interface VariationCardProps {
  variation: CutVariation;
  showNormalizedCut?: boolean;
  onEdit?: (variation: CutVariation) => void;
  onDelete?: (variation: CutVariation) => void;
  onVerify?: (variation: CutVariation) => void;
}

export interface CutSearchProps {
  onSelect: (cut: NormalizedCut) => void;
  placeholder?: string;
  categories?: MeatCategory[];
  showCreateOption?: boolean;
  allowMultiple?: boolean;
}

// Error types
export interface CutNormalizationError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// Constants
export const MEAT_CATEGORIES: Record<MeatCategory, string> = {
  'בקר': 'בקר',
  'עוף': 'עוף', 
  'טלה': 'טלה',
  'חזיר': 'חזיר',
  'דגים': 'דגים',
  'אחר': 'אחר'
};

export const CUT_TYPES: Record<CutType, string> = {
  'סטייק': 'סטייק',
  'צלי': 'צלי',
  'טחון': 'טחון',
  'פילה': 'פילה',
  'שוק': 'שוק',
  'כנף': 'כנף',
  'חזה': 'חזה',
  'צלעות': 'צלעות',
  'גיד': 'גיד',
  'שלם': 'שלם',
  'אחר': 'אחר'
};

export const CONFIDENCE_LEVELS = {
  EXCELLENT: 0.9,
  GOOD: 0.75,
  FAIR: 0.6,
  POOR: 0.4
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const
};
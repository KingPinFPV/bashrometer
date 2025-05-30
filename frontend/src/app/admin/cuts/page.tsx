// app/admin/cuts/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { NormalizedCut, CutVariation, CutNormalizationStats } from '@/types/cuts';
import { CutsApiClient } from '@/lib/cutsApi';
import CutCard from '@/components/cuts/CutCard';
import CutSearchAutocomplete from '@/components/cuts/CutSearchAutocomplete';

type TabType = 'cuts' | 'variations' | 'stats';

interface MappingStats {
  totalMappingEntries: number;
  totalMappingVariations: number;
  databaseStats: {
    totalCuts: number;
    totalVariations: number;
    mappingVariations: number;
    mappingCoverage: number;
  };
  sourceBreakdown: Array<{
    source: string;
    count: number;
  }>;
}

export default function CutsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cuts');
  const [cuts, setCuts] = useState<NormalizedCut[]>([]);
  const [variations, setVariations] = useState<CutVariation[]>([]);
  const [stats, setStats] = useState<CutNormalizationStats[]>([]);
  const [mappingStats, setMappingStats] = useState<MappingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filters
  const [cutsPage, setCutsPage] = useState(1);
  const [variationsPage, setVariationsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'cuts') {
        await loadCuts();
      } else if (activeTab === 'variations') {
        await loadVariations();
      } else if (activeTab === 'stats') {
        await loadStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const loadCuts = async () => {
    const filters = {
      ...(searchQuery && { search: searchQuery }),
      ...(categoryFilter && { category: categoryFilter })
    };

    const response = await CutsApiClient.getNormalizedCuts(filters, {
      page: cutsPage,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    setCuts(response.data);
  };

  const loadVariations = async () => {
    const response = await CutsApiClient.getVariations({}, {
      page: variationsPage,
      limit: 20,
      sortBy: 'confidenceScore',
      sortOrder: 'desc'
    });

    setVariations(response.data);
  };

  const loadStats = async () => {
    const [statsData, mappingData] = await Promise.all([
      CutsApiClient.getStats(),
      loadMappingStats()
    ]);
    setStats(statsData);
    setMappingStats(mappingData);
  };

  const loadMappingStats = async (): Promise<MappingStats> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/cuts/mapping-stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch mapping stats');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading mapping stats:', error);
      throw error;
    }
  };

  const handleCutSelect = (cut: NormalizedCut) => {
    console.log('Selected cut:', cut);
    // Handle cut selection (e.g., open edit modal)
  };

  const handleEditCut = (cut: NormalizedCut) => {
    console.log('Edit cut:', cut);
    // Open edit modal
  };

  const handleDeleteCut = async (cut: NormalizedCut) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את "${cut.name}"?`)) {
      try {
        await CutsApiClient.deleteNormalizedCut(cut.id);
        await loadCuts();
      } catch (err) {
        alert(`שגיאה במחיקת הנתח: ${err}`);
      }
    }
  };

  const handleViewVariations = (cut: NormalizedCut) => {
    setActiveTab('variations');
    // Filter variations by this cut
  };

  const renderTabButton = (tab: TabType, label: string, count?: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  const renderCutsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              חיפוש נתחים
            </label>
            <CutSearchAutocomplete
              onSelect={handleCutSelect}
              placeholder="הקלד שם נתח..."
              showCreateOption={true}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">כל הקטגוריות</option>
              <option value="בקר">בקר</option>
              <option value="עוף">עוף</option>
              <option value="טלה">טלה</option>
              <option value="חזיר">חזיר</option>
              <option value="דגים">דגים</option>
              <option value="אחר">אחר</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadCuts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              חפש
            </button>
          </div>
        </div>
      </div>

      {/* Cuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuts.map((cut) => (
          <CutCard
            key={cut.id}
            cut={cut}
            showVariations={true}
            onEdit={handleEditCut}
            onDelete={handleDeleteCut}
            onViewVariations={handleViewVariations}
          />
        ))}
      </div>

      {cuts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          לא נמצאו נתחים
        </div>
      )}
    </div>
  );

  const renderVariationsTab = () => (
    <div className="space-y-6">
      {/* Variations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">וריאציות נתחים</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {variations.map((variation) => (
            <div key={variation.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">
                      {variation.originalName}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-blue-600">
                      {(variation as any).normalized_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>ביטחון: {(variation.confidenceScore * 100).toFixed(1)}%</span>
                    <span>מקור: {variation.source}</span>
                    {variation.verified && (
                      <span className="text-green-600">✓ מאומת</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!variation.verified && (
                    <button
                      onClick={() => {/* Handle verify */}}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      אמת
                    </button>
                  )}
                  <button
                    onClick={() => {/* Handle edit */}}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    ערוך
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {variations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          לא נמצאו וריאציות
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Mapping Stats Overview */}
      {mappingStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              🗂️ מיפוי חיצוני
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-600">נתחים במיפוי:</span>
                <span className="font-medium">{mappingStats.totalMappingEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">וריאציות במיפוי:</span>
                <span className="font-medium">{mappingStats.totalMappingVariations}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              📊 כיסוי מיפוי
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">כיסוי מיפוי:</span>
                <span className="font-medium text-2xl text-green-700">
                  {mappingStats.databaseStats.mappingCoverage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">וריאציות ממיפוי:</span>
                <span className="font-medium">
                  {mappingStats.databaseStats.mappingVariations}/{mappingStats.databaseStats.totalVariations}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              🎯 דיוק מיפוי
            </h3>
            <div className="space-y-2 text-sm">
              {mappingStats.sourceBreakdown.map((source) => (
                <div key={source.source} className="flex justify-between">
                  <span className="text-blue-600 capitalize">{source.source}:</span>
                  <span className="font-medium">{source.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📈 סה"כ נתונים
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">נתחים מנורמלים:</span>
                <span className="font-medium">{mappingStats.databaseStats.totalCuts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סה"כ וריאציות:</span>
                <span className="font-medium">{mappingStats.databaseStats.totalVariations}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.category} className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {stat.category}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">נתחים מנורמלים:</span>
                <span className="font-medium">{stat.normalizedCutsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">וריאציות:</span>
                <span className="font-medium">{stat.variationsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ביטחון ממוצע:</span>
                <span className="font-medium">
                  {(stat.avgConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מאומתות:</span>
                <span className="font-medium">{stat.verifiedVariations}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bars */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          התקדמות לפי קטגוריה
        </h3>
        <div className="space-y-4">
          {stats.map((stat) => {
            const verificationRate = stat.variationsCount > 0 
              ? (stat.verifiedVariations / stat.variationsCount) * 100 
              : 0;
            
            return (
              <div key={stat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{stat.category}</span>
                  <span className="text-gray-600">
                    {stat.verifiedVariations}/{stat.variationsCount} מאומתות
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${verificationRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {verificationRate.toFixed(1)}% מאומתות
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ניהול נתחי בשר</h1>
          <p className="mt-2 text-gray-600">
            נרמול וניהול נתחי בשר, וריאציות ומיפוי שמות
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {renderTabButton('cuts', 'נתחים מנורמלים', cuts.length)}
          {renderTabButton('variations', 'וריאציות', variations.length)}
          {renderTabButton('stats', 'סטטיסטיקות')}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {activeTab === 'cuts' && renderCutsTab()}
            {activeTab === 'variations' && renderVariationsTab()}
            {activeTab === 'stats' && renderStatsTab()}
          </>
        )}
      </div>
    </div>
  );
}
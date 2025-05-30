// components/cuts/CutSearchAutocomplete.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NormalizedCut, MeatCategory } from '@/types/cuts';
import { CutsApiClient } from '@/lib/cutsApi';

interface CutSearchAutocompleteProps {
  onSelect: (cut: NormalizedCut) => void;
  placeholder?: string;
  categories?: MeatCategory[];
  showCreateOption?: boolean;
  allowMultiple?: boolean;
  className?: string;
  initialValue?: string;
}

interface Suggestion {
  cut: NormalizedCut;
  confidence: number;
  matchType: string;
}

export default function CutSearchAutocomplete({
  onSelect,
  placeholder = 'חפש נתח בשר...',
  categories,
  showCreateOption = false,
  allowMultiple = false,
  className = '',
  initialValue = ''
}: CutSearchAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      await searchCuts(query.trim());
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const searchCuts = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await CutsApiClient.getSuggestions(searchQuery, {
        minConfidence: 0.3,
        limit: 8
      });
      
      setSuggestions(response.suggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Error searching cuts:', err);
      setError('שגיאה בחיפוש נתחים');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setError(null);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex].cut);
        } else if (showCreateOption && query.trim()) {
          handleCreateNew();
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectSuggestion = (cut: NormalizedCut) => {
    onSelect(cut);
    setQuery(cut.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleCreateNew = () => {
    // This would typically open a modal or navigate to a creation form
    console.log('Create new cut:', query);
    setShowSuggestions(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact': return '🎯';
      case 'variation': return '🔄';
      case 'mapping': return '📋';
      default: return '🔍';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          dir="rtl"
        />
        
        {isLoading && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="absolute z-10 w-full mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.cut.id}
                  onClick={() => handleSelectSuggestion(suggestion.cut)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{getMatchTypeIcon(suggestion.matchType)}</span>
                        <span className="font-medium text-gray-900">
                          {suggestion.cut.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({suggestion.cut.category})
                        </span>
                      </div>
                      
                      {suggestion.cut.cutType && (
                        <div className="text-xs text-gray-600">
                          {suggestion.cut.cutType}
                        </div>
                      )}
                      
                      {suggestion.cut.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {suggestion.cut.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-left">
                      <div className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                        {(suggestion.confidence * 100).toFixed(0)}%
                      </div>
                      {suggestion.cut.isPremium && (
                        <div className="text-xs text-yellow-600 mt-1">פרמיום</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {showCreateOption && (
                <div
                  onClick={handleCreateNew}
                  className="px-4 py-3 cursor-pointer border-t border-gray-200 hover:bg-gray-50 text-center"
                >
                  <div className="text-sm text-blue-600 font-medium">
                    ➕ צור נתח חדש: "{query}"
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              {isLoading ? 'מחפש...' : 'לא נמצאו תוצאות'}
              {showCreateOption && !isLoading && query.trim() && (
                <div
                  onClick={handleCreateNew}
                  className="mt-2 cursor-pointer text-blue-600 font-medium hover:underline"
                >
                  ➕ צור נתח חדש: "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
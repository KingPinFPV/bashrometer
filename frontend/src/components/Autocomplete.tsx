'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteOption {
  id: number;
  name: string;
  category?: string;
  type?: string;
}

interface AutocompleteProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string, selectedOption?: AutocompleteOption) => void;
  onSelect?: (option: AutocompleteOption) => void;
  endpoint: string; // 'meat-cuts' או 'brands'
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  minLength?: number;
  maxResults?: number;
  category?: string; // לסינון לפי קטגוריה
  type?: string; // לסינון לפי סוג
}

export default function Autocomplete({
  placeholder = 'התחל להקליד...',
  value = '',
  onChange,
  onSelect,
  endpoint,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  minLength = 1,
  maxResults = 10,
  category,
  type
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions function
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < minLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: maxResults.toString()
      });

      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/autocomplete/${endpoint}?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.data || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Autocomplete fetch error:', err);
      setError('שגיאה בטעינת ההצעות');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (option: AutocompleteOption) => {
    setInputValue(option.name);
    onChange(option.name, option);
    if (onSelect) {
      onSelect(option);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle blur (hide suggestions)
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Handle focus (show suggestions if input has value)
  const handleFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm ${
          disabled ? 'bg-slate-100 cursor-not-allowed' : ''
        } ${className}`}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute left-3 top-2.5">
          <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || error) && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {error ? (
            <li className="px-3 py-2 text-red-600 text-sm">
              {error}
            </li>
          ) : (
            suggestions.map((option, index) => (
              <li
                key={option.id}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-sky-50 border-b border-slate-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-sky-100' : ''
                }`}
                onClick={() => handleSuggestionSelect(option)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.name}</span>
                  {(option.category || option.type) && (
                    <span className="text-xs text-slate-500 flex-shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
                      {option.category || option.type}
                    </span>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && !error && suggestions.length === 0 && inputValue.trim().length >= minLength && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-slate-500 text-sm">
            לא נמצאו תוצאות עבור "{inputValue}"
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Retailer {
  id: number;
  name: string;
  type?: string | null;
  location?: string | null;
}

interface RetailerAutocompleteProps {
  placeholder?: string;
  value?: string;
  selectedRetailerId?: string;
  onChange: (retailerName: string, retailer?: Retailer) => void;
  onRetailerSelect?: (retailer: Retailer) => void;
  onNewRetailerRequest?: (retailerName: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  minLength?: number;
  maxResults?: number;
  allowNewRequests?: boolean;
}

export default function RetailerAutocomplete({
  placeholder = 'חפש קמעונאי...',
  value = '',
  selectedRetailerId = '',
  onChange,
  onRetailerSelect,
  onNewRetailerRequest,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  minLength = 2,
  maxResults = 10,
  allowNewRequests = false
}: RetailerAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Retailer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch retailers function
  const fetchRetailers = async (query: string) => {
    if (query.trim().length < minLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: query.trim(),
        limit: maxResults.toString()
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/retailers?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data.data || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Retailer autocomplete fetch error:', err);
      setError('שגיאה בטעינת הקמעונאים');
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
      fetchRetailers(query);
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

  // Handle retailer selection
  const handleRetailerSelect = (retailer: Retailer) => {
    setInputValue(retailer.name);
    onChange(retailer.name, retailer);
    if (onRetailerSelect) {
      onRetailerSelect(retailer);
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
          handleRetailerSelect(suggestions[selectedIndex]);
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
        className={`form-input ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${className}`}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute left-3 top-2.5">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || error) && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {error ? (
            <li className="px-3 py-2 text-red-600 text-sm">
              {error}
            </li>
          ) : (
            suggestions.map((retailer, index) => (
              <li
                key={retailer.id}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-primary-50 border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-primary-100' : ''
                } ${
                  selectedRetailerId === retailer.id.toString() ? 'bg-green-50 border-green-200' : ''
                }`}
                onClick={() => handleRetailerSelect(retailer)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{retailer.name}</span>
                  <div className="text-xs text-gray-600 flex-shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
                    {retailer.type && (
                      <span className="mr-2 rtl:ml-2 rtl:mr-0">{retailer.type}</span>
                    )}
                    {retailer.location && (
                      <span>{retailer.location}</span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {/* No results message with option to add new retailer */}
      {showSuggestions && !isLoading && !error && suggestions.length === 0 && inputValue.trim().length >= minLength && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-600 text-sm">
            לא נמצאו קמעונאים עבור "{inputValue}"
          </div>
          {allowNewRequests && onNewRetailerRequest && (
            <div className="border-t border-gray-300">
              <button
                type="button"
                onClick={() => {
                  onNewRetailerRequest(inputValue.trim());
                  setShowSuggestions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 focus:outline-none focus:bg-primary-50"
              >
                + בקש להוסיף קמעונאי חדש: "{inputValue.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id: number;
  name: string;
  brand?: string | null;
  category?: string | null;
  match_confidence?: number;
}

interface SearchSuggestion {
  suggestion: string;
  normalized_name: string;
  confidence_score: number;
  product_count: number;
}

interface ProductAutocompleteProps {
  placeholder?: string;
  value?: string;
  selectedProductId?: string;
  onChange: (productName: string, product?: Product) => void;
  onProductSelect?: (product: Product) => void;
  onNewProductRequest?: (productName: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  minLength?: number;
  maxResults?: number;
  allowNewRequests?: boolean;
}

export default function ProductAutocomplete({
  placeholder = 'חפש מוצר...',
  value = '',
  selectedProductId = '',
  onChange,
  onProductSelect,
  onNewProductRequest,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  minLength = 2,
  maxResults = 10,
  allowNewRequests = false
}: ProductAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'suggestions' | 'products'>('suggestions');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch search suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (query.trim().length < minLength) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.trim()
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/search-suggestions?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setSearchSuggestions(data.suggestions);
        setShowSearchSuggestions(true);
        setSearchMode('suggestions');
      } else {
        // If no suggestions, fallback to product search
        await fetchProducts(query);
      }
      
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Search suggestions fetch error:', err);
      // Fallback to product search on error
      await fetchProducts(query);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products using smart search
  const fetchProducts = async (query: string) => {
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/smart-search?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.products) {
        const products = data.products || [];
        // Products come pre-sorted by match_confidence from smart search
        setSuggestions(products);
        setShowSuggestions(true);
        setShowSearchSuggestions(false);
        setSearchMode('products');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Smart product search error:', err);
      setError('שגיאה בחיפוש מוצרים');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search (start with suggestions)
  const debouncedSearch = (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSearchSuggestions(query);
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
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setShowSearchSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle search suggestion selection
  const handleSearchSuggestionSelect = async (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.suggestion);
    onChange(suggestion.suggestion);
    setShowSearchSuggestions(false);
    setSelectedIndex(-1);
    
    // Now fetch products for this suggestion
    await fetchProducts(suggestion.suggestion);
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    const productDisplayName = `${product.name}${product.brand ? ` (${product.brand})` : ''}`;
    setInputValue(productDisplayName);
    onChange(productDisplayName, product);
    if (onProductSelect) {
      onProductSelect(product);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentList = searchMode === 'suggestions' ? searchSuggestions : suggestions;
    const hasItems = currentList.length > 0;
    const isShowingList = searchMode === 'suggestions' ? showSearchSuggestions : showSuggestions;
    
    if (!isShowingList || !hasItems) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentList.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentList.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentList.length) {
          if (searchMode === 'suggestions') {
            handleSearchSuggestionSelect(searchSuggestions[selectedIndex]);
          } else {
            handleProductSelect(suggestions[selectedIndex]);
          }
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setShowSearchSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle blur (hide suggestions)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setShowSearchSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Handle focus (show suggestions if input has value)
  const handleFocus = () => {
    if (inputValue.trim()) {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else if (searchSuggestions.length > 0) {
        setShowSearchSuggestions(true);
      }
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

      {/* Search suggestions dropdown */}
      {showSearchSuggestions && searchSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <li className="px-3 py-1 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
            הצעות חיפוש חכם
          </li>
          {searchSuggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.normalized_name}-${index}`}
              className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSearchSuggestionSelect(suggestion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="font-medium text-blue-700">{suggestion.suggestion}</span>
                  <div className="text-xs text-gray-500">
                    {suggestion.normalized_name} • {suggestion.product_count} מוצרים
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="bg-gray-100 px-1 rounded">
                    {Math.round(suggestion.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Product suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || error) && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {error ? (
            <li className="px-3 py-2 text-red-600 text-sm">
              {error}
            </li>
          ) : (
            <>
              <li className="px-3 py-1 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                מוצרים תואמים
              </li>
              {suggestions.map((product, index) => (
                <li
                  key={product.id}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-primary-50 border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-primary-100' : ''
                  } ${
                    selectedProductId === product.id.toString() ? 'bg-green-50 border-green-200' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 truncate">
                      <span className="font-medium">{product.name}</span>
                      {product.brand && (
                        <span className="text-gray-600 mr-2 rtl:ml-2 rtl:mr-0">({product.brand})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {product.match_confidence && (
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                          {Math.round(product.match_confidence * 100)}%
                        </span>
                      )}
                      {product.category && (
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </>
          )}
        </ul>
      )}

      {/* No results message with option to add new product */}
      {!isLoading && !error && !showSearchSuggestions && !showSuggestions && inputValue.trim().length >= minLength && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-gray-600 text-sm">
            לא נמצאו מוצרים עבור &quot;{inputValue}&quot;
          </div>
          {allowNewRequests && onNewProductRequest && (
            <div className="border-t border-gray-300">
              <button
                type="button"
                onClick={() => {
                  onNewProductRequest(inputValue.trim());
                  setShowSuggestions(false);
                  setShowSearchSuggestions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 focus:outline-none focus:bg-primary-50"
              >
                + בקש להוסיף מוצר חדש: &quot;{inputValue.trim()}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
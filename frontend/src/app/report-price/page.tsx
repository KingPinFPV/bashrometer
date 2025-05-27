// src/app/report-price/page.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  brand?: string;
  category?: string;
}

interface Retailer {
  id: number;
  name: string;
  address?: string;
}

export default function ReportPricePage() {
  const { user, token, authError, checkAuthStatus, clearAuthError } = useAuth();

  // Utility function to normalize product names
  const normalizeProductName = (name: string): string => {
    return name.trim()
      .replace(/אנטיקוט/g, 'אנטריקוט')  // Fix specific naming issue
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };
  
  // URL params for pre-filling
  // const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  // Form states
  const [productInput, setProductInput] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [retailerInput, setRetailerInput] = useState<string>('');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [regularPrice, setRegularPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [isOnSale, setIsOnSale] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('kg');
  
  // UI states
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Autocomplete states
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [retailerSuggestions, setRetailerSuggestions] = useState<Retailer[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [showRetailerDropdown, setShowRetailerDropdown] = useState<boolean>(false);
  
  // Side lists states
  const [meatCuts, setMeatCuts] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // New: all products for sidebar
  const [allRetailers, setAllRetailers] = useState<{id: number, name: string}[]>([]);
  const [selectedMeatCut, setSelectedMeatCut] = useState<string>('');
  const [selectedRetailerFromList, setSelectedRetailerFromList] = useState<{id: number, name: string} | null>(null);

  // New: Authentication state
  const [authValidated, setAuthValidated] = useState<boolean>(false);
  const [showAuthError, setShowAuthError] = useState<boolean>(false);
  
  // Refs for handling clicks outside dropdowns
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const retailerDropdownRef = useRef<HTMLDivElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // Initialize from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // Pre-fill product if provided
      const productId = params.get('productId');
      const productName = params.get('productName');
      
      if (productId && productName) {
        const product: Product = {
          id: parseInt(productId),
          name: decodeURIComponent(productName),
        };
        setSelectedProduct(product);
        setProductInput(product.name);
      }
    }
  }, []);

  // Load all products for sidebar synchronization
  const loadAllProducts = async () => {
    try {
      const response = await fetch(`${apiBase}/api/products?limit=200`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        const products = (data.data || []).map((p: Product) => ({
          ...p,
          name: normalizeProductName(p.name) // Normalize all product names
        }));
        setAllProducts(products);
        
        // Extract unique meat cuts from products
        const cuts = [...new Set(products
          .filter((p: Product) => p.category && p.category.includes('בקר'))
          .map((p: Product) => p.name)
        )].slice(0, 15); // Limit to 15 most common
        
        setMeatCuts(cuts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadAllRetailers = async () => {
    try {
      const response = await fetch(`${apiBase}/api/retailers?limit=100`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        const retailers = (data.data || []).map((r: {id: number, name: string}) => ({
          id: r.id,
          name: r.name
        }));
        setAllRetailers(retailers);
      }
    } catch (error) {
      console.error('Error loading retailers:', error);
    }
  };

  // Authentication check and data loading
  useEffect(() => {
    const initializeAuth = async () => {
      if (user && token) {
        const isValid = await checkAuthStatus();
        setAuthValidated(isValid);
        if (!isValid) {
          setShowAuthError(true);
        }
      } else if (!user) {
        setShowAuthError(true);
      }
    };

    const initData = async () => {
      await loadAllProducts(); // Load products first (includes meat cuts)
      await loadAllRetailers();
    };

    initializeAuth();
    initData();
  }, [user, token]); // Removed checkAuthStatus from dependencies to avoid infinite loops

  // Search products autocomplete
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/products?name_like=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProductSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  // Search retailers autocomplete
  const searchRetailers = async (query: string) => {
    if (query.length < 2) {
      setRetailerSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/retailers?name_like=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRetailerSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Error searching retailers:', error);
    }
  };

  // Handle product input change
  const handleProductInputChange = (value: string) => {
    setProductInput(value);
    setSelectedProduct(null);
    setShowProductDropdown(true);
    searchProducts(value);
  };

  // Handle retailer input change
  const handleRetailerInputChange = (value: string) => {
    setRetailerInput(value);
    setSelectedRetailer(null);
    setShowRetailerDropdown(true);
    searchRetailers(value);
  };

  // Improved product selection with validation
  const handleProductSelect = (product: Product) => {
    const normalizedProduct = {
      ...product,
      name: normalizeProductName(product.name)
    };
    setSelectedProduct(normalizedProduct);
    setProductInput(normalizedProduct.name);
    setShowProductDropdown(false);
    setProductSuggestions([]);
    clearAuthError(); // Clear any auth errors on successful selection
  };

  // Improved retailer selection with validation  
  const handleRetailerSelect = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setRetailerInput(retailer.name);
    setShowRetailerDropdown(false);
    setRetailerSuggestions([]);
    clearAuthError(); // Clear any auth errors on successful selection
  };

  // Handle meat cut selection from side list (find exact product match)
  const handleMeatCutSelect = (cutName: string) => {
    setSelectedMeatCut(cutName);
    setProductInput(cutName);
    
    // Find exact product match from allProducts
    const matchedProduct = allProducts.find(p => 
      normalizeProductName(p.name) === normalizeProductName(cutName)
    );
    
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
      setMessage(''); // Clear any validation errors
    } else {
      // If no exact match, search for suggestions
      searchProducts(cutName);
    }
  };

  // Handle retailer selection from side list with proper ID mapping
  const handleRetailerFromListSelect = (retailer: {id: number, name: string}) => {
    setSelectedRetailerFromList(retailer);
    setRetailerInput(retailer.name);
    setSelectedRetailer({
      id: retailer.id,
      name: retailer.name
    });
    setMessage(''); // Clear any validation errors
  };

  // Clear meat cut selection
  const clearMeatCutSelection = () => {
    setSelectedMeatCut('');
    if (selectedMeatCut === productInput) {
      setProductInput('');
      setSelectedProduct(null);
    }
  };

  // Clear retailer selection from list
  const clearRetailerFromListSelection = () => {
    setSelectedRetailerFromList(null);
    if (selectedRetailerFromList && selectedRetailerFromList.name === retailerInput) {
      setRetailerInput('');
      setSelectedRetailer(null);
    }
  };

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (retailerDropdownRef.current && !retailerDropdownRef.current.contains(event.target as Node)) {
        setShowRetailerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Improved form validation
  const validateForm = (): string | null => {
    if (!selectedProduct || !selectedProduct.id) {
      return 'אנא בחר מוצר מהרשימה או מהרשימה הצדדית.';
    }
    
    if (!selectedRetailer || !selectedRetailer.id) {
      return 'אנא בחר קמעונאי מהרשימה או מהרשימה הצדדית.';
    }
    
    if (!regularPrice || parseFloat(regularPrice) <= 0) {
      return 'אנא הזן מחיר רגיל תקין.';
    }

    if (isOnSale && (!salePrice || parseFloat(salePrice) <= 0)) {
      return 'אנא הזן מחיר מבצע תקין או בטל את סימון המבצע.';
    }

    if (isOnSale && parseFloat(salePrice) >= parseFloat(regularPrice)) {
      return 'מחיר המבצע חייב להיות נמוך ממחיר רגיל.';
    }

    if (!user || !user.id) {
      return 'אנא התחבר כדי לדווח על מחירים.';
    }

    if (!authValidated) {
      return 'יש בעיה באימות המשתמש. אנא התחבר מחדש.';
    }

    return null; // No validation errors
  };

  // Handle form submission with improved validation and auth
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Clear previous messages
    setMessage('');
    clearAuthError();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    // Double-check authentication before submission
    if (!await checkAuthStatus()) {
      setMessage('אימות נכשל. אנא התחבר מחדש.');
      return;
    }

    setIsSubmitting(true);

    try {
      const priceData = {
        product_id: selectedProduct.id,
        retailer_id: selectedRetailer.id,
        regular_price: parseFloat(regularPrice),
        sale_price: isOnSale && salePrice ? parseFloat(salePrice) : null,
        is_on_sale: isOnSale,
        unit_for_price: unit,
        quantity_for_price: parseFloat(quantity),
        notes: notes || null,
        source: 'user_report',
        report_type: 'price_update'
      };

      const response = await fetch(`${apiBase}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include auth token
        },
        credentials: 'include',
        body: JSON.stringify(priceData),
      });

      if (response.ok) {
        await response.json();
        setMessage('הדיווח נשלח בהצלחה! תודה רבה על התרומה לקהילה.');
        
        // Reset form
        setProductInput('');
        setSelectedProduct(null);
        setRetailerInput('');
        setSelectedRetailer(null);
        setRegularPrice('');
        setSalePrice('');
        setIsOnSale(false);
        setNotes('');
        setQuantity('1');
        setUnit('kg');
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'אירעה שגיאה בשליחת הדיווח. אנא נסה שוב.');
      }
    } catch (error) {
      console.error('Error submitting price report:', error);
      setMessage('אירעה שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Beautiful styling with consistent app theme
  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '3rem 2rem',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const mainLayoutStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 300px 300px',
    gap: '2rem',
    alignItems: 'start',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    padding: '2.5rem',
    transition: 'all 0.3s ease',
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  };

  const titleStyle = {
    fontSize: '2.5rem',
    lineHeight: '1.2',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem',
    textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
  };

  const subtitleStyle = {
    color: '#64748b',
    fontSize: '1.125rem',
    marginTop: '0.5rem',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    color: '#111827',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  // const inputFocusStyle = {
  //   ...inputStyle,
  //   borderColor: '#3b82f6',
  //   boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  //   outline: 'none',
  // };

  const buttonStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    background: isSubmitting 
      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isSubmitting 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      : '0 4px 14px 0 rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transform: 'translateY(0)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const checkboxStyle = {
    width: '1.25rem',
    height: '1.25rem',
    accentColor: '#3b82f6',
    marginLeft: '0.75rem',
  };

  const alertStyle = (isSuccess: boolean) => ({
    padding: '1rem',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '500',
    backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
    color: isSuccess ? '#166534' : '#991b1b',
    border: `2px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
    animation: 'slideUp 0.4s ease-out',
  });

  // Filtered products and retailers for side lists with normalization
  const filteredMeatCuts = meatCuts.filter(cut => 
    normalizeProductName(cut).toLowerCase().includes(normalizeProductName(productInput).toLowerCase())
  );
  
  const filteredRetailers = allRetailers.filter(retailer => 
    retailer.name.toLowerCase().includes(retailerInput.toLowerCase())
  );

  const sideListStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '1.5rem',
    padding: '1.5rem',
    maxHeight: '500px',
    overflowY: 'auto' as const,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
  };

  const sideListHeaderStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const sideListItemStyle = {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
  };

  const selectedItemStyle = {
    ...sideListItemStyle,
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const clearButtonStyle = {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '1.5rem',
    height: '1.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };


  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          outline: none !important;
        }
        textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
          outline: none !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px 0 rgba(59, 130, 246, 0.35) !important;
        }
        @media (max-width: 1200px) {
          .main-layout {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .side-lists {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 768px) {
          .side-lists {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div className="main-layout" style={mainLayoutStyle}>
        {/* Main Form */}
        <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{fontSize: '4rem', lineHeight: '1', marginBottom: '1rem'}}>🥩</div>
          <h1 style={titleStyle}>דיווח על מחיר חדש</h1>
          <p style={subtitleStyle}>עזור לקהילה על ידי שיתוף מחירים עדכניים</p>
          
          {/* Authentication Status Display */}
          {user && (
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'inline-block'
            }}>
              👤 מחובר כ: {user.name || user.email}
            </div>
          )}
          
          {/* Authentication Error Display */}
          {(authError || showAuthError) && (
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              cursor: 'pointer'
            }} onClick={() => {
              clearAuthError();
              setShowAuthError(false);
            }}>
              ⚠️ {authError || 'יש צורך בהתחברות למערכת'}
              <span style={{marginRight: '1rem', fontSize: '0.75rem'}}>לחץ כדי לסגור</span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Product Autocomplete */}
          <div ref={productDropdownRef} style={{position: 'relative'}}>
            <label htmlFor="product" style={labelStyle}>
              שם המוצר <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
            </label>
            <input
              type="text"
              id="product"
              value={productInput}
              onChange={(e) => handleProductInputChange(e.target.value)}
              placeholder="התחל להקליד שם מוצר..."
              style={{
                ...inputStyle,
                borderColor: selectedProduct ? '#10b981' : '#e5e7eb'
              }}
              required
            />
            
            {showProductDropdown && productSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 0.75rem 0.75rem',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {productSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{fontWeight: '500', color: '#111827'}}>
                      {product.name}
                    </div>
                    {product.brand && (
                      <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                        {product.brand}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retailer Autocomplete */}
          <div ref={retailerDropdownRef} style={{position: 'relative'}}>
            <label htmlFor="retailer" style={labelStyle}>
              שם הקמעונאי <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
            </label>
            <input
              type="text"
              id="retailer"
              value={retailerInput}
              onChange={(e) => handleRetailerInputChange(e.target.value)}
              placeholder="התחל להקליד שם קמעונאי..."
              style={{
                ...inputStyle,
                borderColor: selectedRetailer ? '#10b981' : '#e5e7eb'
              }}
              required
            />
            
            {showRetailerDropdown && retailerSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 0.75rem 0.75rem',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {retailerSuggestions.map((retailer) => (
                  <div
                    key={retailer.id}
                    onClick={() => handleRetailerSelect(retailer)}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{fontWeight: '500', color: '#111827'}}>
                      {retailer.name}
                    </div>
                    {retailer.address && (
                      <div style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem'}}>
                        {retailer.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity and Unit */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div>
              <label htmlFor="quantity" style={labelStyle}>
                כמות <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                step="0.1"
                min="0.1"
                placeholder="1"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="unit" style={labelStyle}>
                יחידה <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
              </label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={inputStyle}
                required
              >
                <option value="kg">קילוגרם (ק״ג)</option>
                <option value="100g">100 גרם</option>
                <option value="g">גרם</option>
                <option value="unit">יחידה</option>
                <option value="package">חבילה</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="regularPrice" style={labelStyle}>
              מחיר רגיל (₪) <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
            </label>
            <input
              type="number"
              id="regularPrice"
              value={regularPrice}
              onChange={(e) => setRegularPrice(e.target.value)}
              required
              step="0.01"
              min="0.01"
              placeholder="הזן מחיר במטבע ישראלי"
              style={inputStyle}
            />
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <input
              id="isOnSale"
              type="checkbox"
              checked={isOnSale}
              onChange={(e) => {
                setIsOnSale(e.target.checked);
                if (!e.target.checked) {
                  setSalePrice('');
                }
              }}
              style={checkboxStyle}
            />
            <label htmlFor="isOnSale" style={{...labelStyle, marginBottom: 0}}>
              מוצר זה במבצע?
            </label>
          </div>

          {isOnSale && (
            <div style={{animation: 'slideUp 0.4s ease-out'}}>
              <label htmlFor="salePrice" style={labelStyle}>
                מחיר מבצע (₪) <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
              </label>
              <input
                type="number"
                id="salePrice"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required={isOnSale}
                step="0.01"
                min="0.01"
                placeholder="הזן מחיר המבצע"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label htmlFor="notes" style={labelStyle}>
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="הוסף הערות נוספות כגון גודל מארז, תאריך תפוגה וכדומה..."
              style={{
                ...inputStyle,
                resize: 'vertical' as const,
                minHeight: '6rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {message && (
            <div style={alertStyle(message.includes('בהצלחה'))}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={buttonStyle}
          >
            {isSubmitting ? (
              <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                <div style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                שולח דיווח...
              </span>
            ) : (
              'שלח דיווח'
            )}
          </button>
        </form>
        </div>

        {/* Side Lists */}
        <div className="side-lists" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {/* Meat Cuts List */}
          <div style={sideListStyle}>
            <div style={sideListHeaderStyle}>
              <span>🥩</span>
              <span>נתחי בשר</span>
            </div>
            
            {/* Selected meat cut */}
            {selectedMeatCut && (
              <div style={selectedItemStyle}>
                <span>{selectedMeatCut}</span>
                <button
                  onClick={clearMeatCutSelection}
                  style={clearButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Available meat cuts */}
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
              {filteredMeatCuts
                .filter(cut => cut !== selectedMeatCut)
                .map((cut) => (
                  <div
                    key={cut}
                    onClick={() => handleMeatCutSelect(cut)}
                    style={sideListItemStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {cut}
                  </div>
                ))}
              
              {filteredMeatCuts.length === 0 && productInput && (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}>
                  לא נמצאו נתחים תואמים
                </div>
              )}
            </div>
          </div>

          {/* Retailers List */}
          <div style={sideListStyle}>
            <div style={sideListHeaderStyle}>
              <span>🏪</span>
              <span>קמעונאים</span>
            </div>
            
            {/* Selected retailer */}
            {selectedRetailerFromList && (
              <div style={selectedItemStyle}>
                <span>{selectedRetailerFromList.name}</span>
                <button
                  onClick={clearRetailerFromListSelection}
                  style={clearButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Available retailers */}
            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
              {filteredRetailers
                .filter(retailer => !selectedRetailerFromList || retailer.id !== selectedRetailerFromList.id)
                .map((retailer) => (
                  <div
                    key={retailer.id}
                    onClick={() => handleRetailerFromListSelect(retailer)}
                    style={sideListItemStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {retailer.name}
                  </div>
                ))}
              
              {filteredRetailers.length === 0 && retailerInput && (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                }}>
                  לא נמצאו קמעונאים תואמים
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
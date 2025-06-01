// src/app/report-price/page.tsx
"use client";

import { useState, FormEvent, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReport } from '@/contexts/ReportContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddRetailerModal } from '@/components/AddRetailerModal';

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

interface Cut {
  id: number;
  hebrew_name: string;
  english_name?: string;
  category: string;
  description?: string;
}

export default function ReportPricePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען טופס דיווח מחיר...</p>
        </div>
      </div>
    }>
      <ReportPriceContent />
    </Suspense>
  );
}

function ReportPriceContent() {
  const { user, token, authError, checkAuthStatus, clearAuthError } = useAuth();
  const { selectedProduct, selectedRetailer, returnPath, navigateBack, clearSelection } = useReport();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Utility function to normalize product names
  const normalizeProductName = (name: string): string => {
    return name.trim()
      .replace(/אנטיקוט/g, 'אנטריקוט')  // Fix specific naming issue
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };
  
  // Form states
  const [productInput, setProductInput] = useState<string>('');
  const [localSelectedProduct, setLocalSelectedProduct] = useState<Product | null>(null);
  const [retailerInput, setRetailerInput] = useState<string>('');
  const [localSelectedRetailer, setLocalSelectedRetailer] = useState<Retailer | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('kg');
  
  // Simplified price states
  const [price, setPrice] = useState<string>(''); // המחיר הבסיסי
  const [isOnSale, setIsOnSale] = useState<boolean>(false); // האם במבצע
  const [salePrice, setSalePrice] = useState<string>(''); // מחיר מבצע
  const [saleEndDate, setSaleEndDate] = useState<string>(''); // תוקף
  
  // REMOVED: Product creation functionality - users should use /add-product page instead
  
  // UI states
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  
  // Autocomplete states
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [retailerSuggestions, setRetailerSuggestions] = useState<Retailer[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [showRetailerDropdown, setShowRetailerDropdown] = useState<boolean>(false);
  // REMOVED: Cut suggestions - no longer needed

  // New: Authentication state
  const [authValidated, setAuthValidated] = useState<boolean>(false);
  const [showAuthError, setShowAuthError] = useState<boolean>(false);
  
  // Modal state
  const [showAddRetailerModal, setShowAddRetailerModal] = useState<boolean>(false);
  
  // Refs for handling clicks outside dropdowns
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const retailerDropdownRef = useRef<HTMLDivElement>(null);
  // REMOVED: cutDropdownRef - no longer needed

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // Initialize from ReportContext or URL params
  useEffect(() => {
    // Check for edit mode from URL parameters first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      
      if (mode === 'edit') {
        console.log('🔄 Pre-loading price data from URL params for editing');
        
        // Extract product data
        const productId = params.get('productId');
        const productName = params.get('productName');
        
        if (productId && productName) {
          const product: Product = {
            id: parseInt(productId),
            name: decodeURIComponent(productName),
          };
          setLocalSelectedProduct(product);
          setProductInput(product.name);
        }
        
        // Extract retailer data
        const retailerId = params.get('retailerId');
        const retailerName = params.get('retailerName');
        
        if (retailerId && retailerName) {
          const retailer: Retailer = {
            id: parseInt(retailerId),
            name: decodeURIComponent(retailerName),
          };
          setLocalSelectedRetailer(retailer);
          setRetailerInput(retailer.name);
        }
        
        // Extract and pre-fill price data
        const priceParam = params.get('price');
        const salePriceParam = params.get('salePrice');
        const isOnSaleParam = params.get('isOnSale');
        const saleEndDateParam = params.get('saleEndDate');
        const quantityParam = params.get('quantity');
        const unitParam = params.get('unit');
        const notesParam = params.get('notes');
        
        if (priceParam) setPrice(priceParam);
        if (salePriceParam) setSalePrice(salePriceParam);
        if (isOnSaleParam) setIsOnSale(isOnSaleParam === 'true');
        if (saleEndDateParam) setSaleEndDate(saleEndDateParam);
        if (quantityParam) setQuantity(quantityParam);
        if (unitParam) setUnit(unitParam);
        if (notesParam) setNotes(decodeURIComponent(notesParam));
        
        console.log('✅ Price data pre-loaded from URL params:', {
          price: priceParam,
          salePrice: salePriceParam,
          isOnSale: isOnSaleParam,
          quantity: quantityParam,
          unit: unitParam
        });
        
        return; // Skip other initialization if in edit mode
      }
    }
    
    // Priority 1: ReportContext data (smart navigation)
    if (selectedProduct) {
      setLocalSelectedProduct(selectedProduct);
      setProductInput(selectedProduct.name);
    }
    
    if (selectedRetailer) {
      setLocalSelectedRetailer(selectedRetailer);
      setRetailerInput(selectedRetailer.name);
    }
    
    // Priority 2: URL params (fallback for legacy links)
    if (!selectedProduct && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      const productId = params.get('productId');
      const productName = params.get('productName');
      
      if (productId && productName) {
        const product: Product = {
          id: parseInt(productId),
          name: decodeURIComponent(productName),
        };
        setLocalSelectedProduct(product);
        setProductInput(product.name);
      }
    }
  }, [selectedProduct, selectedRetailer]);

  // Load current prices when both product and retailer are selected
  useEffect(() => {
    const loadCurrentPrices = async () => {
      if (!localSelectedProduct?.id || !localSelectedRetailer?.id || !token) {
        return;
      }

      try {
        console.log('🔍 Loading current prices for pre-filling:', {
          productId: localSelectedProduct.id,
          retailerId: localSelectedRetailer.id
        });

        const response = await fetch(
          `${apiBase}/api/prices/current/${localSelectedProduct.id}?retailer_id=${localSelectedRetailer.id}`,
          {
            credentials: 'include',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Current prices data:', data);
          
          // Pre-fill with the most recent price from this retailer
          if (data.prices && data.prices.length > 0) {
            const latestPrice = data.prices.find(p => p.retailer_id === localSelectedRetailer.id) || data.prices[0];
            
            if (latestPrice) {
              console.log('✅ Pre-filling with latest price:', latestPrice);
              
              // Pre-fill form fields
              setPrice(latestPrice.regular_price?.toString() || '');
              setQuantity(latestPrice.quantity_for_price?.toString() || '1');
              setUnit(latestPrice.unit_for_price || 'kg');
              
              // Pre-fill sale information if exists
              if (latestPrice.is_currently_on_sale && latestPrice.sale_price) {
                setIsOnSale(true);
                setSalePrice(latestPrice.sale_price.toString());
                if (latestPrice.sale_end_date) {
                  setSaleEndDate(latestPrice.sale_end_date.split('T')[0]); // Convert to YYYY-MM-DD format
                }
              }
              
              // Pre-fill notes if exists
              if (latestPrice.notes) {
                setNotes(latestPrice.notes);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading current prices for pre-filling:', error);
        // Don't show error to user, this is just a nice-to-have feature
      }
    };

    loadCurrentPrices();
  }, [localSelectedProduct?.id, localSelectedRetailer?.id, token, apiBase]);

  // Enhanced auth check
  useEffect(() => {
    const validateAuth = async () => {
      if (!user || !token) {
        setShowAuthError(true);
        return;
      }

      try {
        const isValid = await checkAuthStatus();
        if (!isValid && authError) {
          setShowAuthError(true);
        } else {
          setAuthValidated(true);
          setShowAuthError(false);
          clearAuthError();
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        setShowAuthError(true);
      }
    };

    validateAuth();
  }, [user, token, authError, checkAuthStatus, clearAuthError]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (retailerDropdownRef.current && !retailerDropdownRef.current.contains(event.target as Node)) {
        setShowRetailerDropdown(false);
      }
      // REMOVED: Cut dropdown handling - no longer needed
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch product suggestions
  const fetchProductSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setProductSuggestions([]);
      return;
    }

    try {
      const normalizedQuery = normalizeProductName(query);
      const response = await fetch(
        `${apiBase}/api/autocomplete/products?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
        {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const suggestions = await response.json();
        setProductSuggestions(suggestions);
        setShowProductDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
    }
  };

  // Fetch retailer suggestions
  const fetchRetailerSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setRetailerSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${apiBase}/api/autocomplete/retailers?q=${encodeURIComponent(query)}&limit=8`,
        {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const suggestions = await response.json();
        setRetailerSuggestions(suggestions);
        setShowRetailerDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching retailer suggestions:', error);
    }
  };

  // Handle product input change
  const handleProductInputChange = (value: string) => {
    setProductInput(value);
    setLocalSelectedProduct(null);
    
    if (value.trim().length >= 2) {
      fetchProductSuggestions(value);
    } else {
      setProductSuggestions([]);
      setShowProductDropdown(false);
    }
    
    // REMOVED: Product creation logic - users should use /add-product page instead
  };

  // Handle retailer input change
  const handleRetailerInputChange = (value: string) => {
    setRetailerInput(value);
    setLocalSelectedRetailer(null);
    
    if (value.trim().length >= 2) {
      fetchRetailerSuggestions(value);
    } else {
      setRetailerSuggestions([]);
      setShowRetailerDropdown(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setLocalSelectedProduct(product);
    setProductInput(product.name);
    setShowProductDropdown(false);
  };

  // Handle retailer selection
  const handleRetailerSelect = (retailer: Retailer) => {
    setLocalSelectedRetailer(retailer);
    setRetailerInput(retailer.name);
    setShowRetailerDropdown(false);
  };

  // Handle new retailer added from modal
  const handleRetailerAdded = (retailer: { id: number; name: string; address?: string }) => {
    const newRetailer: Retailer = {
      id: retailer.id,
      name: retailer.name,
      address: retailer.address
    };
    setLocalSelectedRetailer(newRetailer);
    setRetailerInput(newRetailer.name);
    setShowAddRetailerModal(false);
  };

  // REMOVED: Cut search and selection handlers - no longer needed for price reporting

  // Calculate savings
  const calculateSavings = () => {
    if (!isOnSale || !price || !salePrice) return { amount: 0, percentage: 0 };
    
    const original = parseFloat(price);
    const sale = parseFloat(salePrice);
    const amount = original - sale;
    const percentage = ((amount / original) * 100);
    
    return { amount, percentage };
  };

  // Reset form function
  const resetForm = () => {
    setProductInput('');
    setLocalSelectedProduct(null);
    setRetailerInput('');
    setLocalSelectedRetailer(null);
    setNotes('');
    setQuantity('1');
    setUnit('kg');
    setMessage('');
    
    // Reset simplified price states
    setPrice('');
    setIsOnSale(false);
    setSalePrice('');
    setSaleEndDate('');
    
    // REMOVED: Product creation reset - no longer needed
    
    clearSelection(); // Clear ReportContext as well
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Enhanced validation
    if (!localSelectedProduct && !productInput) {
      setMessage('נא למלא את שם המוצר');
      setIsSubmitting(false);
      return;
    }
    
    if (!localSelectedRetailer && !retailerInput) {
      setMessage('נא למלא את שם הקמעונאי');
      setIsSubmitting(false);
      return;
    }
    
    if (!price || parseFloat(price) <= 0) {
      setMessage('נא להזין מחיר תקין (גדול מ-0)');
      setIsSubmitting(false);
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setMessage('נא להזין כמות תקינה (גדולה מ-0)');
      setIsSubmitting(false);
      return;
    }

    if (isOnSale) {
      if (!salePrice || parseFloat(salePrice) <= 0) {
        setMessage('נא להזין מחיר מבצע תקין');
        setIsSubmitting(false);
        return;
      }
      
      if (parseFloat(salePrice) >= parseFloat(price)) {
        setMessage('מחיר המבצע חייב להיות נמוך מהמחיר הרגיל');
        setIsSubmitting(false);
        return;
      }
      
      if (!saleEndDate) {
        setMessage('נא להזין תאריך סיום המבצע');
        setIsSubmitting(false);
        return;
      }
      
      const saleDate = new Date(saleEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (saleDate < today) {
        setMessage('תאריך סיום המבצע חייב להיות בעתיד');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const priceData = {
        // Handle both new and legacy formats
        ...(localSelectedProduct?.id ? {
          product_id: localSelectedProduct.id,
          retailer_id: localSelectedRetailer?.id,
          // Legacy format field names for existing products
          regular_price: parseFloat(price),
          unit_for_price: unit,
          quantity_for_price: parseFloat(quantity)
        } : {
          // New format for product/retailer creation
          product_name: localSelectedProduct?.name || productInput,
          retailer_name: localSelectedRetailer?.name || retailerInput,
          price: parseFloat(price), // Note: 'price' for new format
          unit: unit,
          quantity: parseFloat(quantity)
        }),
        
        notes: notes.trim() || null,
        
        // Standardized sale price fields
        is_on_sale: isOnSale,
        sale_price: isOnSale ? parseFloat(salePrice) : null,
        price_valid_to: isOnSale ? saleEndDate : null
        
        // REMOVED: Product creation data - no longer supported in price reporting
      };

      console.log('📊 Submitting price data:', priceData);

      const response = await fetch(`${apiBase}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(priceData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowSuccessMessage(true);

        // Smart navigation logic based on ReportContext
        const hasReturnPath = returnPath && returnPath !== '/';
        
        if (hasReturnPath) {
          setMessage("הדיווח נשלח בהצלחה! ✅ חוזר לדף הקודם...");
          setTimeout(() => {
            navigateBack();
          }, 2000);
        } else {
          // Legacy fallback for URL-based navigation
          const fromProduct = searchParams.get('from') === 'product' || 
                             (typeof window !== 'undefined' && document.referrer.includes('/products/'));
          
          if (fromProduct) {
            setMessage("הדיווח נשלח בהצלחה! ✅");
            setTimeout(() => {
              router.back();
            }, 2000);
          } else {
            setMessage("הדיווח נשלח בהצלחה! ✅ אפשר לדווח על מוצר נוסף");
            setTimeout(() => {
              resetForm();
              setShowSuccessMessage(false);
            }, 3000);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('🚨 Price submission error:', errorData);
        
        let errorMessage = 'אירעה שגיאה בשליחת הדיווח. אנא נסה שוב.';
        
        if (errorData.details) {
          errorMessage = `שגיאה: ${errorData.details}`;
        } else if (errorData.error) {
          errorMessage = `שגיאה: ${errorData.error}`;
        }
        
        setMessage(errorMessage);
      }
    } catch (error: any) {
      console.error('🚨 Error submitting price report:', error);
      
      let errorMessage = 'אירעה שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.';
      
      if (error.response?.data?.details) {
        errorMessage = `שגיאה: ${error.response.data.details}`;
      } else if (error.response?.data?.error) {
        errorMessage = `שגיאה: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `שגיאה: ${error.message}`;
      }
      
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authentication error display
  if (showAuthError) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '2rem',
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '1rem' 
          }}>
            נדרשת התחברות
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            כדי לדווח על מחירים, אנא התחבר לחשבון שלך.
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            התחבר עכשיו
          </button>
        </div>
      </div>
    );
  }

  // Styling
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '800px',
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
    width: '100%',
    maxWidth: '600px',
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

  const checkboxStyle = {
    width: '1.25rem',
    height: '1.25rem',
    accentColor: '#3b82f6',
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    border: 'none',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
    transform: 'translateY(0)',
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={mainLayoutStyle}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            {returnPath && returnPath !== '/' && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  onClick={navigateBack}
                  style={{
                    background: 'none',
                    border: '2px solid #e5e7eb',
                    color: '#6b7280',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.color = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  ← חזור
                </button>
              </div>
            )}
            <h1 style={titleStyle}>💰 דיווח מחיר</h1>
            <p style={subtitleStyle}>
              עזור לקהילה על ידי דיווח על מחירי בשר עדכניים
            </p>
          </div>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'center',
              backgroundColor: showSuccessMessage ? '#dcfce7' : '#fef2f2',
              color: showSuccessMessage ? '#166534' : '#dc2626',
              border: `1px solid ${showSuccessMessage ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {message}
            </div>
          )}
        
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
                  borderColor: localSelectedProduct ? '#10b981' : '#e5e7eb'
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="retailer" style={labelStyle}>
                  שם הקמעונאי <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddRetailerModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ➕ הוסף קמעונאי
                </button>
              </div>
              <input
                type="text"
                id="retailer"
                value={retailerInput}
                onChange={(e) => handleRetailerInputChange(e.target.value)}
                placeholder="התחל להקליד שם קמעונאי..."
                style={{
                  ...inputStyle,
                  borderColor: localSelectedRetailer ? '#10b981' : '#e5e7eb'
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

            {/* Product Creation Removed - Use Dedicated Add Product Page */}
            {!localSelectedProduct && productInput && productInput.length >= 3 && productSuggestions.length === 0 && (
              <div style={{
                border: '2px solid #fbbf24',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                backgroundColor: '#fef3c7',
                marginTop: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ℹ️ המוצר לא נמצא במערכת
                </h3>
                <p style={{
                  color: '#92400e',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  לא נמצאו תוצאות עבור "{productInput}". כדי להוסיף מוצר חדש למערכת, אנא השתמש בדף ייעודי להוספת מוצרים.
                </p>
                <a
                  href="/add-product"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ➕ הוסף מוצר חדש
                </a>
              </div>
            )}

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

            {/* Simplified Price Section */}
            <div className="space-y-4">
              {/* Basic Price */}
              <div>
                <label htmlFor="price" style={labelStyle}>
                  מחיר (₪) <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>

              {/* Is On Sale Checkbox */}
              <div>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={isOnSale}
                    onChange={(e) => {
                      setIsOnSale(e.target.checked);
                      if (!e.target.checked) {
                        setSalePrice('');
                        setSaleEndDate('');
                      }
                    }}
                    style={{...checkboxStyle, marginLeft: '0.5rem'}}
                  />
                  <span>המוצר במבצע</span>
                </label>
              </div>

              {/* Sale Fields - Only if checked */}
              {isOnSale && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #fbbf24',
                  marginTop: '1rem'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#92400e'
                  }}>
                    פרטי מבצע:
                  </h4>
                  
                  <div style={{marginBottom: '1rem'}}>
                    <label htmlFor="salePrice" style={labelStyle}>
                      מחיר במבצע (₪) <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
                    </label>
                    <input
                      type="number"
                      id="salePrice"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="מחיר אחרי הנחה"
                      style={inputStyle}
                    />
                  </div>
                  
                  <div style={{marginBottom: '1rem'}}>
                    <label htmlFor="saleEndDate" style={labelStyle}>
                      תוקף מבצע עד <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
                    </label>
                    <input
                      type="date"
                      id="saleEndDate"
                      value={saleEndDate}
                      onChange={(e) => setSaleEndDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      style={inputStyle}
                    />
                  </div>
                  
                  {/* Show savings */}
                  {price && salePrice && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#166534',
                      backgroundColor: '#dcfce7',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      חיסכון: ₪{(parseFloat(price) - parseFloat(salePrice)).toFixed(2)} 
                      ({Math.round((1 - parseFloat(salePrice) / parseFloat(price)) * 100)}% הנחה)
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" style={labelStyle}>
                הערות (אופציונלי)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות על המוצר או המחיר..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '80px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={isSubmitting ? disabledButtonStyle : buttonStyle}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(59, 130, 246, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.25)';
                }
              }}
            >
              {isSubmitting ? '📤 שולח דיווח...' : '🚀 שלח דיווח'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Add Retailer Modal */}
      <AddRetailerModal
        isOpen={showAddRetailerModal}
        onClose={() => setShowAddRetailerModal(false)}
        onRetailerAdded={handleRetailerAdded}
      />
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
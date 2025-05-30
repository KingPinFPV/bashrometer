"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface Product {
  id: number;
  name: string;
  category: string;
  cut?: string;
  brand?: string;
}

export interface Retailer {
  id: number;
  name: string;
  location?: string;
  chain?: string;
}

interface ReportContextType {
  // Pre-filled data for report form
  selectedProduct: Product | null;
  selectedRetailer: Retailer | null;
  returnPath: string;
  
  // Actions
  setSelectedProduct: (product: Product | null) => void;
  setSelectedRetailer: (retailer: Retailer | null) => void;
  setReturnPath: (path: string) => void;
  
  // Smart navigation functions
  navigateToReport: (product?: Product, retailer?: Retailer, fromPath?: string) => void;
  navigateBack: () => void;
  clearSelection: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [returnPath, setReturnPath] = useState<string>('/');
  const router = useRouter();

  const navigateToReport = (
    product?: Product, 
    retailer?: Retailer, 
    fromPath?: string
  ) => {
    // Set pre-filled data
    if (product) setSelectedProduct(product);
    if (retailer) setSelectedRetailer(retailer);
    if (fromPath) setReturnPath(fromPath);
    
    // Navigate to report page
    router.push('/report-price');
  };

  const navigateBack = () => {
    // Clear selections
    clearSelection();
    
    // Navigate back to return path
    router.push(returnPath);
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSelectedRetailer(null);
    setReturnPath('/');
  };

  return (
    <ReportContext.Provider value={{
      selectedProduct,
      selectedRetailer,
      returnPath,
      setSelectedProduct,
      setSelectedRetailer,
      setReturnPath,
      navigateToReport,
      navigateBack,
      clearSelection
    }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};
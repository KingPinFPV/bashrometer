// frontend/src/utils/formHelpers.ts
// Standardized form utilities for consistent validation and error handling

export interface ApiError {
  error?: string;
  details?: string;
  message?: string;
}

export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Standardized error message extraction from API responses
 */
export const extractErrorMessage = (error: any, defaultMessage: string = 'אירעה שגיאה'): string => {
  console.error('🚨 API Error:', error);
  
  // Handle fetch response errors
  if (error.response?.data) {
    const errorData = error.response.data;
    if (errorData.details) return `שגיאה: ${errorData.details}`;
    if (errorData.error) return `שגיאה: ${errorData.error}`;
    if (errorData.message) return `שגיאה: ${errorData.message}`;
  }
  
  // Handle direct error objects
  if (error.details) return `שגיאה: ${error.details}`;
  if (error.error) return `שגיאה: ${error.error}`;
  if (error.message) return `שגיאה: ${error.message}`;
  
  return defaultMessage;
};

/**
 * Standardized form submission handler
 */
export const submitForm = async (
  url: string,
  data: any,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    token?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<FormSubmissionResult> => {
  const { method = 'POST', token, headers = {} } = options;
  
  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`📤 Submitting form to ${url}:`, data);
    
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: JSON.stringify(data),
      credentials: 'include'
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Form submission successful:', responseData);
      return {
        success: true,
        data: responseData
      };
    } else {
      const errorMessage = extractErrorMessage(responseData, 'שגיאה בשליחת הטופס');
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    const errorMessage = extractErrorMessage(error, 'שגיאת רשת - בדוק את החיבור ונסה שוב');
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Common form validation rules
 */
export const validators = {
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} הוא שדה חובה`;
    }
    return null;
  },
  
  email: (value: string) => {
    if (value && !/\S+@\S+\.\S+/.test(value)) {
      return 'כתובת אימייל לא תקינה';
    }
    return null;
  },
  
  minLength: (value: string, minLength: number, fieldName: string) => {
    if (value && value.length < minLength) {
      return `${fieldName} חייב להכיל לפחות ${minLength} תווים`;
    }
    return null;
  },
  
  maxLength: (value: string, maxLength: number, fieldName: string) => {
    if (value && value.length > maxLength) {
      return `${fieldName} לא יכול להכיל יותר מ-${maxLength} תווים`;
    }
    return null;
  },
  
  number: (value: any, fieldName: string) => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} חייב להיות מספר תקין`;
    }
    return null;
  },
  
  positiveNumber: (value: any, fieldName: string) => {
    const numValue = Number(value);
    if (value && (isNaN(numValue) || numValue <= 0)) {
      return `${fieldName} חייב להיות מספר חיובי`;
    }
    return null;
  },
  
  url: (value: string) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return 'כתובת URL לא תקינה (חייבת להתחיל ב-http:// או https://)';
    }
    return null;
  },
  
  phone: (value: string) => {
    if (value && !/^[\d\-\+\(\)\s]+$/.test(value)) {
      return 'מספר טלפון לא תקין';
    }
    return null;
  }
};

/**
 * Run multiple validators on a single field
 */
export const validateField = (value: any, fieldValidators: Array<() => string | null>): string | null => {
  for (const validator of fieldValidators) {
    const error = validator();
    if (error) return error;
  }
  return null;
};

/**
 * Validate entire form object
 */
export const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, Array<() => string | null>>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(validationRules).forEach(([fieldName, fieldValidators]) => {
    const error = validateField(formData[fieldName], fieldValidators);
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return errors;
};

/**
 * Clean form data by trimming strings and converting empty strings to null
 */
export const cleanFormData = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      cleaned[key] = trimmed === '' ? null : trimmed;
    } else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

/**
 * Standard form state management hook
 */
export const useFormState = <T extends Record<string, any>>(initialData: T) => {
  const [formData, setFormData] = React.useState<T>(initialData);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  
  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };
  
  const resetForm = () => {
    setFormData(initialData);
    setError(null);
    setFieldErrors({});
    setLoading(false);
  };
  
  const setFormError = (error: string) => {
    setError(error);
    setLoading(false);
  };
  
  const setFormFieldErrors = (errors: Record<string, string>) => {
    setFieldErrors(errors);
    setLoading(false);
  };
  
  return {
    formData,
    setFormData,
    loading,
    setLoading,
    error,
    setError: setFormError,
    fieldErrors,
    setFieldErrors: setFormFieldErrors,
    updateField,
    resetForm
  };
};

// Import React for the hook
import React from 'react';
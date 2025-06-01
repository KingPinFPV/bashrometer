// frontend/src/components/ui/FormErrorDisplay.tsx
// Standardized error display component for forms

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FormErrorDisplayProps {
  error?: string | null;
  success?: string | null;
  className?: string;
}

export const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  error,
  success,
  className = ''
}) => {
  if (!error && !success) return null;

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div className="mr-3">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="mr-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

interface FieldErrorDisplayProps {
  error?: string;
  className?: string;
}

export const FieldErrorDisplay: React.FC<FieldErrorDisplayProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>{error}</p>
  );
};

export default FormErrorDisplay;
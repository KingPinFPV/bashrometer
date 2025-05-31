'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export default function StepIndicator({ 
  steps, 
  currentStep, 
  completedSteps, 
  className = '' 
}: StepIndicatorProps) {
  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const currentIndex = getCurrentStepIndex();

  return (
    <div className={`${className}`}>
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isUpcoming = index > currentIndex;

            return (
              <li key={step.id} className={`relative ${index < steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-4 right-4 -mr-px h-0.5 w-full bg-gray-200" aria-hidden="true">
                    <div 
                      className={`h-0.5 transition-all duration-300 ${
                        isCompleted || currentIndex > index ? 'bg-blue-600' : 'bg-gray-200'
                      }`} 
                      style={{ width: isCompleted || currentIndex > index ? '100%' : '0%' }}
                    />
                  </div>
                )}
                
                <div className="relative flex items-start">
                  <span className="h-9 flex items-center">
                    <span
                      className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${
                        isCompleted
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : isUpcoming
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </span>
                  </span>
                  <span className="mr-4 min-w-0 flex flex-col">
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-sm text-gray-500">{step.description}</span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
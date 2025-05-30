"use client";

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AddRetailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetailerAdded: (retailer: { id: number; name: string; address?: string }) => void;
}

export const AddRetailerModal: React.FC<AddRetailerModalProps> = ({
  isOpen,
  onClose,
  onRetailerAdded
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    chain: '',
    location: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const resetForm = () => {
    setFormData({
      name: '',
      chain: '',
      location: '',
      address: '',
      notes: ''
    });
    setMessage('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const retailerData = {
        name: formData.name.trim(),
        chain: formData.chain.trim() || null,
        location: formData.location.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null
      };

      const response = await fetch(`${apiBase}/api/retailers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(retailerData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowSuccess(true);
        setMessage('הקמעונאי נוסף בהצלחה! ✅');
        
        // Pass the new retailer back to parent
        onRetailerAdded({
          id: result.id || result.retailer_id,
          name: result.name,
          address: result.address
        });

        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'אירעה שגיאה בהוספת הקמעונאי. אנא נסה שוב.');
      }
    } catch (error) {
      console.error('Error adding retailer:', error);
      setMessage('אירעה שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '1.5rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    color: '#6b7280',
    fontSize: '0.875rem'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    color: '#111827',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  };

  const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    color: '#6b7280',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: '2px solid #e5e7eb',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>🏪 הוסף קמעונאי חדש</h2>
          <p style={subtitleStyle}>
            הוסף קמעונאי שלא קיים במערכת
          </p>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            textAlign: 'center',
            backgroundColor: showSuccess ? '#dcfce7' : '#fef2f2',
            color: showSuccess ? '#166534' : '#dc2626',
            border: `1px solid ${showSuccess ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label htmlFor="retailerName" style={labelStyle}>
              שם הקמעונאי <span style={{color: '#ef4444', fontWeight: 'bold'}}>*</span>
            </label>
            <input
              type="text"
              id="retailerName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="לדוגמה: שופרסל סניף תל אביב"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="chain" style={labelStyle}>
              שם הרשת (אופציונלי)
            </label>
            <input
              type="text"
              id="chain"
              value={formData.chain}
              onChange={(e) => setFormData(prev => ({ ...prev, chain: e.target.value }))}
              placeholder="לדוגמה: שופרסל"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="location" style={labelStyle}>
              עיר/אזור (אופציונלי)
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="לדוגמה: תל אביב"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="address" style={labelStyle}>
              כתובת מלאה (אופציונלי)
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="לדוגמה: רחוב דיזנגוף 50, תל אביב"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="notes" style={labelStyle}>
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="הערות נוספות על הקמעונאי..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              style={isSubmitting || !formData.name.trim() ? disabledButtonStyle : buttonStyle}
              onMouseEnter={(e) => {
                if (!isSubmitting && formData.name.trim()) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && formData.name.trim()) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isSubmitting ? '⏳ מוסיף...' : '✅ הוסף קמעונאי'}
            </button>
            
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.color = '#3b82f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
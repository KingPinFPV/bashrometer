// src/components/AdminCutsManager.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Cut {
  id: number;
  hebrew_name: string;
  english_name?: string;
  category: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewCut {
  hebrew_name: string;
  english_name: string;
  category: string;
  description: string;
}

export default function AdminCutsManager() {
  const { token } = useAuth();
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCut, setEditingCut] = useState<Cut | null>(null);
  const [formData, setFormData] = useState<NewCut>({
    hebrew_name: '',
    english_name: '',
    category: '',
    description: ''
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchCuts();
    fetchCategories();
  }, []);

  const fetchCuts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/cuts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCuts(data);
      } else {
        setError('שגיאה בטעינת רשימת הנתחים');
      }
    } catch (err) {
      setError('שגיאת רשת בטעינת הנתחים');
      console.error('Error fetching cuts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiBase}/api/cuts/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const url = editingCut ? `${apiBase}/api/cuts/${editingCut.id}` : `${apiBase}/api/cuts`;
      const method = editingCut ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(editingCut ? 'נתח עודכן בהצלחה!' : 'נתח נוסף בהצלחה!');
        resetForm();
        fetchCuts();
        fetchCategories(); // Refresh categories in case a new one was added
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'שגיאה בשמירת הנתח');
      }
    } catch (err) {
      setError('שגיאת רשת בשמירת הנתח');
      console.error('Error saving cut:', err);
    }
  };

  const handleEdit = (cut: Cut) => {
    setEditingCut(cut);
    setFormData({
      hebrew_name: cut.hebrew_name,
      english_name: cut.english_name || '',
      category: cut.category,
      description: cut.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (cutId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק נתח זה?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/cuts/${cutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage('נתח נמחק בהצלחה!');
        fetchCuts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'שגיאה במחיקת הנתח');
      }
    } catch (err) {
      setError('שגיאת רשת במחיקת הנתח');
      console.error('Error deleting cut:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      hebrew_name: '',
      english_name: '',
      category: '',
      description: ''
    });
    setEditingCut(null);
    setShowAddForm(false);
  };

  const filteredCuts = cuts.filter(cut => {
    const matchesSearch = cut.hebrew_name.includes(searchTerm) || 
                         (cut.english_name && cut.english_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || cut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Styles
  const containerStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
    gap: '1rem'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p style={{ color: '#6b7280' }}>טוען נתחים...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            🥩 ניהול נתחי בשר
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            {showAddForm ? '❌ ביטול' : '➕ הוסף נתח חדש'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            {successMessage}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} style={{
            border: '2px dashed #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2rem',
            backgroundColor: '#f8fafc',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              color: '#374151'
            }}>
              {editingCut ? 'עריכת נתח' : 'הוספת נתח חדש'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  שם בעברית <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.hebrew_name}
                  onChange={(e) => setFormData({ ...formData, hebrew_name: e.target.value })}
                  placeholder="אנטריקוט, פילה, כתף..."
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>שם באנגלית</label>
                <input
                  type="text"
                  value={formData.english_name}
                  onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                  placeholder="Ribeye, Tenderloin, Shoulder..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>
                קטגוריה <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="בקר, כבש, עוף, חזיר..."
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>תיאור</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור הנתח, מאפיינים, איך מכינים..."
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical' as const
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={buttonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                {editingCut ? '💾 עדכן נתח' : '➕ הוסף נתח'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                ❌ ביטול
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div>
            <label style={labelStyle}>חיפוש נתחים</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש לפי שם עברי או אנגלי..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>סנן לפי קטגוריה</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="">כל הקטגוריות</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cuts List */}
      <div style={cardStyle}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📋 רשימת נתחים ({filteredCuts.length})
        </h2>

        {filteredCuts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p>לא נמצאו נתחים התואמים לחיפוש</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredCuts.map((cut) => (
              <div
                key={cut.id}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  backgroundColor: cut.is_active ? 'white' : '#f9fafb',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {cut.hebrew_name}
                    {!cut.is_active && (
                      <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        לא פעיל
                      </span>
                    )}
                  </h3>
                  
                  {cut.english_name && (
                    <p style={{
                      fontSize: '1rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>
                      {cut.english_name}
                    </p>
                  )}
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#3b82f6',
                    backgroundColor: '#eff6ff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    display: 'inline-block',
                    marginBottom: '0.5rem'
                  }}>
                    {cut.category}
                  </div>
                  
                  {cut.description && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginTop: '0.75rem'
                    }}>
                      {cut.description}
                    </p>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    נוצר: {new Date(cut.created_at).toLocaleDateString('he-IL')}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(cut)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#10b981',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                    >
                      ✏️ ערוך
                    </button>
                    
                    <button
                      onClick={() => handleDelete(cut.id)}
                      style={{
                        ...dangerButtonStyle,
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                      }}
                    >
                      🗑️ מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
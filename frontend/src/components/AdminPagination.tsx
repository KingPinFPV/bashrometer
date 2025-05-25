// src/components/AdminPagination.tsx
"use client";

import React from 'react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AdminPagination: React.FC<AdminPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // אל תציג עימוד אם יש רק דף אחד או פחות
  }

  const pageNumbers = [];
  // היגיון בסיסי להצגת מספרי דפים (אפשר לשפר בעתיד)
  // לדוגמה, הצג תמיד את הדף הראשון, האחרון, והדפים סביב הדף הנוכחי
  const maxPagesToShow = 5; // מספר מקסימלי של כפתורי מספרים להצגה
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
      {/* כפתור "הקודם" */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm font-medium text-slate-600 bg-white rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &larr; הקודם
      </button>

      {/* הצגת הדף הראשון אם הוא לא בטווח */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 text-sm font-medium text-slate-600 bg-white rounded-md border border-slate-300 hover:bg-slate-50"
          >
            1
          </button>
          {startPage > 2 && <span className="text-slate-500">...</span>}
        </>
      )}

      {/* מספרי דפים */}
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          disabled={currentPage === pageNumber}
          className={`px-3 py-1 text-sm font-medium rounded-md border border-slate-300
            ${currentPage === pageNumber 
              ? 'bg-sky-600 text-white border-sky-600 cursor-default' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
            }
          `}
        >
          {pageNumber}
        </button>
      ))}

      {/* הצגת הדף האחרון אם הוא לא בטווח */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 text-sm font-medium text-slate-600 bg-white rounded-md border border-slate-300 hover:bg-slate-50"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* כפתור "הבא" */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm font-medium text-slate-600 bg-white rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        הבא &rarr;
      </button>
    </nav>
  );
};

export default AdminPagination;
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  // Convert title to sentence case
  const sentenceCaseTitle = title ? title.charAt(0).toUpperCase() + title.slice(1).toLowerCase() : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className={cn(
          "relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden",
          className
        )}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{sentenceCaseTitle}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 
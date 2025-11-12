import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const Modal = ({ 
  open, 
  onClose, 
  title, 
  children, 
  footer,
  width = 'max-w-lg',
  closeOnClickOutside = true,
  closeIcon = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27 && open) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
      // Remove body overflow hidden to allow scrolling
      // document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      // document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closeOnClickOutside ? onClose : undefined}
        />
        
        {/* Modal */}
        <div className={`relative z-50 w-full ${width} transform transition-all`}>
          <div className={`rounded-lg shadow-xl ${
            isDark ? 'bg-[#374151]' : 'bg-white'
          }`}>
            {/* Header */}
            {(title || closeIcon) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {closeIcon && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}
            
            {/* Body */}
            <div className="px-6 py-4">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
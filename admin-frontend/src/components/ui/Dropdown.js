import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({ 
  children, 
  overlay, 
  trigger = ['click'], 
  placement = 'bottomRight',
  className = '',
  open: controlledOpen,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const contentRef = useRef(null);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = (value) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setIsOpen(value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleTriggerClick = () => {
    if (trigger.includes('click')) {
      setOpen(!open);
    }
  };

  const getPlacementStyles = () => {
    const styles = {
      position: 'absolute',
      zIndex: 1000,
    };

    switch (placement) {
      case 'bottomRight':
        styles.top = '100%';
        styles.right = 0;
        styles.marginTop = '4px';
        break;
      case 'bottomLeft':
        styles.top = '100%';
        styles.left = 0;
        styles.marginTop = '4px';
        break;
      case 'topRight':
        styles.bottom = '100%';
        styles.right = 0;
        styles.marginBottom = '4px';
        break;
      case 'topLeft':
        styles.bottom = '100%';
        styles.left = 0;
        styles.marginBottom = '4px';
        break;
      default:
        styles.top = '100%';
        styles.right = 0;
        styles.marginTop = '4px';
    }

    return styles;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={handleTriggerClick}>
        {children}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            ref={contentRef}
            style={getPlacementStyles()}
            className="z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {typeof overlay === 'function' ? overlay() : overlay}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dropdown;
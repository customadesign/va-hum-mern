import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import './AdminFooter.css';

const AdminFooter = ({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0, 
  itemsPerPage = 20,
  onPageChange,
  showItemsInfo = true,
  showQuickJump = true,
  className = ''
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages !== 1) {
      range.push(totalPages);
    }

    return range;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <footer className={`admin-footer ${className}`}>
      <div className="admin-footer-container">
        {/* Items Information - Desktop */}
        {showItemsInfo && (
          <div className="admin-footer-info hidden sm:block">
            <p className="admin-footer-text">
              Showing <span className="admin-footer-highlight">{startItem}</span> to{' '}
              <span className="admin-footer-highlight">{endItem}</span> of{' '}
              <span className="admin-footer-highlight">{totalItems}</span> results
            </p>
          </div>
        )}

        {/* Mobile Pagination Controls */}
        <div className="admin-footer-mobile sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="admin-footer-mobile-btn"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="admin-footer-icon" />
            <span>Previous</span>
          </button>
          
          <div className="admin-footer-mobile-info">
            <span className="admin-footer-mobile-text">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="admin-footer-mobile-btn"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRightIcon className="admin-footer-icon" />
          </button>
        </div>

        {/* Desktop Pagination Controls */}
        <div className="admin-footer-desktop hidden sm:flex">
          {/* First Page & Previous */}
          <div className="admin-footer-nav-group">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="admin-footer-nav-btn admin-footer-nav-first"
              aria-label="First page"
              title="First page"
            >
              <ChevronDoubleLeftIcon className="admin-footer-icon" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="admin-footer-nav-btn"
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeftIcon className="admin-footer-icon" />
              <span className="hidden md:inline">Previous</span>
            </button>
          </div>

          {/* Page Numbers */}
          <div className="admin-footer-pages">
            {getVisiblePages().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="admin-footer-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`admin-footer-page-btn ${
                    page === currentPage ? 'admin-footer-page-active' : ''
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Next & Last Page */}
          <div className="admin-footer-nav-group">
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="admin-footer-nav-btn"
              aria-label="Next page"
              title="Next page"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRightIcon className="admin-footer-icon" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="admin-footer-nav-btn admin-footer-nav-last"
              aria-label="Last page"
              title="Last page"
            >
              <ChevronDoubleRightIcon className="admin-footer-icon" />
            </button>
          </div>
        </div>

        {/* Quick Jump - Desktop Only */}
        {showQuickJump && totalPages > 10 && (
          <div className="admin-footer-jump hidden lg:block">
            <label htmlFor="page-jump" className="admin-footer-jump-label">
              Go to:
            </label>
            <input
              id="page-jump"
              type="number"
              min="1"
              max={totalPages}
              className="admin-footer-jump-input"
              placeholder="Page"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value);
                  if (page && page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                    e.target.value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </footer>
  );
};

export default AdminFooter;
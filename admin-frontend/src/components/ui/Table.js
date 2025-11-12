import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Table = ({
  columns = [],
  dataSource = [],
  rowKey = 'id',
  loading = false,
  pagination = false,
  pageSize: defaultPageSize = 10,
  bordered = false,
  striped = false,
  hoverable = true,
  size = 'default',
  className = '',
  onRow,
  rowSelection,
  scroll,
  emptyText = 'No data available',
  footer
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);

  const sizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  };

  const paddingSizes = {
    small: 'px-3 py-1.5',
    default: 'px-4 py-3',
    large: 'px-6 py-4'
  };

  // Handle sorting
  const handleSort = (column) => {
    if (!column.sorter) return;
    
    if (sortColumn === column.dataIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.dataIndex);
      setSortDirection('asc');
    }
  };

  // Sort data
  let processedData = [...dataSource];
  if (sortColumn) {
    processedData.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(processedData.length / defaultPageSize);
  if (pagination) {
    const startIndex = (currentPage - 1) * defaultPageSize;
    processedData = processedData.slice(startIndex, startIndex + defaultPageSize);
  }

  // Handle row selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(processedData.map(row => row[rowKey]));
    } else {
      setSelectedRows([]);
    }
    if (rowSelection?.onChange) {
      rowSelection.onChange(e.target.checked ? processedData.map(row => row[rowKey]) : []);
    }
  };

  const handleSelectRow = (key) => {
    const newSelected = selectedRows.includes(key)
      ? selectedRows.filter(k => k !== key)
      : [...selectedRows, key];
    setSelectedRows(newSelected);
    if (rowSelection?.onChange) {
      rowSelection.onChange(newSelected);
    }
  };

  const isAllSelected = processedData.length > 0 && 
    processedData.every(row => selectedRows.includes(row[rowKey]));

  return (
    <div className={className}>
      <div className={`overflow-x-auto ${scroll?.x ? 'overflow-x-scroll' : ''} ${scroll?.y ? `overflow-y-scroll ${scroll.y}` : ''}`}>
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}`}>
          <thead className="bg-[#1e3a8a] dark:bg-gray-800">
            <tr>
              {rowSelection && (
                <th className={`${paddingSizes[size]} text-left`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-[#1e3a8a] focus:ring-[#1e3a8a] border-gray-300 rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.dataIndex || column.key}
                  className={`
                    ${paddingSizes[size]}
                    text-left ${sizes[size]} font-medium text-white dark:text-white
                    ${column.sorter ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    ${bordered ? 'border-r border-gray-200 dark:border-gray-700 last:border-r-0' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
                    {column.sorter && (
                      <div className="ml-2 flex flex-col">
                        <ChevronUpIcon 
                          className={`h-3 w-3 ${sortColumn === column.dataIndex && sortDirection === 'asc' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                        />
                        <ChevronDownIcon 
                          className={`h-3 w-3 -mt-1 ${sortColumn === column.dataIndex && sortDirection === 'desc' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="text-center py-8">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-[#1e3a8a]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              processedData.map((record, rowIndex) => {
                const rowProps = onRow ? onRow(record, rowIndex) : {};
                const isSelected = selectedRows.includes(record[rowKey]);
                
                return (
                  <tr
                    key={record[rowKey]}
                    className={`
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-900' : ''}
                      ${hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                    {...rowProps}
                  >
                    {rowSelection && (
                      <td className={`${paddingSizes[size]} ${bordered ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(record[rowKey])}
                          className="h-4 w-4 text-[#1e3a8a] focus:ring-[#1e3a8a] border-gray-300 rounded"
                        />
                      </td>
                    )}
                    {columns.map((column) => {
                      const value = record[column.dataIndex];
                      const renderedValue = column.render ? column.render(value, record, rowIndex) : value;
                      
                      return (
                        <td
                          key={column.dataIndex || column.key}
                          className={`
                            ${paddingSizes[size]}
                            ${sizes[size]}
                            text-gray-900 dark:text-white
                            ${bordered ? 'border-r border-gray-200 dark:border-gray-700 last:border-r-0' : ''}
                          `}
                        >
                          {renderedValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
          {footer && (
            <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={columns.length + (rowSelection ? 1 : 0)} className={paddingSizes[size]}>
                  {footer}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-[#1e3a8a] border-[#1e3a8a] text-white'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
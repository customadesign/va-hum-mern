import React, { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({ 
  type = 'text',
  size = 'default',
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  disabled = false,
  error = false,
  errorMessage = '',
  className = '',
  allowClear = false,
  value,
  onChange,
  onClear,
  ...props 
}, ref) => {
  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-2.5 text-base'
  };

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (onClear) {
      onClear();
    }
  };

  const inputClasses = `
    block w-full
    ${sizes[size]}
    ${addonBefore ? 'rounded-r-md' : addonAfter ? 'rounded-l-md' : 'rounded-md'}
    border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
    bg-white dark:bg-gray-700
    text-black dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-[#1e3a8a] dark:focus:ring-[#5da0f5]'}
    focus:border-transparent
    disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
    transition-colors duration-200
  `;

  const input = (
    <div className="relative flex-1">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {prefix}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${inputClasses} ${prefix ? 'pl-10' : ''} ${suffix || (allowClear && value) ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {(suffix || (allowClear && value)) && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {allowClear && value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          ) : suffix}
        </div>
      )}
    </div>
  );

  if (addonBefore || addonAfter) {
    return (
      <div>
        <div className="flex">
          {addonBefore && (
            <span className={`inline-flex items-center ${sizes[size]} rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300`}>
              {addonBefore}
            </span>
          )}
          {input}
          {addonAfter && (
            <span className={`inline-flex items-center ${sizes[size]} rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300`}>
              {addonAfter}
            </span>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {input}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Password Input Component
export const InputPassword = forwardRef(({ ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      {...props}
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      }
    />
  );
});

InputPassword.displayName = 'InputPassword';

// TextArea Component
export const TextArea = forwardRef(({ 
  rows = 4,
  autoSize = false,
  maxLength,
  showCount = false,
  error = false,
  errorMessage = '',
  className = '',
  ...props 
}, ref) => {
  const [count, setCount] = React.useState(props.value?.length || 0);

  const handleChange = (e) => {
    setCount(e.target.value.length);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div>
      <textarea
        ref={ref}
        rows={rows}
        maxLength={maxLength}
        onChange={handleChange}
        className={`
          block w-full px-3 py-2 text-sm
          rounded-md
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-gray-700
          text-black dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-[#1e3a8a] dark:focus:ring-[#5da0f5]'}
          focus:border-transparent
          disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
          transition-colors duration-200
          resize-y
          ${className}
        `}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {error && errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            {errorMessage}
          </p>
        )}
        {showCount && maxLength && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {count} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default Input;
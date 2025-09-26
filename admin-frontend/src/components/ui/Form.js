import React, { createContext, useContext, useState } from 'react';

// Form Context
const FormContext = createContext({});

// Main Form Component
const Form = ({ 
  children, 
  onSubmit, 
  className = '',
  layout = 'vertical', // vertical, horizontal, inline
  size = 'default',
  disabled = false,
  initialValues = {}
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const setFieldValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const setFieldError = (name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const setFieldTouched = (name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  };

  const getFieldValue = (name) => values[name];
  const getFieldError = (name) => errors[name];
  const isFieldTouched = (name) => touched[name];

  const contextValue = {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldValue,
    getFieldError,
    isFieldTouched,
    layout,
    size,
    disabled
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

// Form Item Component
const FormItem = ({ 
  label, 
  name, 
  children, 
  required = false,
  help,
  tooltip,
  className = '',
  labelCol,
  wrapperCol,
  rules = []
}) => {
  const context = useContext(FormContext);
  const { layout, size, getFieldError, isFieldTouched } = context;
  
  const error = getFieldError(name);
  const touched = isFieldTouched(name);
  const showError = error && touched;

  const labelClasses = {
    vertical: 'block mb-2',
    horizontal: 'inline-block text-right pr-4',
    inline: 'inline-block mr-2'
  };

  const wrapperClasses = {
    vertical: '',
    horizontal: 'flex',
    inline: 'inline-flex items-center'
  };

  const sizes = {
    small: 'text-sm',
    default: 'text-sm',
    large: 'text-base'
  };

  // Clone children and pass props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        name,
        error: showError,
        errorMessage: error,
        size,
        value: context.getFieldValue(name),
        onChange: (e) => {
          const value = e?.target ? e.target.value : e;
          context.setFieldValue(name, value);
          if (child.props.onChange) {
            child.props.onChange(e);
          }
        },
        onBlur: (e) => {
          context.setFieldTouched(name, true);
          if (child.props.onBlur) {
            child.props.onBlur(e);
          }
        },
        disabled: context.disabled || child.props.disabled
      });
    }
    return child;
  });

  return (
    <div className={`mb-4 ${wrapperClasses[layout]} ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`
            ${labelClasses[layout]}
            ${sizes[size]}
            font-medium text-gray-700 dark:text-gray-300
            ${layout === 'horizontal' ? (labelCol || 'w-1/3') : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {tooltip && (
            <span className="ml-1 text-gray-400" title={tooltip}>
              <svg className="inline-block w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </label>
      )}
      <div className={`${layout === 'horizontal' ? (wrapperCol || 'w-2/3') : 'w-full'}`}>
        {childrenWithProps}
        {help && !showError && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{help}</p>
        )}
        {showError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};

// Export Form with Item as a property
Form.Item = FormItem;

// useForm Hook
export const useForm = () => {
  const [form] = useState({
    values: {},
    errors: {},
    touched: {},
    setFieldsValue: (values) => {
      form.values = { ...form.values, ...values };
    },
    getFieldValue: (name) => form.values[name],
    validateFields: async () => {
      // Validation logic here
      return form.values;
    },
    resetFields: () => {
      form.values = {};
      form.errors = {};
      form.touched = {};
    }
  });

  return [form];
};

export default Form;
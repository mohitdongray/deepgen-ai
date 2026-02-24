/**
 * Form Components - Professional Input Fields with Enhanced UX
 * 
 * Includes Input, TextArea, and specialized form components
 * Auto-focus behavior, validation states, and modern styling
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Input Component - Enhanced text input with auto-prompt behavior
 * 
 * Features:
 * - Auto-prompt functionality (e.g., "windsurf" default)
 * - Validation states
 * - Focus/blur animations
 * - Modern styling with proper accessibility
 */
const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onBlur, 
  onFocus,
  type = 'text',
  error = '',
  required = false,
  disabled = false,
  className = '',
  autoPrompt = null, // e.g., "windsurf" for default prompt
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef(null);

  // Auto-prompt functionality
  const handleFocus = (e) => {
    setIsFocused(true);
    if (autoPrompt && !hasInteracted && value === autoPrompt) {
      e.target.value = '';
      onChange?.({ target: { value: '', ...e.target } });
    }
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setHasInteracted(true);
    
    // Restore auto-prompt if empty
    if (autoPrompt && e.target.value === '') {
      e.target.value = autoPrompt;
      onChange?.({ target: { value: autoPrompt, ...e.target } });
    }
    onBlur?.(e);
  };

  const handleChange = (e) => {
    setHasInteracted(true);
    onChange?.(e);
  };

  const inputClasses = [
    'input-field',
    isFocused && 'input-field--focused',
    error && 'input-field--error',
    disabled && 'input-field--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <span className="input-error">
          {error}
        </span>
      )}
      
      {/* Focus indicator */}
      <div className={`input-focus-indicator ${isFocused ? 'input-focus-indicator--active' : ''}`}></div>
    </div>
  );
};

/**
 * TextArea Component - Enhanced text area
 */
const TextArea = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onBlur, 
  onFocus,
  error = '',
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const textAreaClasses = [
    'textarea-field',
    isFocused && 'textarea-field--focused',
    error && 'textarea-field--error',
    disabled && 'textarea-field--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="textarea-container">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={textAreaClasses}
        {...props}
      />
      
      {error && (
        <span className="input-error">
          {error}
        </span>
      )}
      
      {/* Focus indicator */}
      <div className={`textarea-focus-indicator ${isFocused ? 'textarea-focus-indicator--active' : ''}`}></div>
    </div>
  );
};

/**
 * FileInput Component - Enhanced file upload input
 */
const FileInput = ({ 
  label, 
  onChange, 
  accept, 
  multiple = false,
  error = '',
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map(file => file.name).join(', ');
      setFileName(fileNames);
      onChange?.(files);
    }
  };

  const handleChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const fileInputClasses = [
    'file-input',
    isDragOver && 'file-input--drag-over',
    error && 'file-input--error',
    disabled && 'file-input--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="file-input-container">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div
        className={fileInputClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="file-input-hidden"
          {...props}
        />
        
        <div className="file-input-content">
          <div className="file-input-icon">
            {fileName ? '📄' : '📁'}
          </div>
          <div className="file-input-text">
            {fileName || 'Click to upload or drag and drop'}
          </div>
        </div>
      </div>
      
      {error && (
        <span className="input-error">
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * Select Component - Enhanced dropdown select
 */
const Select = ({ 
  label, 
  options, 
  value, 
  onChange, 
  onBlur, 
  error = '',
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const selectClasses = [
    'select-field',
    isFocused && 'select-field--focused',
    error && 'select-field--error',
    disabled && 'select-field--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="select-container">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <select
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={selectClasses}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <span className="input-error">
          {error}
        </span>
      )}
      
      {/* Focus indicator */}
      <div className={`select-focus-indicator ${isFocused ? 'select-focus-indicator--active' : ''}`}></div>
    </div>
  );
};

/**
 * Form Component - Complete form with validation
 */
const Form = ({ 
  children, 
  onSubmit, 
  className = '',
  loading = false,
  error = '',
  ...props 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      onSubmit?.(e);
    }
  };

  const formClasses = [
    'form',
    loading && 'form--loading',
    error && 'form--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <form onSubmit={handleSubmit} className={formClasses} {...props}>
      {children}
      
      {/* Form Error */}
      {error && (
        <div className="form-error-message">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <button 
        type="submit" 
        className="form-submit-btn"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
};

export {
  Input,
  TextArea,
  FileInput,
  Select,
  Form
};

export default Input;

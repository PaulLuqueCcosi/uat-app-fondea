'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  helperText?: React.ReactNode;
  helpText?: React.ReactNode;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  valid?: boolean;
  showPasswordToggle?: boolean;
  id?: string;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoFocus?: boolean;
  required?: boolean;
  min?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  helperText,
  helpText,
  leftIcon,
  icon,
  rightIcon,
  disabled = false,
  valid = false,
  showPasswordToggle = false,
  id,
  className,
  inputMode,
  maxLength,
  autoFocus,
  required,
  min,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  const effectiveLeftIcon = leftIcon || icon;
  const hasRightSlot = showPasswordToggle || (valid && !error) || rightIcon;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-dark">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {effectiveLeftIcon && (
          <span className="absolute left-3 text-fondea-text pointer-events-none">{effectiveLeftIcon}</span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          autoFocus={autoFocus}
          min={min}
          required={required}
          className={cn(
            'w-full h-14 rounded-xl border bg-white text-dark placeholder:text-[#94A3B8] text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            effectiveLeftIcon ? 'pl-10' : 'pl-4',
            hasRightSlot ? 'pr-10' : 'pr-4',
            error ? 'border-error focus:ring-error/30 focus:border-error' : '',
            valid && !error ? 'border-secondary' : '',
            !error && !valid ? 'border-border' : '',
            disabled ? 'bg-[#F8FAFC] cursor-not-allowed opacity-60' : '',
            className
          )}
        />
        {showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 text-fondea-text hover:text-dark transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {!showPasswordToggle && valid && !error && (
          <span className="absolute right-3 text-secondary pointer-events-none">
            <CheckCircle className="w-4 h-4" />
          </span>
        )}
        {!showPasswordToggle && rightIcon && (
          <span className="absolute right-3 text-fondea-text pointer-events-none">{rightIcon}</span>
        )}
      </div>
      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
      {(helperText || helpText) && !error && <div className="text-xs text-fondea-text mt-0.5">{helperText || helpText}</div>}
    </div>
  );
};

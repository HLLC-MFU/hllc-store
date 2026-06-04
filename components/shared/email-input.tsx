"use client";

import { useState, useCallback, forwardRef } from "react";
import { Mail, AlertCircle } from "lucide-react";
import { validateEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

export interface EmailInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value" | "defaultValue"
  > {
  /** Controlled value */
  value: string;
  /** Change handler receives the raw string */
  onChange: (value: string) => void;
  /** Language for error messages */
  lang?: "th" | "en";
  /** Show mail icon on the left */
  showIcon?: boolean;
  /** Validate and show error on blur */
  validateOnBlur?: boolean;
  /** External error (overrides internal validation) */
  error?: string;
  /** Label text above the input */
  label?: string;
  /** ref forwarded to the underlying <input> */
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  (
    {
      value,
      onChange,
      lang = "en",
      showIcon = true,
      validateOnBlur = true,
      error: externalError,
      label,
      className,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);

    const validationError = validateEmail(value, lang);
    const visibleError = externalError || (touched ? validationError : "");
    const hasError = Boolean(visibleError);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (validateOnBlur) setTouched(true);
        onBlur?.(e);
      },
      [validateOnBlur, onBlur]
    );

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-xs font-semibold text-gray-400">
            {label}
          </label>
        )}
        <div className="relative">
          {showIcon && (
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          )}
          <input
            ref={ref}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Clear external-style error as soon as user starts typing again
              if (externalError && touched) {
                setTouched(false);
              }
            }}
            onBlur={handleBlur}
            aria-invalid={hasError}
            className={cn(
              "flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10",
              showIcon && "pl-10",
              hasError
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
                : "",
              className
            )}
            {...props}
          />
          {hasError && (
            <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
          )}
        </div>
        {hasError && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{visibleError}</p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

"use client";

import { useState, useCallback, forwardRef } from "react";
import { Phone, AlertCircle } from "lucide-react";
import { validatePhone, normalizePhone } from "@/lib/validation/schemas-i18n";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value" | "defaultValue"
  > {
  value: string;
  onChange: (value: string) => void;
  lang?: "th" | "en";
  showIcon?: boolean;
  validateOnBlur?: boolean;
  error?: string;
  label?: string;
  inlineError?: boolean;
}

function formatPhoneDisplay(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      lang = "en",
      showIcon = true,
      validateOnBlur = true,
      error: externalError,
      label,
      inlineError = true,
      className,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);

    const validationError = validatePhone(value, lang);
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
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          )}
          <input
            ref={ref}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formatPhoneDisplay(value)}
            onChange={(e) => {
              const digits = normalizePhone(e.target.value).slice(0, 10);
              onChange(digits);
              if (externalError && touched) {
                setTouched(false);
              }
            }}
            onBlur={handleBlur}
            aria-invalid={hasError}
            className={cn(
              "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50",
              showIcon && "pl-10",
              hasError
                ? "border-red-300 pr-10 focus:border-red-400"
                : "",
              className
            )}
            {...props}
          />
          {hasError && (
            <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
          )}
        </div>
        {hasError && inlineError && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{visibleError}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

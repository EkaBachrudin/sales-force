import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      options,
      value,
      onChange,
      multiple = false,
      label,
      error,
      helperText,
      placeholder = 'Select...',
      searchPlaceholder = 'Search...',
      disabled = false,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const hasError = !!error;

    const selectedValues = useMemo(() => {
      return Array.isArray(value) ? value : value ? [value] : [];
    }, [value]);

    const filteredOptions = useMemo(() => {
      if (!query.trim()) return options;
      const q = query.trim().toLowerCase();
      return options.filter((option) => option.label.toLowerCase().includes(q));
    }, [options, query]);

    const selectedLabels = useMemo(() => {
      return selectedValues
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter((label): label is string => !!label);
    }, [selectedValues, options]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    useEffect(() => {
      if (open) {
        setQuery('');
        const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
        return () => clearTimeout(timer);
      }
    }, [open]);

    const toggleOption = (optionValue: string) => {
      if (multiple) {
        const next = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange(next);
      } else {
        onChange(optionValue);
        setOpen(false);
      }
    };

    const selectAll = () => {
      const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
      onChange(enabled);
    };

    const clearAll = () => {
      onChange(multiple ? [] : '');
    };

    const triggerContent = () => {
      if (selectedLabels.length === 0) {
        return <span className="text-gray-400 truncate">{placeholder}</span>;
      }

      if (!multiple) {
        return <span className="truncate text-text-primary">{selectedLabels[0]}</span>;
      }

      const visible = selectedLabels.slice(0, 3);
      const remaining = selectedLabels.length - visible.length;
      return (
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {visible.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-text-primary max-w-full"
            >
              <span className="truncate max-w-[120px]">{label}</span>
            </span>
          ))}
          {remaining > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-text-secondary">
              +{remaining} more
            </span>
          )}
        </div>
      );
    };

    const setRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    return (
      <div ref={setRefs} className={cn('relative w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </label>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'w-full px-3 py-2 rounded-[8px] border text-sm text-left transition-all duration-200',
            'flex items-center justify-between gap-2 focus:outline-none focus-visible:outline-none',
            disabled
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70'
              : hasError
              ? 'bg-red-50/50 border-[var(--danger)] focus:border-[var(--danger)] cursor-pointer'
              : 'bg-white border-border focus:border-primary cursor-pointer',
            open && !disabled && 'border-primary'
          )}
        >
          <span className="flex-1 min-w-0">{triggerContent()}</span>
          {!disabled && multiple && selectedValues.length > 0 && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-transform',
              disabled ? 'text-gray-300' : 'text-gray-500',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-[8px] shadow-lg overflow-hidden">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-border bg-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {multiple && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-text-secondary hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <ul className="max-h-60 overflow-y-auto py-1">
              {isLoading ? (
                <li className="px-3 py-2 text-sm text-text-secondary">Loading...</li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-text-secondary">No results found</li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        disabled={option.disabled}
                        onClick={() => toggleOption(option.value)}
                        className={cn(
                          'w-full px-3 py-2 text-sm flex items-center gap-2 text-left transition-colors',
                          option.disabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-text-primary hover:bg-gray-50 cursor-pointer',
                          isSelected && 'bg-gray-50'
                        )}
                      >
                        {multiple ? (
                          <span
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                              isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </span>
                        ) : (
                          <span className="w-4 flex items-center justify-center flex-shrink-0">
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </span>
                        )}
                        <span className="truncate">{option.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';

export { Combobox };

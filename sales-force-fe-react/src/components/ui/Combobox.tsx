import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import './Combobox.css';

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
        return <span className="combobox__trigger-placeholder">{placeholder}</span>;
      }

      if (!multiple) {
        return <span className="combobox__trigger-value">{selectedLabels[0]}</span>;
      }

      const visible = selectedLabels.slice(0, 3);
      const remaining = selectedLabels.length - visible.length;
      return (
        <div className="combobox__chips">
          {visible.map((label) => (
            <span key={label} className="combobox__chip">
              <span className="combobox__chip-label">{label}</span>
            </span>
          ))}
          {remaining > 0 && (
            <span className="combobox__chip combobox__chip--more">
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
      <div ref={setRefs} className={cn('combobox', className)}>
        {label && <label className="combobox__label">{label}</label>}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'combobox__trigger',
            disabled && 'combobox__trigger--disabled',
            hasError && 'combobox__trigger--error',
            open && !disabled && 'combobox__trigger--open'
          )}
        >
          <span className="combobox__trigger-content">{triggerContent()}</span>
          {!disabled && selectedValues.length > 0 && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="combobox__clear"
            >
              <X className="combobox__clear-icon" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'combobox__chevron',
              disabled && 'combobox__chevron--disabled',
              open && 'combobox__chevron--open'
            )}
          />
        </button>

        {open && !disabled && (
          <div className="combobox__menu">
            <div className="combobox__search">
              <div className="combobox__search-inner">
                <Search className="combobox__search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="combobox__search-input"
                />
              </div>
            </div>

            {multiple && (
              <div className="combobox__actions">
                <button type="button" onClick={selectAll} className="combobox__action combobox__action--primary">
                  Select all
                </button>
                <span className="combobox__divider">|</span>
                <button type="button" onClick={clearAll} className="combobox__action combobox__action--secondary">
                  Clear
                </button>
              </div>
            )}

            <ul className="combobox__list">
              {isLoading ? (
                <li className="combobox__list-message">Loading...</li>
              ) : filteredOptions.length === 0 ? (
                <li className="combobox__list-message">No results found</li>
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
                          'combobox__option',
                          option.disabled && 'combobox__option--disabled',
                          isSelected && 'combobox__option--selected'
                        )}
                      >
                        {multiple ? (
                          <span
                            className={cn(
                              'combobox__option-checkbox',
                              isSelected && 'combobox__option-checkbox--selected'
                            )}
                          >
                            {isSelected && <Check className="combobox__option-check" />}
                          </span>
                        ) : (
                          <span className="combobox__option-indicator">
                            {isSelected && <Check className="combobox__option-check-icon" />}
                          </span>
                        )}
                        <span className="combobox__option-label">{option.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {error && <p className="combobox__error">{error}</p>}

        {helperText && !error && <p className="combobox__helper">{helperText}</p>}
      </div>
    );
  }
);

Combobox.displayName = 'Combobox';

export { Combobox };

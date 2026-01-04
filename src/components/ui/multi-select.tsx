'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface MultiSelectProps<T> {
  options: T[];
  value: string[];
  onChange: (value: string[]) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  className?: string;
}

export function MultiSelect<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select options...',
  className
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedOptions = options.filter((opt) => value.includes(getOptionValue(opt)));

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isOpen && 'ring-2 ring-ring'
        )}
      >
        <span className={clsx('truncate', value.length === 0 && 'text-muted-fg')}>
          {value.length === 0
            ? placeholder
            : value.length === 1
              ? getOptionLabel(selectedOptions[0]!)
              : `${value.length} selected`}
        </span>
        <svg
          className={clsx('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-fg">No options</div>
          ) : (
            options.map((option) => {
              const optionValue = getOptionValue(option);
              const isSelected = value.includes(optionValue);
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => toggleOption(optionValue)}
                  className={clsx(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                    isSelected && 'bg-muted'
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      isSelected && 'bg-primary border-primary'
                    )}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-primary-fg" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{getOptionLabel(option)}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


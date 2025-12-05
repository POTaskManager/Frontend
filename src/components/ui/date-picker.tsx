'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | null;
  onChange: (date: string | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, minDate, maxDate, className, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(() => {
      if (!value) return '';
      try {
        const date = new Date(value);
        return format(date, 'yyyy-MM-dd');
      } catch {
        return '';
      }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value;
      setInputValue(dateValue);

      if (dateValue) {
        const date = new Date(dateValue);
        if (minDate && date < minDate) {
          return;
        }
        if (maxDate && date > maxDate) {
          return;
        }
        onChange(date.toISOString());
      } else {
        onChange(null);
      }
    };

    const minDateStr = minDate ? format(minDate, 'yyyy-MM-dd') : undefined;
    const maxDateStr = maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined;

    return (
      <input
        ref={ref}
        type="date"
        value={inputValue}
        onChange={handleChange}
        min={minDateStr}
        max={maxDateStr}
        className={clsx(
          'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';


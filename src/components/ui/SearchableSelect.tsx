import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

import { useTranslation } from 'react-i18next';

type Option = string | { value: string; label: string };

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onSearchChange?: (value: string) => void;
}

function getOptionValue(option: Option): string {
  return typeof option === 'string' ? option : option.value;
}

function getOptionLabel(option: Option): string {
  return typeof option === 'string' ? option : option.label;
}

const SearchableSelect = React.forwardRef<
  HTMLButtonElement,
  SearchableSelectProps
>(
  (
    {
      id,
      value,
      onChange,
      options,
      placeholder = 'Select an option',
      required = false,
      disabled = false,
      className,
      onSearchChange,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((o) => getOptionValue(o) === value);
    const displayLabel = selectedOption
      ? getOptionLabel(selectedOption)
      : placeholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between bg-white font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search..."
              className="h-9"
              onValueChange={onSearchChange}
            />
            <CommandList>
              <CommandEmpty>{t('common.noOptionFound')}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const optionValue = getOptionValue(option);
                  const optionLabel = getOptionLabel(option);
                  return (
                    <CommandItem
                      key={optionValue}
                      value={optionValue}
                      onSelect={() => {
                        onChange(optionValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === optionValue ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {optionLabel}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };

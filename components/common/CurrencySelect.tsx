'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'USD', name: 'US Dollar', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'EUR', name: 'Euro', flag: '\u{1F1EA}\u{1F1FA}' },
  { code: 'GBP', name: 'British Pound', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'JPY', name: 'Japanese Yen', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'AUD', name: 'Australian Dollar', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'CHF', name: 'Swiss Franc', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'MXN', name: 'Mexican Peso', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'BRL', name: 'Brazilian Real', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '\u{1F1ED}\u{1F1F0}' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'SEK', name: 'Swedish Krona', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'DKK', name: 'Danish Krone', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'ZAR', name: 'South African Rand', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'AED', name: 'UAE Dirham', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'THB', name: 'Thai Baht', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'PHP', name: 'Philippine Peso', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '\u{1F1F5}\u{1F1F0}' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '\u{1F1E7}\u{1F1E9}' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '\u{1F1EA}\u{1F1EC}' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'TRY', name: 'Turkish Lira', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'RUB', name: 'Russian Ruble', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'KRW', name: 'South Korean Won', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'TWD', name: 'New Taiwan Dollar', flag: '\u{1F1F9}\u{1F1FC}' },
  { code: 'CLP', name: 'Chilean Peso', flag: '\u{1F1E8}\u{1F1F1}' },
  { code: 'COP', name: 'Colombian Peso', flag: '\u{1F1E8}\u{1F1F4}' },
  { code: 'PEN', name: 'Peruvian Sol', flag: '\u{1F1F5}\u{1F1EA}' },
  { code: 'ARS', name: 'Argentine Peso', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'CZK', name: 'Czech Koruna', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'HUF', name: 'Hungarian Forint', flag: '\u{1F1ED}\u{1F1FA}' },
  { code: 'RON', name: 'Romanian Leu', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'PLN', name: 'Polish Zloty', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'ILS', name: 'Israeli Shekel', flag: '\u{1F1EE}\u{1F1F1}' },
  { code: 'QAR', name: 'Qatari Riyal', flag: '\u{1F1F6}\u{1F1E6}' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '\u{1F1F0}\u{1F1FC}' },
  { code: 'BHD', name: 'Bahraini Dinar', flag: '\u{1F1E7}\u{1F1ED}' },
  { code: 'OMR', name: 'Omani Rial', flag: '\u{1F1F4}\u{1F1F2}' },
  { code: 'MAD', name: 'Moroccan Dirham', flag: '\u{1F1F2}\u{1F1E6}' },
  { code: 'TND', name: 'Tunisian Dinar', flag: '\u{1F1F9}\u{1F1F3}' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '\u{1F1F1}\u{1F1F0}' },
]

export { CURRENCIES }

export function CurrencySelect({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = CURRENCIES.find((c) => c.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xl border-slate-700 bg-slate-900 text-left font-normal text-slate-200"
          />
        }
      >
        {selected ? (
          <span>
            {selected.flag} {selected.code} &mdash; {selected.name}
          </span>
        ) : (
          <span className="text-slate-400">Select currency...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onValueChange(currency.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === currency.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {currency.flag} {currency.code} &mdash; {currency.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

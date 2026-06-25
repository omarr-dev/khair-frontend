"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export interface SearchableSelectOption {
  id: number | string
  name: string
}

/**
 * Normalize Arabic text so search ignores diacritics, tatweel, and the
 * common letter variations users don't type consistently
 * (أإآ→ا, ى→ي, ة→ه, ؤ→و, ئ→ي). Also lowercases and collapses whitespace.
 */
function normalizeArabic(value: string): string {
  return value
    .replace(/[ً-ْٰـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  /** When set, prepends an "all" option (value "all") with this label */
  allLabel?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  /** Cap on rendered options so huge lists never bloat the DOM */
  maxVisible?: number
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  allLabel,
  emptyText = "لا توجد نتائج",
  className,
  disabled,
  maxVisible = 300,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const normalizedSearch = normalizeArabic(search)
  const filtered = React.useMemo(() => {
    if (!normalizedSearch) return options
    return options.filter((o) =>
      normalizeArabic(o.name).includes(normalizedSearch)
    )
  }, [options, normalizedSearch])

  const visible = filtered.slice(0, maxVisible)
  const hiddenCount = filtered.length - visible.length

  const selectedLabel =
    value === "all" && allLabel
      ? allLabel
      : options.find((o) => String(o.id) === value)?.name

  const handleSelect = (newValue: string) => {
    onValueChange(newValue)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 justify-between font-normal",
            !selectedLabel && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0" align="start">
        {/* Filtering is done manually so only a bounded slice is mounted */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {allLabel && !normalizedSearch && (
              <CommandItem value="all" onSelect={() => handleSelect("all")}>
                <CheckIcon
                  className={cn(
                    "size-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>
            )}
            {visible.map((option) => (
              <CommandItem
                key={option.id}
                value={String(option.id)}
                onSelect={() => handleSelect(String(option.id))}
              >
                <CheckIcon
                  className={cn(
                    "size-4",
                    value === String(option.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{option.name}</span>
              </CommandItem>
            ))}
            {hiddenCount > 0 && (
              <div className="text-muted-foreground px-2 py-1.5 text-center text-xs">
                +{hiddenCount} نتيجة أخرى — تابع البحث لتضييق النتائج
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

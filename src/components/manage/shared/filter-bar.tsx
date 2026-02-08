"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { Halaqa } from "@/types/halaqa";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  halaqat?: Halaqa[];
  filterHalaqa?: string;
  onFilterHalaqaChange?: (value: string) => void;
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  sortByOptions?: { value: string; label: string }[];
  sortOrder?: string;
  onSortOrderChange?: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "البحث...",
  halaqat,
  filterHalaqa,
  onFilterHalaqaChange,
  sortBy,
  onSortByChange,
  sortByOptions,
  sortOrder,
  onSortOrderChange,
  onReset,
  hasActiveFilters,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 ml-2" />
              فلترة
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={onReset}>
                <X className="h-4 w-4 ml-2" />
                مسح
              </Button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {halaqat && onFilterHalaqaChange && (
                <div className="space-y-2">
                  <Label>الحلقة</Label>
                  <Select
                    value={filterHalaqa || "all"}
                    onValueChange={onFilterHalaqaChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحلقات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحلقات</SelectItem>
                      {halaqat.map((halaqa) => (
                        <SelectItem key={halaqa.id} value={halaqa.id.toString()}>
                          {halaqa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {sortByOptions && onSortByChange && (
                <div className="space-y-2">
                  <Label>ترتيب حسب</Label>
                  <Select value={sortBy} onValueChange={onSortByChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortByOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {onSortOrderChange && (
                <div className="space-y-2">
                  <Label>اتجاه الترتيب</Label>
                  <Select value={sortOrder} onValueChange={onSortOrderChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">تصاعدي</SelectItem>
                      <SelectItem value="desc">تنازلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

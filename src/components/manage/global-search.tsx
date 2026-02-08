"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useManage } from "./manage-context";

export function GlobalSearch() {
  const { globalSearch, setGlobalSearch } = useManage();

  return (
    <div role="search" className="relative">
      <Search
        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        placeholder="البحث عن حلقة، معلم، أو طالب..."
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        className={cn("pr-10 h-11", globalSearch && "pl-10")}
        aria-label="البحث عن حلقة، معلم، أو طالب"
      />
      {globalSearch && (
        <button
          type="button"
          onClick={() => setGlobalSearch("")}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="مسح البحث"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

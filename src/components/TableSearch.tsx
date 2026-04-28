"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { getSearchSuggestions } from "@/lib/searchActions";

type Suggestion = {
  label: string;
  subLabel?: string;
  value: string;
};

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to detect clicks outside the component for closing the dropdown
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync input with URL search param on mount
  useEffect(() => {
    const searchValue = searchParams.get("search") || "";
    setValue(searchValue);
  }, [searchParams]);

  // Debounced search suggestions fetcher
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(value, pathname);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [value, pathname]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (searchValue: string) => {
    const params = new URLSearchParams(window.location.search);
    if (searchValue.trim()) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    setIsFocused(false); // Close dropdown
    router.push(`${window.location.pathname}?${params}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitSearch(value);
  };

  const handleClear = () => {
    setValue("");
    setSuggestions([]);
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    router.push(`${window.location.pathname}?${params}`);
  };

  const handleSuggestionClick = (suggestionValue: string) => {
    setValue(suggestionValue);
    submitSearch(suggestionValue);
  };

  const hasSearch = searchParams.get("search");
  const isExpanded = isFocused || !!hasSearch;

  return (
    <div className={`relative ${isExpanded ? 'w-full' : 'w-auto'} md:w-auto flex justify-end transition-all duration-300`} ref={wrapperRef}>
      <form
        onClick={() => !isExpanded && setIsFocused(true)}
        onSubmit={handleSubmit}
        className={`
          flex items-center gap-2 
          rounded-xl transition-all duration-300
          bg-[rgba(255,255,255,0.1)] backdrop-blur-sm
          border
          ${isExpanded
            ? 'w-full md:w-auto px-4 py-2.5 border-[rgba(255,255,255,0.4)] shadow-lg shadow-black/10'
            : 'w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 justify-center border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer'
          }
        `}
      >
        <Search
          className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-white/60'}`}
        />
        <input
          type="text"
          placeholder="Search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`!bg-transparent outline-none text-sm !text-white placeholder:text-[rgba(255,255,255,0.5)] transition-all duration-300 
            ${isExpanded 
              ? "w-full md:w-[320px] opacity-100" 
              : "w-0 md:w-[220px] md:opacity-100 opacity-0 pointer-events-none md:pointer-events-auto overflow-hidden"
            }
            ${!isFocused && !!hasSearch ? "md:w-[220px]" : ""}
          `}
        />
        {isExpanded && isLoading && (
          <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
        )}
        {isExpanded && !isLoading && hasSearch && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)] text-white transition-all shrink-0"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isFocused && value.length >= 2 && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-CPENavy" /> Searching...
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.value)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-800">{suggestion.label}</span>
                    {suggestion.subLabel && (
                      <span className="text-xs text-gray-500">{suggestion.subLabel}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TableSearch;

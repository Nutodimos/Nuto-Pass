"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync input with URL search param
  useEffect(() => {
    const searchValue = searchParams.get("search") || "";
    setValue(searchValue);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`${window.location.pathname}?${params}`);
  };

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    router.push(`${window.location.pathname}?${params}`);
  };

  const hasSearch = searchParams.get("search");

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        w-full md:w-auto flex items-center gap-2 
        rounded-xl px-4 py-2.5
        bg-white/80 backdrop-blur-sm
        border-2 transition-all duration-300
        ${isFocused
          ? 'border-CPEGold shadow-lg shadow-CPEGold/10'
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
    >
      <Search
        className={`w-4 h-4 transition-colors duration-300 ${isFocused ? 'text-CPEGold' : 'text-gray-400'
          }`}
      />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-[180px] md:w-[220px] bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
      />
      {hasSearch && (
        <button
          type="button"
          onClick={handleClear}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-CPEGold/20 hover:text-CPEGold transition-all"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </form>
  );
};

export default TableSearch;

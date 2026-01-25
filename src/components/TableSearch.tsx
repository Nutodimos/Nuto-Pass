"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const TableSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

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
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
      {hasSearch && (
        <button
          type="button"
          onClick={handleClear}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          title="Clear search"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      )}
    </form>
  );
};

export default TableSearch;

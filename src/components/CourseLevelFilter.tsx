"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const levels = [
  { value: "", label: "All Levels" },
  { value: "100", label: "100 Level" },
  { value: "200", label: "200 Level" },
  { value: "300", label: "300 Level" },
  { value: "400", label: "400 Level" },
  { value: "500", label: "500 Level" },
];

export default function CourseLevelFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLevel = searchParams.get("level") || "";

  const handleLevelChange = useCallback(
    (level: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (level) {
        params.set("level", level);
      } else {
        params.delete("level");
      }
      // Reset page when filtering
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <>
      {/* Mobile Swipeable Pills - hidden on md and up */}
      <div className="md:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide flex items-center gap-2 mt-4 relative z-0">
        {levels.map((lvl) => (
          <button
            key={lvl.value}
            onClick={() => handleLevelChange(lvl.value)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95 border ${
              currentLevel === lvl.value
                ? "bg-CPEGold text-white border-transparent shadow-md"
                : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
            }`}
          >
            {lvl.value ? `${lvl.value}L` : "All"}
          </button>
        ))}
      </div>

      {/* Desktop Dropdown - hidden on small screens */}
      <div className="hidden md:flex items-center">
        <select
          value={currentLevel}
          onChange={(e) => handleLevelChange(e.target.value)}
          className="bg-white/10 text-white font-medium px-4 py-2 rounded-xl outline-none border border-white/20 focus:border-white/40 cursor-pointer appearance-none transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.7rem top 50%",
            backgroundSize: "0.65rem auto",
            paddingRight: "2.5rem"
          }}
        >
          {levels.map((lvl) => (
            <option key={lvl.value} value={lvl.value} className="text-slate-800">
              {lvl.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTaxonomy } from "@/hooks/use-taxonomy";
import { useOrgMetadata } from "@/components/OrgMetadataProvider";

interface CourseSemesterFilterProps {
  currentSemester?: string;
  showAllOption?: boolean;
}

export default function CourseSemesterFilter({
  currentSemester = "1",
  showAllOption = true,
}: CourseSemesterFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taxonomy = useTaxonomy();
  const { institutionType } = useOrgMetadata();

  const selectedSemester = searchParams.get("semester") || "";

  // Dynamic term names based on institution type
  const isUniversity = institutionType === "UNIVERSITY_DEPARTMENT" || !institutionType;
  const isSecondary = institutionType === "SECONDARY_SCHOOL" || institutionType === "PRIMARY_SCHOOL";

  const getSemesterLabel = (sem: string) => {
    if (isUniversity) {
      return sem === "1" ? "Harmattan (1st)" : "Rain (2nd)";
    } else if (isSecondary) {
      return sem === "1" ? "1st Term" : sem === "2" ? "2nd Term" : "3rd Term";
    }
    return `Session ${sem}`;
  };

  const options = [
    { value: "", label: `Active (${getSemesterLabel(currentSemester)})` },
    { value: "1", label: getSemesterLabel("1") },
    { value: "2", label: getSemesterLabel("2") },
  ];

  if (isSecondary) {
    options.push({ value: "3", label: getSemesterLabel("3") });
  }

  if (showAllOption) {
    options.push({ value: "all", label: `All ${taxonomy.term}s` });
  }

  const handleSemesterChange = useCallback(
    (sem: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sem) {
        params.set("semester", sem);
      } else {
        params.delete("semester");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <>
      {/* Mobile Swipeable Pills */}
      <div className="md:hidden w-full overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide flex items-center gap-2 mt-2 relative z-0">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSemesterChange(opt.value)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
              selectedSemester === opt.value
                ? "bg-CPEGold text-white border-transparent shadow-md"
                : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Desktop Dropdown */}
      <div className="hidden md:flex items-center">
        <select
          value={selectedSemester}
          onChange={(e) => handleSemesterChange(e.target.value)}
          className="bg-white/10 text-white font-medium px-4 py-2 rounded-xl outline-none border border-white/20 focus:border-white/40 cursor-pointer appearance-none transition-colors text-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.7rem top 50%",
            backgroundSize: "0.65rem auto",
            paddingRight: "2.5rem",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-800">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

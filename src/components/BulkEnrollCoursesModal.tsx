"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { bulkEnrollLevelInCourses } from "@/lib/actions";
import { BookOpen, BookPlus, CheckSquare, RefreshCw, Square, Users, X } from "lucide-react";
import { useTaxonomy } from "@/hooks/use-taxonomy";

interface ClassOption {
  id: number;
  name: string;
  _count?: { students: number };
}

interface CourseOption {
  id: number;
  name: string;
  title?: string | null;
  level?: number | null;
  semester?: number | null;
}

interface BulkEnrollCoursesModalProps {
  classes: ClassOption[];
  courses: CourseOption[];
  currentSemester?: string;
}

export default function BulkEnrollCoursesModal({
  classes,
  courses,
  currentSemester = "1",
}: BulkEnrollCoursesModalProps) {
  const router = useRouter();
  const taxonomy = useTaxonomy();

  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | "">(classes[0]?.id || "");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSemNum = parseInt(currentSemester) || 1;

  // Filter courses by semester (or show matching)
  const currentSemCourses = courses.filter(
    (c) => c.semester === activeSemNum || c.semester === null
  );

  const toggleCourse = (id: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllSemesterCourses = () => {
    const semIds = currentSemCourses.map((c) => c.id);
    const allSelected = semIds.every((id) => selectedCourseIds.includes(id));
    if (allSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !semIds.includes(id)));
    } else {
      setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...semIds])));
    }
  };

  const handleEnroll = async () => {
    if (!selectedClassId) {
      toast.error(`Please select a ${taxonomy.class}`);
      return;
    }
    if (selectedCourseIds.length === 0) {
      toast.error(`Please select at least one ${taxonomy.subject}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bulkEnrollLevelInCourses(Number(selectedClassId), selectedCourseIds);
      if (res.success) {
        toast.success((res as any).message || "Bulk enrollment successful!");
        setOpen(false);
        setSelectedCourseIds([]);
        router.refresh();
      } else {
        toast.error((res as any).messages ? (res as any).messages[0] : "Enrollment failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-2"
      >
        <BookPlus className="w-4 h-4 text-CPEGold" />
        <span>Bulk Enroll Level</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-CPENavy/10 text-CPENavy rounded-2xl">
                  <BookPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Bulk {taxonomy.subject} Enrollment
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Enroll an entire {taxonomy.class} into active semester {taxonomy.subject.toLowerCase()}s
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 overflow-y-auto flex-1 pr-1">
              {/* Select Target Level/Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Target {taxonomy.class} / Level
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-CPENavy text-sm"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls._count?.students !== undefined ? `(${cls._count.students} students)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Select {taxonomy.subject}s ({selectedCourseIds.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={selectAllSemesterCourses}
                    className="text-xs font-bold text-CPENavy hover:underline flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Toggle Active {taxonomy.term} {taxonomy.subject}s</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {courses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    const isCurrentSem = course.semester === activeSemNum || course.semester === null;

                    return (
                      <div
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-CPENavy/5 border-CPENavy/30"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-CPENavy flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate">{course.name}</p>
                            <p className="text-xs text-slate-400 truncate">{course.title || "No course description"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCurrentSem && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                              Active {taxonomy.term}
                            </span>
                          )}
                          {course.level && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {course.level}L
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isSubmitting || selectedCourseIds.length === 0}
                className="px-6 py-2.5 rounded-xl bg-CPENavy hover:bg-CPENavyDark disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <span>Enroll {taxonomy.class}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

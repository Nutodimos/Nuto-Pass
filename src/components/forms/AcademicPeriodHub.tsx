"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { advanceSemester, rolloverAcademicSessionAndPromote, updateSchoolConfig } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Calendar, ChevronRight, GraduationCap, RefreshCw, Shield, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { useTaxonomy } from "@/hooks/use-taxonomy";

interface AcademicPeriodHubProps {
  currentSession: string;
  currentSemester: string;
  semesterText: string;
  totalStudents: number;
  totalCourses: number;
  activeSessionsList: string[];
}

export default function AcademicPeriodHub({
  currentSession,
  currentSemester,
  semesterText,
  totalStudents,
  totalCourses,
  activeSessionsList,
}: AcademicPeriodHubProps) {
  const router = useRouter();
  const taxonomy = useTaxonomy();

  const [isAdvancingSem, setIsAdvancingSem] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedTargetSem, setSelectedTargetSem] = useState(currentSemester === "1" ? "2" : "1");

  const [isRollingOverSession, setIsRollingOverSession] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState(() => {
    // Generate next session suggestion (e.g. 2024/25 -> 2025/26)
    const match = currentSession.match(/(\d{4})\/(\d{2,4})/);
    if (match) {
      const startYear = parseInt(match[1]) + 1;
      const endYear = parseInt(match[2].length === 2 ? match[2] : match[2].slice(-2)) + 1;
      return `${startYear}/${String(endYear).padStart(2, "0")}`;
    }
    return "2025/26";
  });
  const [promoteStudents, setPromoteStudents] = useState(true);

  // Manual Form State
  const [manualState, manualFormAction] = useFormState(updateSchoolConfig, {
    success: false,
    error: false,
  });

  const handleAdvanceSemester = async () => {
    setIsAdvancingSem(true);
    try {
      const res = await advanceSemester(selectedTargetSem);
      if (res.success) {
        toast.success((res as any).message || "Semester transitioned successfully!");
        setShowAdvanceModal(false);
        router.refresh();
      } else {
        toast.error((res as any).messages ? (res as any).messages[0] : "Failed to advance semester");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during semester transition");
    } finally {
      setIsAdvancingSem(false);
    }
  };

  const handleRolloverSession = async () => {
    setIsRollingOverSession(true);
    try {
      const res = await rolloverAcademicSessionAndPromote(newSessionInput, promoteStudents);
      if (res.success) {
        toast.success((res as any).message || "Academic session rollover complete!");
        setShowSessionModal(false);
        router.refresh();
      } else {
        toast.error((res as any).messages ? (res as any).messages[0] : "Session rollover failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during session rollover");
    } finally {
      setIsRollingOverSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-br from-CPENavy via-CPENavyDark to-CPENavy rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Active Academic Period
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{currentSession} Academic Session</h2>
            <p className="text-white/80 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-CPEGold" />
              <span>{semesterText}</span>
              <span className="text-white/40">•</span>
              <span>{totalCourses} Active {taxonomy.subject}s</span>
              <span className="text-white/40">•</span>
              <span>{totalStudents} {taxonomy.student}s</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvanceModal(true)}
              className="px-5 py-3 rounded-2xl bg-white text-CPENavy font-bold text-sm shadow-md hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-CPEGold" />
              <span>Advance {taxonomy.term}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSessionModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Annual Session Rollover</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIFECYCLE WIZARDS DESCRIPTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Semester Wizard Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Next {taxonomy.term} Rollover</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Transition the institution to the next {taxonomy.term.toLowerCase()}. Automatically snapshots past attendance, closes active attendance sessions, and refreshes the course schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanceModal(true)}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-CPENavy hover:bg-CPENavy/5 text-CPENavy font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Launch {taxonomy.term} Wizard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Annual Session Wizard Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Annual Progression & Promotion</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Conclude the current academic session. Promotes all active {taxonomy.student.toLowerCase()}s to their next {taxonomy.class.toLowerCase()} (e.g. 100L $\rightarrow$ 200L), graduates finalists, and starts the new year.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-CPENavy hover:bg-CPENavyDark text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Annual Rollover Wizard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. ADVANCE SEMESTER MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Advance {taxonomy.term}</h3>
                <p className="text-xs text-slate-400 font-medium">Academic Session: {currentSession}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>Past attendance sessions will be tagged and archived under <strong>{currentSession} • {semesterText}</strong>.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>Any ongoing biometric verify commands will be closed and reset to idle.</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-CPENavy flex-shrink-0 mt-0.5" />
                <p>Active course schedules and weekly timetables will switch to the target {taxonomy.term.toLowerCase()}.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Target {taxonomy.term}
              </label>
              <select
                value={selectedTargetSem}
                onChange={(e) => setSelectedTargetSem(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-CPENavy text-sm"
              >
                <option value="1">1st / Harmattan {taxonomy.term}</option>
                <option value="2">2nd / Rain {taxonomy.term}</option>
                <option value="3">3rd {taxonomy.term} (if applicable)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                disabled={isAdvancingSem}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdvanceSemester}
                disabled={isAdvancingSem}
                className="px-6 py-2.5 rounded-xl bg-CPENavy hover:bg-CPENavyDark text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                {isAdvancingSem ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Transition</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANNUAL SESSION ROLLOVER MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Annual Session Rollover</h3>
                <p className="text-xs text-slate-400 font-medium">Promote {taxonomy.student}s & Start New Academic Year</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  New Academic Session
                </label>
                <input
                  type="text"
                  value={newSessionInput}
                  onChange={(e) => setNewSessionInput(e.target.value)}
                  placeholder="e.g. 2025/26"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-CPENavy text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoteStudents}
                    onChange={(e) => setPromoteStudents(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-CPENavy focus:ring-CPENavy/20 border-slate-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Batch Promote All {taxonomy.student} Levels</p>
                    <p className="text-[11px] text-slate-600">
                      Advances 100L $\rightarrow$ 200L, 200L $\rightarrow$ 300L, etc. Highest level {taxonomy.student.toLowerCase()}s will be marked as Graduated.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                disabled={isRollingOverSession}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRolloverSession}
                disabled={isRollingOverSession}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center gap-2"
              >
                {isRollingOverSession ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Rollover...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Rollover</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

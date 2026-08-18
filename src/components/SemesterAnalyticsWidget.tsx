import prisma from "@/lib/prisma";
import { BookOpen, CheckCircle, TrendingUp, Users, AlertTriangle } from "lucide-react";

interface SemesterAnalyticsWidgetProps {
  currentSession: string;
  currentSemester: string;
  semesterText: string;
  organizationId?: string;
}

export default async function SemesterAnalyticsWidget({
  currentSession,
  currentSemester,
  semesterText,
  organizationId,
}: SemesterAnalyticsWidgetProps) {
  const semInt = parseInt(currentSemester) || 1;

  const orgFilter = organizationId ? { organizationId } : {};

  // Fetch all attendance records for the active session and semester
  const [semesterAttendances, allSessionAttendances, coursesInSemester, activeStudentsCount] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        ...orgFilter,
        academicSession: currentSession,
        semester: semInt,
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: {
        ...orgFilter,
        academicSession: currentSession,
      },
      select: {
        present: true,
      },
    }),
    prisma.subject.count({
      where: {
        ...orgFilter,
        isActive: true,
        OR: [{ semester: semInt }, { semester: null }],
      },
    }),
    prisma.student.count({
      where: {
        ...orgFilter,
        isActive: true,
      },
    }),
  ]);

  // Semester metrics
  const totalSemesterLogs = semesterAttendances.length;
  const presentSemesterLogs = semesterAttendances.filter((a) => a.present).length;
  const semesterAvgPct = totalSemesterLogs > 0 ? Math.round((presentSemesterLogs / totalSemesterLogs) * 100) : 0;

  // Full session metrics
  const totalSessionLogs = allSessionAttendances.length;
  const presentSessionLogs = allSessionAttendances.filter((a) => a.present).length;
  const sessionAvgPct = totalSessionLogs > 0 ? Math.round((presentSessionLogs / totalSessionLogs) * 100) : 0;

  // Breakdown by course
  const courseMap: Record<string, { title: string; present: number; total: number }> = {};
  // Breakdown by class / level
  const classMap: Record<string, { name: string; present: number; total: number }> = {};

  semesterAttendances.forEach((att) => {
    const courseKey = att.lesson?.subject?.name || "Unknown Course";
    if (!courseMap[courseKey]) {
      courseMap[courseKey] = {
        title: att.lesson?.subject?.title || courseKey,
        present: 0,
        total: 0,
      };
    }
    courseMap[courseKey].total += 1;
    if (att.present) courseMap[courseKey].present += 1;

    const className = att.lesson?.class?.name || "General";
    if (!classMap[className]) {
      classMap[className] = { name: className, present: 0, total: 0 };
    }
    classMap[className].total += 1;
    if (att.present) classMap[className].present += 1;
  });

  const courseList = Object.entries(courseMap).map(([name, stat]) => ({
    name,
    title: stat.title,
    pct: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0,
    total: stat.total,
  })).sort((a, b) => b.pct - a.pct);

  const topCourses = courseList.slice(0, 3);
  const lowCourses = courseList.filter(c => c.pct < 70).slice(0, 3);

  const classList = Object.values(classMap).map((stat) => ({
    name: stat.name,
    pct: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0,
    total: stat.total,
  })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-800 text-lg">
              {semesterText} Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Academic Session {currentSession} • Real-time Attendance & Activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-CPENavy/10 text-CPENavy rounded-full">
            {coursesInSemester} Active Courses
          </span>
          <span className="text-xs font-bold px-3 py-1 bg-CPEGold/15 text-CPEGold rounded-full">
            {activeStudentsCount} Students
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Semester Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-800">{semesterAvgPct}%</h4>
            <span className={`text-xs font-bold ${semesterAvgPct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {semesterAvgPct >= 70 ? 'Good' : 'At Risk (<70%)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{presentSemesterLogs} / {totalSemesterLogs} attendances</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Session Avg</span>
            <CheckCircle className="w-4 h-4 text-CPENavy" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-slate-800">{sessionAvgPct}%</h4>
            <span className="text-xs text-slate-500 font-medium">Cumulative</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all session terms</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Exam Ready ($\ge 70\%$)</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-emerald-600">
              {courseList.filter(c => c.pct >= 70).length}
            </h4>
            <span className="text-xs text-slate-500 font-medium">/ {courseList.length} Courses</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Meeting exam eligibility</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Flagged Courses</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-red-600">{lowCourses.length}</h4>
            <span className="text-xs text-red-500 font-medium">Below 70%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Need attendance intervention</p>
        </div>
      </div>

      {/* Breakdown: Levels & Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Levels Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Attendance by Level / Class</h4>
          {classList.length === 0 ? (
            <p className="text-xs text-slate-400">No attendance data logged for levels yet.</p>
          ) : (
            <div className="space-y-2.5">
              {classList.map((cls) => (
                <div key={cls.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 font-bold">{cls.name}</span>
                    <span className={`font-bold ${cls.pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {cls.pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cls.pct >= 70 ? 'bg-emerald-500' : cls.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${cls.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top & Low Courses */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Course Attendance Summary</h4>
          {courseList.length === 0 ? (
            <p className="text-xs text-slate-400">No course sessions logged yet this semester.</p>
          ) : (
            <div className="space-y-2">
              {courseList.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-CPENavy/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-CPENavy" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.title}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    c.pct >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {c.pct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

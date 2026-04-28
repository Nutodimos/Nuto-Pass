import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, BookOpen, AlertCircle, FileText, CheckCircle2, User as UserIcon, CalendarX2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import FormContainer from "@/components/FormContainer";
import AssignmentGradeModal from "./AssignmentGradeModal";

const AssignmentDetailsPage = async ({ params }: { params: { id: string } }) => {
    const assignmentId = parseInt(params.id);

    // 1. Fetch Assignment Data & Relations
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            subject: {
                include: {
                    teachers: true
                }
            },
            submissions: {
                include: {
                    student: true
                }
            }
        },
    });

    if (!assignment) return notFound();

    // 2. Fetch Roster: Find all lessons for this subject, get their classes, and flatten the students.
    const subjectLessons = await prisma.lesson.findMany({
        where: { subjectId: assignment.subjectId },
        include: {
            class: {
                include: {
                    students: true
                }
            }
        }
    });

    const allStudentsMap = new Map();
    subjectLessons.forEach(lesson => {
        lesson.class.students.forEach(student => {
            if (!allStudentsMap.has(student.id)) {
                allStudentsMap.set(student.id, student);
            }
        });
    });
    const rosterStudents = Array.from(allStudentsMap.values());

    // 3. Role Permissions
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    const isPastDue = new Date(assignment.dueDate) < new Date();

    // Calculate submission statistics
    const totalStudents = rosterStudents.length;
    const totalSubmissions = assignment.submissions.length;
    const gradedSubmissions = assignment.submissions.filter(sub => sub.grade !== null).length;

    // For a student, find their specific submission
    const mySubmission = role === "student"
        ? assignment.submissions.find(sub => sub.studentId === currentUserId)
        : null;

    return (
        <div className="flex-1 p-4 flex flex-col gap-6 bg-[#F7F8FA] min-h-screen">
            {/* Header / Breadcrumb Area */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link href="/list/assignments" className="hover:text-CPENavy transition-colors">Assignments</Link>
                <span>/</span>
                <span className="font-semibold text-slate-800 break-words line-clamp-1">{assignment.title}</span>
            </div>

            {/* SECTION 1: TOP HERO STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Profile Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold shadow-inner border border-white/10 shrink-0">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/20 ${isPastDue
                                            ? 'bg-red-500/20 text-red-100'
                                            : 'bg-emerald-500/20 text-emerald-100'
                                            }`}>
                                            {isPastDue ? <CalendarX2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {isPastDue ? 'Past Due' : 'Active'}
                                        </div>
                                        <span className="text-white/80 font-medium text-sm border-l border-white/20 pl-2">
                                            {assignment.subject.name}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight line-clamp-2">{assignment.title}</h1>
                                </div>
                            </div>

                            {(role === "admin" || role === "teacher") && (
                                <div className="flex gap-2">
                                    <FormContainer table="assignment" type="update" data={assignment} />
                                    <FormContainer table="assignment" type="delete" id={assignment.id} />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 mt-auto">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20">
                                {assignment.subject.teachers && assignment.subject.teachers.length > 0 && assignment.subject.teachers[0].img ? (
                                    <Image src={assignment.subject.teachers[0].img} alt="Lecturer" width={48} height={48} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-6 h-6 text-white/50" /></div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-0.5">Course Lecturer(s)</p>
                                <p className="font-bold text-lg leading-tight">
                                    {assignment.subject.teachers && assignment.subject.teachers.length > 0
                                        ? `${assignment.subject.teachers[0].name} ${assignment.subject.teachers[0].surname}`
                                        : "Unknown"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Metric Widgets */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0 ${isPastDue ? 'bg-red-50 text-red-500' : 'bg-CPEGold/10 text-CPEGold'}`}>
                            <CalendarDays className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-center md:text-left">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                        <h2 className={`text-2xl font-black leading-none ${isPastDue ? 'text-red-500' : 'text-slate-800'}`}>
                            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(assignment.dueDate)}
                        </h2>
                        <p className="text-sm text-slate-500 mt-2 font-medium">
                            Assigned on: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(assignment.startDate)}
                        </p>
                    </div>
                </div>

                {/* Submissions Stats / Personal Grade */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    {(role === "admin" || role === "teacher") ? (
                        <>
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 text-center md:text-left">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Submissions</p>
                                <div className="flex items-end gap-2">
                                    <h2 className="text-3xl font-black text-slate-800 leading-none">{totalSubmissions}</h2>
                                    <span className="text-slate-500 font-medium mb-0.5">/ {totalStudents}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${totalStudents > 0 ? (totalSubmissions / totalStudents) * 100 : 0}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium text-right">{gradedSubmissions} Graded</p>
                            </div>
                        </>
                    ) : (
                        // Student View
                        <>
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto md:mx-0 ${mySubmission ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                    {mySubmission ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">My Grade</p>
                                {mySubmission?.grade !== null && mySubmission?.grade !== undefined ? (
                                    <div className="flex items-end gap-2">
                                        <h2 className="text-4xl font-black text-emerald-600 leading-none">{mySubmission.grade}%</h2>
                                    </div>
                                ) : (
                                    <p className="text-lg font-bold text-slate-600">
                                        {mySubmission ? "Pending Grade" : "Not Submitted"}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SECTION 2: DESCRIPTION & SUBMISSIONS CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Description & Instructions */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <BookOpen className="w-5 h-5 text-CPENavy" /> Instructions
                        </h2>

                        {assignment.description ? (
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium whitespace-pre-wrap">
                                {assignment.description}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <FileText className="w-10 h-10 mb-3 opacity-50" />
                                <p className="font-medium">No instructions provided.</p>
                            </div>
                        )}

                        {assignment.attachmentUrl && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Attachments / Resources</h3>
                                <a
                                    href={assignment.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <FileText className="w-5 h-5" /> View Attached Material
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Interaction/Roster Area */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            {role === "student" ? "My Submission" : "Class Roster & Submissions"}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[600px] bg-white p-6">
                        {role === "student" ? (
                            // --- STUDENT SUBMISSION UI ---
                            <div className="flex flex-col h-full items-center text-center justify-center gap-4">
                                {mySubmission ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-2">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">Submitted Successfully</h3>
                                        <p className="text-slate-500 text-sm mb-4">
                                            You submitted this assignment on {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" }).format(mySubmission.submissionDate)}.
                                        </p>
                                        <a
                                            href={mySubmission.submissionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors mb-2"
                                        >
                                            View My Work
                                        </a>
                                        {mySubmission.feedback && (
                                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-left w-full border border-blue-100">
                                                <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Feedback from Lecturer</p>
                                                <p className="font-medium text-sm">{mySubmission.feedback}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">Ready to Submit?</h3>
                                        <p className="text-slate-500 text-sm mb-4">Upload your work online and provide the link here to submit.</p>

                                        {/* Needs a client component for submission form/modal */}
                                        <FormContainer table="assignmentSubmission" type="create" data={{ assignmentId: assignment.id, studentId: currentUserId }} />
                                    </>
                                )}
                            </div>
                        ) : (
                            // --- LECTURER/ADMIN ROSTER UI ---
                            <div className="flex flex-col gap-3">
                                {rosterStudents.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No students enrolled in this course.</p>
                                ) : (
                                    rosterStudents.map((student) => {
                                        const sub = assignment.submissions.find(s => s.studentId === student.id);
                                        return (
                                            <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                        {student.img ? (
                                                            <Image src={student.img} alt="" width={40} height={40} className="object-cover w-full h-full" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-5 h-5 text-slate-400" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800">{student.name} {student.surname}</p>
                                                        <p className={`text-xs font-semibold ${sub ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                            {sub ? 'Submitted' : 'Not Submitted'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {sub && (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-CPENavy hover:underline bg-CPENavy/10 px-2 py-1 rounded-md">View Link</a>
                                                        {sub.grade !== null ? (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-lg font-black text-emerald-600">{sub.grade}%</span>
                                                                {(role === "admin" || role === "teacher") && (
                                                                    <AssignmentGradeModal submission={sub} />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Grading action Needs a client component
                                                            <div className="mt-1">
                                                                {(role === "admin" || role === "teacher") ? (
                                                                    <AssignmentGradeModal submission={sub} />
                                                                ) : (
                                                                    <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Needs Grading</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AssignmentDetailsPage;

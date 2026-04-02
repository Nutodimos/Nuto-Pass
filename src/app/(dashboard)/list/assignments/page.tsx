import prisma from "@/lib/prisma";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BookMarked, CalendarDays, CheckCircle2, Clock, CalendarX2, BookOpen, AlertCircle, ClipboardList } from "lucide-react";

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AssignmentWhereInput = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.subject = { lessons: { some: { classId: parseInt(value) } } };
            break;
          case "teacherId":
            query.subject = { teachers: { some: { id: value } } };
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { subject: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.subject = { teachers: { some: { id: currentUserId! } } };
      break;
    case "student":
      query.subject = {
        lessons: {
          some: {
            class: {
              students: {
                some: { id: currentUserId! }
              }
            }
          }
        }
      };
      break;
    default:
      break;
  }

  const now = new Date();

  const [data, count, activeCount, pastDueCount] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        subject: {
          include: {
            teachers: { select: { name: true, surname: true } }
          }
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      // SORT BY COURSE (SUBJECT) THEN BY DUE DATE
      orderBy: [
        { subject: { name: 'asc' } },
        { dueDate: 'asc' }
      ]
    }),
    prisma.assignment.count({ where: query }),
    prisma.assignment.count({ where: { ...query, dueDate: { gte: now } } }),
    prisma.assignment.count({ where: { ...query, dueDate: { lt: now } } }),
  ]);

  // Group assignments by Course (Subject Name)
  const groupedAssignments = data.reduce((acc, assignment) => {
    const courseName = assignment.subject.name;
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(assignment);
    return acc;
  }, {} as Record<string, typeof data>);


  return (
    <div className="flex-1 p-6 flex flex-col gap-6 min-h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* HEADER */}
      <div className="bg-gradient-to-r from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Assignments</h1>
              <p className="text-white/80 text-sm">{count} assignments total</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <TableSearch />
            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK STATS ROW --- */}
      {count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cpe-card p-5 flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 rounded-full bg-CPENavy/10 text-CPENavy flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Assigned</p>
              <h2 className="text-2xl font-black text-slate-800 leading-none">{count}</h2>
            </div>
            <div className="cpe-card-indicator bg-gradient-to-r from-CPENavy to-slate-800" />
          </div>

          <div className="cpe-card p-5 flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Active / Upcoming</p>
              <h2 className="text-2xl font-black text-slate-800 leading-none">{activeCount}</h2>
            </div>
            <div className="cpe-card-indicator bg-gradient-to-r from-emerald-400 to-emerald-500" />
          </div>

          <div className="cpe-card p-5 flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Past Due</p>
              <h2 className="text-2xl font-black text-slate-800 leading-none">{pastDueCount}</h2>
            </div>
            <div className="cpe-card-indicator bg-gradient-to-r from-red-400 to-red-500" />
          </div>
        </div>
      )}

      {/* --- ASSIGNMENTS GROUPED BY COURSE --- */}
      <div className="flex w-full flex-col gap-8 mt-2">
        {Object.keys(groupedAssignments).length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full text-center py-20 px-6">
            <div className="w-24 h-24 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 mb-6 border-4 border-white shadow-sm">
              <BookMarked className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">You&apos;re All Caught Up</h3>
            <p className="text-slate-500 max-w-sm mt-2 text-base font-medium">There are no assignments scheduled. Kick back and relax, or create one using the plus icon above!</p>
          </div>
        ) : (
          Object.entries(groupedAssignments).map(([courseName, courseAssignments]) => (
            <div key={courseName} className="flex flex-col gap-4">
              {/* Course Section Header */}
              <div className="flex items-center gap-3 border-b-2 border-slate-200/60 pb-2 pl-2">
                <div className="w-8 h-8 rounded-lg bg-CPENavy text-white flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-slate-50">
                  {courseName[0]}
                </div>
                <h2 className="text-xl font-black text-CPENavy tracking-tight">Course: {courseName}</h2>
                <span className="ml-auto bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">{courseAssignments.length} Assignments</span>
              </div>

              {/* Assignments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courseAssignments.map((assignment) => {
                  const isPastDue = new Date(assignment.dueDate) < now;

                  return (
                    <div key={assignment.id} className="cpe-card p-5 group flex flex-col h-full border hover:border-emerald-500/30 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-3xl">

                      {/* Card Header (Status + Actions) */}
                      <div className="flex justify-between items-start mb-3 relative z-20">
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${isPastDue
                          ? 'bg-slate-50 text-slate-500 border-slate-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                          {isPastDue ? <CalendarX2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isPastDue ? 'Past Due' : 'Active'}
                        </div>

                        {(role === "admin" || role === "teacher") && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FormContainer table="assignment" type="update" data={assignment} />
                            <FormContainer table="assignment" type="delete" id={assignment.id} />
                          </div>
                        )}
                      </div>

                      <Link href={`/list/assignments/${assignment.id}`} className="flex-1 flex flex-col relative z-10">
                        {/* Title */}
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight mb-4 flex-1 group-hover:text-emerald-600 transition-colors">
                          {assignment.title}
                        </h3>

                        {/* Details */}
                        <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Course</span>
                            <span className="font-semibold text-slate-700">{assignment.subject.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Due</span>
                            <span className={`font-semibold ${isPastDue ? 'text-red-500' : 'text-slate-700'}`}>
                              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className={`cpe-card-indicator z-0 opacity-50 ${isPastDue ? 'bg-slate-300' : ''}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- PAGINATION --- */}
      {count > ITEM_PER_PAGE && (
        <div className="mt-4 w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <Pagination page={p} count={count} />
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {(role === "admin" || role === "teacher") && (
        <div className="fixed bottom-24 md:bottom-8 right-8 z-50 group">
          <div className="relative">
            <div className="absolute inset-0 bg-CPEGold rounded-full animate-ping opacity-75"></div>
            <div className="relative">
              <FormContainer table="assignment" type="create" />
            </div>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                Create Assignment
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-slate-800"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentListPage;

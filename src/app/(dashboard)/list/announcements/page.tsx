import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import FormContainer from "@/components/FormContainer";
import {
  Megaphone,
  Users,
  GraduationCap,
  Globe,
  Plus,
  Check,
} from "lucide-react";
import MarkReadButton from "@/components/MarkReadButton";

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, search, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.AnnouncementWhereInput = {};

  if (search) {
    query.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Role-based filtering for Class
  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
  };

  // Role-based filtering for Subject
  const subjectConditions = {
    teacher: { teachers: { some: { id: currentUserId! } } },
    student: { enrollments: { some: { studentId: currentUserId! } } },
  };

  // Filter based on target audience
  const audienceFilter: any[] = [{ targetAudience: "all" }];

  if (role === "student") {
    audienceFilter.push({ targetAudience: "students" });
  } else if (role === "teacher") {
    audienceFilter.push({ targetAudience: "teachers" });
  }

  const finalQuery = {
    ...query,
    AND: [
      { OR: audienceFilter },
      {
        OR: [
          { classId: null, subjectId: null },
          { class: roleConditions[role as keyof typeof roleConditions] || {} },
          {
            subject:
              subjectConditions[role as keyof typeof subjectConditions] || {},
          },
        ],
      },
    ],
  };

  const data = await prisma.announcement.findMany({
    where: finalQuery,
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      targetAudience: true,
      classId: true,
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
      reads: {
        where: { userId: currentUserId || "" },
        select: { id: true },
      },
    },
  });

  // Get read statuses
  const readStatuses = new Map(data.map((a) => [a.id, a.reads.length > 0]));
  const announcements = data.map(({ reads, ...rest }) => rest);

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "students":
        return <GraduationCap className="w-4 h-4" />;
      case "teachers":
        return <Users className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "students":
        return "bg-blue-100 text-blue-600";
      case "teachers":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-green-100 text-green-600";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-md flex-1 m-4 mt-0 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-xl shadow-lg">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 bg-gradient-to-r from-CPENavy to-CPENavyDark bg-clip-text text-transparent">
              Announcements
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {data.length} announcement{data.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {currentUserId && data.length > 0 && (
          <MarkReadButton isAll />
        )}
      </div>

      {/* ANNOUNCEMENTS GRID */}
      <div className="space-y-4 pb-20">
        {data.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Megaphone className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No announcements yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {role === "admin" || role === "teacher"
                ? "Start by creating your first announcement using the button below"
                : "Check back later for important updates and notifications"}
            </p>
          </div>
        ) : (
          announcements.map((announcement, index) => {
            const isRead = readStatuses.get(announcement.id);
            return (
              <div
                key={announcement.id}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                className={`border ${isRead ? "border-slate-200 bg-slate-50/50" : "border-slate-200 bg-white"} rounded-2xl p-5 hover:shadow-xl hover:border-CPENavy/30 hover:-translate-y-1 transition-all duration-300 group animate-fadeInUp`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl group-hover:from-CPENavy group-hover:to-CPENavyDark transition-all duration-300 ${
                        isRead
                          ? "bg-slate-100 text-slate-400"
                          : "bg-gradient-to-br from-CPENavy/10 to-CPENavy/5 text-CPENavy"
                      }`}
                    >
                      <Megaphone
                        className={`w-5 h-5 group-hover:text-white transition-colors duration-300`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <h3
                          className={`font-bold text-lg mb-2 group-hover:text-CPENavy transition-colors ${
                            isRead ? "text-slate-600" : "text-slate-800"
                          }`}
                        >
                          {announcement.title}
                        </h3>
                        {isRead && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Read
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          isRead ? "text-slate-500" : "text-slate-600"
                        }`}
                      >
                        {announcement.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!isRead && currentUserId && (
                      <MarkReadButton announcementId={announcement.id} />
                    )}
                    {role === "admin" && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FormContainer
                          table="announcement"
                          type="update"
                          data={announcement}
                        />
                        <FormContainer
                          table="announcement"
                          type="delete"
                          id={announcement.id}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* META INFO */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(announcement.date)}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${getAudienceColor(
                      announcement.targetAudience,
                    )}`}
                  >
                    {getAudienceIcon(announcement.targetAudience)}
                    <span className="capitalize">
                      {announcement.targetAudience}
                    </span>
                  </div>

                  {announcement.class && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>{announcement.class.name}</span>
                    </div>
                  )}

                  {announcement.subject && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span>{announcement.subject.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) - For admin and teacher */}
      {(role === "admin" || role === "teacher") && (
        <div className="fixed bottom-24 md:bottom-8 right-8 z-50 group">
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 bg-CPEGold rounded-full animate-ping opacity-75"></div>

            {/* Main FAB button */}
            <div className="relative">
              <FormContainer table="announcement" type="create" />
            </div>

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                Create New Announcement
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

export default AnnouncementListPage;


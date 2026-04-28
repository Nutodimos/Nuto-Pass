import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import MarkReadButton from "./MarkReadButton";
import { Check } from "lucide-react";

/**
 * Announcements Widget
 * Displays the latest unread announcements for the current user.
 * Integrated with read tracking to reduce notification clutter.
 */
const Announcements = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: userId! } } },
    student: { students: { some: { id: userId! } } },
  };

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: {
      ...(role !== "admin" && {
        OR: [
          { classId: null },
          { class: roleConditions[role as keyof typeof roleConditions] || {} },
        ],
      }),
    },
    select: {
        id: true,
        title: true,
        description: true,
        date: true,
        reads: {
            where: { userId: userId || "" },
            select: { id: true },
        },
    }
  });

  const announcements = data.map(({ reads, ...rest }) => ({
    ...rest,
    isRead: reads.length > 0,
  }));

  return (
    <div className="group cpe-card p-6">
      <div className="group cpe-card-indicator"></div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h1 className="text-xl font-bold text-slate-800">Announcements</h1>
        <a href="/list/announcements" className="text-sm font-medium text-CPENavy hover:text-CPENavyDark hover:underline transition-colors">
          View All
        </a>
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {announcements.length > 0 ? (
          announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`rounded-2xl p-4 border transition-all duration-300 group relative ${
                  announcement.isRead 
                  ? "bg-slate-50/50 border-slate-100" 
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <h2 className={`font-bold transition-colors line-clamp-1 ${announcement.isRead ? "text-slate-500" : "text-slate-800 group-hover:text-CPENavy"}`}>
                        {announcement.title}
                    </h2>
                    {announcement.isRead && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                            <Check className="w-3 h-3" /> Read
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {new Intl.DateTimeFormat("en-GB", { month: 'short', day: 'numeric' }).format(announcement.date)}
                </span>
              </div>
              <p className={`text-sm line-clamp-2 leading-relaxed ${announcement.isRead ? "text-slate-400" : "text-slate-500"}`}>
                  {announcement.description}
              </p>
              
              {!announcement.isRead && userId && (
                  <div className="mt-3 flex justify-end">
                      <MarkReadButton announcementId={announcement.id} />
                  </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm italic font-medium">No recent announcements</div>
        )}
      </div>
    </div>
  );
};

export default Announcements;

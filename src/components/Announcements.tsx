import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
  });

  return (
    <div className="group cpe-card p-6">
      <div className="group cpe-card-indicator"></div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h1 className="text-xl font-bold text-slate-800">Announcements</h1>
        <a href="/list/announcements" className="text-sm font-medium text-CPENavy hover:text-CPENavyDark hover:underline">
          View All
        </a>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.length > 0 ? (
          data.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all duration-200 group ${index % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-800 group-hover:text-CPENavy transition-colors line-clamp-1">{announcement.title}</h2>
                <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {new Intl.DateTimeFormat("en-GB", { month: 'short', day: 'numeric' }).format(announcement.date)}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{announcement.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">No announcements</div>
        )}
      </div>
    </div>
  );
};

export default Announcements;

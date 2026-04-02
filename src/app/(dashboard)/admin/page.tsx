import prisma from "@/lib/prisma";
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import UserCard from "@/components/UserCard";
import AttendanceOverviewCard from "@/components/AttendanceOverviewCard";
import RecentActivitiesCard from "@/components/RecentActivitiesCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Suspense } from "react";

const AdminPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  return (
    <div className="p-3 md:p-4 flex gap-4 md:gap-4 flex-col md:flex-row bg-slate-50/50 min-h-screen">
      {/* LEFT COLUMN (2/3) */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS SECTION */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory">
          <div className="snap-center shrink-0 w-[85%] md:w-auto md:flex-1">
            <UserCard type="admin" />
          </div>
          <div className="snap-center shrink-0 w-[85%] md:w-auto md:flex-1">
            <UserCard type="teacher" />
          </div>
          <div className="snap-center shrink-0 w-[85%] md:w-auto md:flex-1">
            <UserCard type="student" />
          </div>
        </div>

        {/* MIDDLE SECTION - ATTENDANCE OVERVIEW & CHART */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* ATTENDANCE OVERVIEW */}
          <div className="w-full lg:w-1/2">
            <Suspense fallback={<LoadingSkeleton type="card" />}>
              <AttendanceOverviewCard />
            </Suspense>
          </div>
          {/* ATTENDANCE CHART (Replaces Activities) */}
          <div className="w-full lg:w-1/2 h-[280px] md:h-[450px]">
            <Suspense fallback={<LoadingSkeleton type="chart" />}>
              <AttendanceChartContainer />
            </Suspense>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="w-full">
          <QuickActionsCard />
        </div>
      </div>

      {/* RIGHT COLUMN (1/3) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <Suspense fallback={<LoadingSkeleton type="announcements" />}>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminPage;

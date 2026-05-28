import { getSuperAdminStats } from "@/lib/super-admin-actions";
import { Building2, Users, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const stats = await getSuperAdminStats();

  if (!stats) {
    return <p className="text-red-400">Unauthorized</p>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform overview across all organisations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Organisations", value: stats.orgCount, icon: Building2, color: "from-violet-500 to-purple-600" },
          { label: "Admin Users", value: stats.userCount, icon: Users, color: "from-blue-500 to-cyan-600" },
          { label: "Lecturers", value: stats.teacherCount, icon: BookOpen, color: "from-emerald-500 to-teal-600" },
          { label: "Students", value: stats.studentCount, icon: GraduationCap, color: "from-amber-500 to-orange-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Organisations */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Organisations</h2>
          <Link
            href="/super-admin/organisations"
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {stats.recentOrgs.map((org: any) => (
            <Link
              key={org.id}
              href={`/super-admin/organisations/${org.id}`}
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{org.name}</p>
                  <p className="text-sm text-slate-500">/{org.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{org._count.teachers} lecturers</span>
                <span>{org._count.students} students</span>
                <span className="text-xs text-slate-600">
                  {new Date(org.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {stats.recentOrgs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No organisations yet.{" "}
              <Link href="/super-admin/organisations/new" className="text-violet-400 hover:underline">
                Create the first one
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

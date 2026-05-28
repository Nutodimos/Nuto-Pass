import { getOrganizationById, deactivateOrganization } from "@/lib/super-admin-actions";
import { Building2, ArrowLeft, Users, GraduationCap, BookOpen, Layers, Shield, Mail, Trash2, Palette, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteOrgButton } from "@/components/DeleteOrgButton";

export default async function OrganisationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getOrganizationById(params.id);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/organisations"
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              org.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              {org.isActive ? "Active" : "Inactive"}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400">
              {org.institutionType.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-slate-400 mt-1 font-mono text-sm">/{org.slug}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Lecturers", value: org._count.teachers, icon: BookOpen, color: "text-emerald-400" },
          { label: "Students", value: org._count.students, icon: GraduationCap, color: "text-amber-400" },
          { label: "Courses", value: org._count.subjects, icon: Layers, color: "text-blue-400" },
          { label: "Levels", value: org._count.classes, icon: Users, color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Customize Card */}
      <Link
        href={`/super-admin/organisations/${org.id}/customize`}
        className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Customize Experience</p>
            <p className="text-sm text-slate-400">Configure institution type, navigation, features, and branding</p>
          </div>
        </div>
        <Settings className="w-5 h-5 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
      </Link>

      {/* Admin Users */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Admin Users
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {org.users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{user.name || user.email}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 font-medium">
                {user.role}
              </span>
            </div>
          ))}
          {org.users.length === 0 && (
            <div className="p-8 text-center text-slate-500">No admin users yet</div>
          )}
        </div>
      </div>

      {/* Org Info */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white mb-4">Organisation Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">ID</p>
            <p className="text-slate-300 font-mono">{org.id}</p>
          </div>
          <div>
            <p className="text-slate-500">Created</p>
            <p className="text-slate-300">{new Date(org.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500">Updated</p>
            <p className="text-slate-300">{new Date(org.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <Trash2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          Permanently delete this organization, including all its database records (students, lecturers, courses, attendances) and all its Clerk user accounts. This action is irreversible.
        </p>
        <DeleteOrgButton orgId={org.id} orgName={org.name} variant="button" />
      </div>
    </div>
  );
}

import { getOrganizations } from "@/lib/super-admin-actions";
import { Building2, Plus, Users, GraduationCap } from "lucide-react";
import Link from "next/link";
import { DeleteOrgButton } from "@/components/DeleteOrgButton";

export default async function OrganisationsPage() {
  const orgs = await getOrganizations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organisations</h1>
          <p className="text-slate-400 mt-1">{orgs.length} organisation{orgs.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Link
          href="/super-admin/organisations/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Organisation
        </Link>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-sm text-slate-400">
              <th className="px-6 py-4 font-medium">Organisation</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Admins</th>
              <th className="px-6 py-4 font-medium">Lecturers</th>
              <th className="px-6 py-4 font-medium">Students</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orgs.map((org: any) => (
              <tr key={org.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/super-admin/organisations/${org.id}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-white font-medium group-hover:text-violet-300 transition-colors">
                      {org.name}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm font-mono">{org.slug}</td>
                <td className="px-6 py-4 text-slate-300">{org._count.users}</td>
                <td className="px-6 py-4 text-slate-300">{org._count.teachers}</td>
                <td className="px-6 py-4 text-slate-300">{org._count.students}</td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    org.isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <DeleteOrgButton orgId={org.id} orgName={org.name} variant="icon" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No organisations yet. Click &ldquo;Create Organisation&rdquo; to get started.
          </div>
        )}
      </div>
    </div>
  );
}

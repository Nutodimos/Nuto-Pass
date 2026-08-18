"use client";

import { createOrganization } from "@/lib/super-admin-actions";
import { Building2, ArrowLeft, User, Mail, Type } from "lucide-react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewOrganisationPage() {
  const [state, formAction] = useFormState(createOrganization, {
    success: false,
    error: false,
  });
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [institutionType, setInstitutionType] = useState("UNIVERSITY_DEPARTMENT");

  useEffect(() => {
    if (state.success) {
      toast.success("Organisation onboarded successfully!");
      router.push("/super-admin/organisations");
    } else if (state.error) {
      toast.error(
        (state as any).messages
          ? (state as any).messages.join("\n")
          : "Failed to create organisation."
      );
    }
  }, [state, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/organisations"
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Organisation</h1>
          <p className="text-slate-400 mt-1">Onboard a new organisation and its first admin</p>
        </div>
      </div>

      <form action={formAction} className="rounded-2xl bg-white/5 border border-white/10 p-8 space-y-6">
        {/* Org Details */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            Organisation Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Organisation Name *</label>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. University of Ilorin — CPE"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">/org/</span>
                <input
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="unilorin-cpe"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Used in URLs. Auto-generated from name, editable.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Institution Type</label>
              <select
                name="institutionType"
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              >
                <option value="UNIVERSITY_DEPARTMENT" className="bg-slate-800">University Department</option>
                <option value="SECONDARY_SCHOOL" className="bg-slate-800">Secondary School</option>
                <option value="PRIMARY_SCHOOL" className="bg-slate-800">Primary School</option>
                <option value="TRAINING_CENTER" className="bg-slate-800">Training Center</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Determines taxonomy labels (e.g. Lecturer vs Teacher, Course vs Subject)</p>
            </div>
          </div>
        </div>

        {/* Admin Details */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            First Admin User
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
              <input
                name="adminFirstName"
                type="text"
                placeholder="John"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
              <input
                name="adminLastName"
                type="text"
                placeholder="Doe"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Admin Email *</label>
            <input
              name="adminEmail"
              type="email"
              required
              placeholder="admin@university.edu"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">A Clerk user will be created with this email.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Admin Username</label>
              <input
                name="adminUsername"
                type="text"
                placeholder="john_admin (optional)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">Will be auto-generated if left blank.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Admin Password</label>
              <input
                name="adminPassword"
                type="password"
                placeholder="•••••••• (optional)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">Will be auto-generated if left blank.</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {state.error && state.messages && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.messages.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
        >
          Create Organisation
        </button>
      </form>
    </div>
  );
}

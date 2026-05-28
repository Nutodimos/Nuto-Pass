"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical,
  Palette, ToggleLeft, Navigation, Loader2,
  Home, Users, GraduationCap, BookOpen, ClipboardList,
  Fingerprint, Megaphone, Settings, Layers, Presentation,
  Building2, FileText, Bell, BarChart3, Calendar
} from "lucide-react";
import { updateOrgMetadata } from "@/lib/super-admin-actions";
import type { InstitutionType, NavItem, OrgMetadata } from "@/types/organization";

const INSTITUTION_TYPES: { value: InstitutionType; label: string; description: string }[] = [
  { value: "UNIVERSITY_DEPARTMENT", label: "University Department", description: "Lecturers, Students, Courses, Levels, Semesters" },
  { value: "SECONDARY_SCHOOL", label: "Secondary School", description: "Teachers, Students, Classes, Subjects, Terms, Grades" },
  { value: "PRIMARY_SCHOOL", label: "Primary School", description: "Teachers, Pupils, Classes, Subjects, Terms, Grades" },
  { value: "TRAINING_CENTER", label: "Training Center", description: "Instructors, Trainees, Cohorts, Modules, Sessions" },
];

const GRADING_SCALES = [
  { value: "PERCENTAGE", label: "Percentage (0-100%)" },
  { value: "GPA_4_0", label: "GPA 4.0 Scale" },
  { value: "GPA_5_0", label: "GPA 5.0 Scale" },
] as const;

const AVAILABLE_ICONS = [
  "Home", "Users", "GraduationCap", "BookOpen", "ClipboardList",
  "Fingerprint", "Megaphone", "Settings", "Layers", "Presentation",
  "Building2", "FileText", "Bell", "BarChart3", "Calendar",
];

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Users, GraduationCap, BookOpen, ClipboardList,
  Fingerprint, Megaphone, Settings, Layers, Presentation,
  Building2, FileText, Bell, BarChart3, Calendar,
};

interface CustomizeFormProps {
  orgId: string;
  orgName: string;
  initialInstitutionType: InstitutionType;
  initialMetadata: Partial<OrgMetadata> | null;
}

export default function CustomizeForm({
  orgId,
  orgName,
  initialInstitutionType,
  initialMetadata,
}: CustomizeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"institution" | "features" | "navigation">("institution");

  // Form state
  const [institutionType, setInstitutionType] = useState<InstitutionType>(initialInstitutionType);
  const [primaryColor, setPrimaryColor] = useState(initialMetadata?.uiConfig?.primaryColor || "#7c3aed");
  const [logoUrl, setLogoUrl] = useState(initialMetadata?.uiConfig?.logoUrl || "");
  const [hasResults, setHasResults] = useState(initialMetadata?.features?.hasResults ?? true);
  const [hasHostels, setHasHostels] = useState(initialMetadata?.features?.hasHostels ?? false);
  const [gradingScale, setGradingScale] = useState<"PERCENTAGE" | "GPA_4_0" | "GPA_5_0">(
    initialMetadata?.features?.gradingScale || "PERCENTAGE"
  );
  const [navItems, setNavItems] = useState<NavItem[]>(initialMetadata?.uiConfig?.navItems || []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const metadata: Partial<OrgMetadata> = {
      institutionType,
      uiConfig: {
        primaryColor,
        logoUrl: logoUrl || undefined,
        navItems,
      },
      features: {
        hasResults,
        hasHostels,
        gradingScale,
      },
    };

    const result = await updateOrgMetadata(orgId, { institutionType, metadata });

    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.messages?.[0] || "Failed to save");
    }
  };

  const addNavItem = () => {
    setNavItems([...navItems, { label: "", href: "/", icon: "Home" }]);
  };

  const removeNavItem = (index: number) => {
    setNavItems(navItems.filter((_, i) => i !== index));
  };

  const updateNavItem = (index: number, field: keyof NavItem, value: string) => {
    const updated = [...navItems];
    updated[index] = { ...updated[index], [field]: value };
    setNavItems(updated);
  };

  const tabs = [
    { id: "institution" as const, label: "Institution & Branding", icon: Palette },
    { id: "features" as const, label: "Feature Flags", icon: ToggleLeft },
    { id: "navigation" as const, label: "Navigation", icon: Navigation },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/super-admin/organisations/${orgId}`}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Customize</h1>
          <p className="text-slate-400 mt-1">Configure how <span className="text-violet-400 font-medium">{orgName}</span> experiences the platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Configuration"}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Configuration saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">

        {/* ── Institution & Branding ── */}
        {activeTab === "institution" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Institution Type</h3>
              <p className="text-sm text-slate-400 mb-4">This determines taxonomy labels across the entire app</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INSTITUTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setInstitutionType(type.value)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      institutionType === type.value
                        ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/50"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <p className={`font-medium ${institutionType === type.value ? "text-violet-300" : "text-white"}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Branding</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Feature Flags ── */}
        {activeTab === "features" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Feature Toggles</h3>
              <div className="space-y-4">
                {[
                  { key: "hasResults", label: "Results Module", desc: "Enable result/grade entry and report generation", value: hasResults, setter: setHasResults },
                  { key: "hasHostels", label: "Hostels Module", desc: "Enable hostel/accommodation management", value: hasHostels, setter: setHasHostels },
                ].map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{feature.label}</p>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                    <button
                      onClick={() => feature.setter(!feature.value)}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        feature.value ? "bg-violet-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                          feature.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Grading Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GRADING_SCALES.map((scale) => (
                  <button
                    key={scale.value}
                    onClick={() => setGradingScale(scale.value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      gradingScale === scale.value
                        ? "border-violet-500 bg-violet-500/10 text-violet-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Items ── */}
        {activeTab === "navigation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Navigation Items</h3>
                <p className="text-sm text-slate-400">Configure the sidebar menu for this organization. Leave empty to use defaults.</p>
              </div>
              <button
                onClick={addNavItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {navItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Navigation className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No custom navigation configured.</p>
                <p className="text-sm mt-1">The default sidebar will be used.</p>
              </div>
            )}

            <div className="space-y-3">
              {navItems.map((item, index) => {
                const IconComp = iconComponents[item.icon] || Home;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 group"
                  >
                    <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />

                    {/* Icon Preview */}
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <IconComp className="w-4 h-4 text-violet-400" />
                    </div>

                    {/* Icon Select */}
                    <select
                      value={item.icon}
                      onChange={(e) => updateNavItem(index, "icon", e.target.value)}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-40"
                    >
                      {AVAILABLE_ICONS.map((icon) => (
                        <option key={icon} value={icon} className="bg-slate-800">{icon}</option>
                      ))}
                    </select>

                    {/* Label */}
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateNavItem(index, "label", e.target.value)}
                      placeholder="Label (e.g. Dashboard or Taxonomy.student)"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />

                    {/* Href */}
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateNavItem(index, "href", e.target.value)}
                      placeholder="/list/students"
                      className="w-44 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />

                    {/* Delete */}
                    <button
                      onClick={() => removeNavItem(index)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {navItems.length > 0 && (
              <p className="text-xs text-slate-500">
                Tip: Use <code className="text-violet-400">Taxonomy.student</code>, <code className="text-violet-400">Taxonomy.teacher</code> etc. as labels to auto-translate based on institution type.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

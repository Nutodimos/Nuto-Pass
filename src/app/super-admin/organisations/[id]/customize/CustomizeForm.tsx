"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical,
  Palette, ToggleLeft, Navigation, Loader2, Upload,
  Home, Users, GraduationCap, BookOpen, ClipboardList,
  Fingerprint, Megaphone, Settings, Layers, Presentation,
  Building2, FileText, Bell, BarChart3, Calendar, Smartphone,
  type LucideIcon
} from "lucide-react";
import { updateOrgMetadata } from "@/lib/super-admin-actions";
import type { InstitutionType, NavItem, OrgMetadata } from "@/types/organization";
import { toast } from "react-toastify";

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

const iconComponents: Record<string, LucideIcon> = {
  Home, Users, GraduationCap, BookOpen, ClipboardList,
  Fingerprint, Megaphone, Settings, Layers, Presentation,
  Building2, FileText, Bell, BarChart3, Calendar,
};

type TabId = "identity" | "features" | "navigation" | "mobile";

interface CustomizeFormProps {
  orgId: string;
  orgName: string;
  initialInstitutionType: InstitutionType;
  initialMetadata: Partial<OrgMetadata> | null;
}

export default function CustomizeForm({
  orgId, orgName, initialInstitutionType, initialMetadata,
}: CustomizeFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("identity");

  // Form state
  const [institutionType, setInstitutionType] = useState<InstitutionType>(initialInstitutionType);
  const [primaryColor, setPrimaryColor] = useState(initialMetadata?.uiConfig?.primaryColor || "#0A1E4B");
  const [accentColor, setAccentColor] = useState(initialMetadata?.uiConfig?.accentColor || "#B99146");
  const [logoUrl, setLogoUrl] = useState(initialMetadata?.uiConfig?.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(initialMetadata?.uiConfig?.faviconUrl || "");
  const [sidebarTitle, setSidebarTitle] = useState(initialMetadata?.uiConfig?.sidebarTitle || "");
  const [welcomeText, setWelcomeText] = useState(initialMetadata?.uiConfig?.welcomeText || "");
  const [hasResults, setHasResults] = useState(initialMetadata?.features?.hasResults ?? true);
  const [hasHostels, setHasHostels] = useState(initialMetadata?.features?.hasHostels ?? false);
  const [hasBiometrics, setHasBiometrics] = useState(initialMetadata?.features?.hasBiometrics ?? true);
  const [hasAssignments, setHasAssignments] = useState(initialMetadata?.features?.hasAssignments ?? true);
  const [hasMaterials, setHasMaterials] = useState(initialMetadata?.features?.hasMaterials ?? true);
  const [gradingScale, setGradingScale] = useState<"PERCENTAGE" | "GPA_4_0" | "GPA_5_0">(
    initialMetadata?.features?.gradingScale || "PERCENTAGE"
  );
  const [navItems, setNavItems] = useState<NavItem[]>(initialMetadata?.uiConfig?.navItems || []);
  const [bottomTabItems, setBottomTabItems] = useState<NavItem[]>(initialMetadata?.uiConfig?.bottomTabItems || []);

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingFavicon;
    const setUrl = type === "logo" ? setLogoUrl : setFaviconUrl;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orgId", orgId);
      fd.append("type", type);
      const res = await fetch("/api/upload/org-assets", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUrl(data.url);
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    const metadata: Partial<OrgMetadata> = {
      institutionType,
      uiConfig: {
        primaryColor, accentColor,
        logoUrl: logoUrl || undefined,
        faviconUrl: faviconUrl || undefined,
        sidebarTitle: sidebarTitle || undefined,
        welcomeText: welcomeText || undefined,
        navItems, bottomTabItems,
      },
      features: { hasResults, hasHostels, hasBiometrics, hasAssignments, hasMaterials, gradingScale },
    };
    const result = await updateOrgMetadata(orgId, { institutionType, metadata });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      toast.success("Organisation customization saved successfully!");
      setTimeout(() => setSaved(false), 3000);
    } else {
      const msg = result.messages?.[0] || "Failed to save organisation settings";
      setError(msg);
      toast.error(msg);
    }
  };

  const addNavItem = () => setNavItems([...navItems, { label: "", href: "/", icon: "Home" }]);
  const removeNavItem = (i: number) => setNavItems(navItems.filter((_, idx) => idx !== i));
  const updateNavItem = (i: number, field: keyof NavItem, value: string) => {
    const u = [...navItems]; u[i] = { ...u[i], [field]: value }; setNavItems(u);
  };
  const addBottomTab = () => { if (bottomTabItems.length < 4) setBottomTabItems([...bottomTabItems, { label: "", href: "/", icon: "Home" }]); };
  const removeBottomTab = (i: number) => setBottomTabItems(bottomTabItems.filter((_, idx) => idx !== i));
  const updateBottomTab = (i: number, field: keyof NavItem, value: string) => {
    const u = [...bottomTabItems]; u[i] = { ...u[i], [field]: value }; setBottomTabItems(u);
  };

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "identity", label: "Identity & Branding", icon: Palette },
    { id: "features", label: "Feature Flags", icon: ToggleLeft },
    { id: "navigation", label: "Sidebar Nav", icon: Navigation },
    { id: "mobile", label: "Mobile Nav", icon: Smartphone },
  ];

  // Shared nav item editor
  const NavItemEditor = ({ items, onUpdate, onRemove }: {
    items: NavItem[];
    onUpdate: (i: number, f: keyof NavItem, v: string) => void;
    onRemove: (i: number) => void;
  }) => (
    <div className="space-y-3">
      {items.map((item, index) => {
        const IconComp = iconComponents[item.icon] || Home;
        return (
          <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 group">
            <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <IconComp className="w-4 h-4 text-violet-400" />
            </div>
            <select value={item.icon} onChange={(e) => onUpdate(index, "icon", e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 w-40">
              {AVAILABLE_ICONS.map((icon) => (<option key={icon} value={icon} className="bg-slate-800">{icon}</option>))}
            </select>
            <input type="text" value={item.label} onChange={(e) => onUpdate(index, "label", e.target.value)}
              placeholder="Label" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            <input type="text" value={item.href} onChange={(e) => onUpdate(index, "href", e.target.value)}
              placeholder="/list/students" className="w-44 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            <button onClick={() => onRemove(index)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );

  // File upload card
  const FileUploadCard = ({ label, desc, currentUrl, uploading, inputRef, onFileChange }: {
    label: string; desc: string; currentUrl: string;
    uploading: boolean; inputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (f: File) => void;
  }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-medium text-slate-300 mb-1">{label}</p>
      <p className="text-xs text-slate-500 mb-3">{desc}</p>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
            <Image src={currentUrl} alt={label} width={64} height={64} className="object-contain" />
          </div>
        )}
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-medium disabled:opacity-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : currentUrl ? "Replace" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); }} />
        {currentUrl && (
          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{currentUrl}</span>
        )}
      </div>
    </div>
  );

  // Toggle component
  const Toggle = ({ label, desc, value, onChange }: {
    label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div><p className="text-white font-medium">{label}</p><p className="text-sm text-slate-400">{desc}</p></div>
      <button onClick={() => onChange(!value)} className={`relative w-12 h-7 rounded-full transition-colors ${value ? "bg-violet-600" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/super-admin/organisations/${orgId}`}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Customize</h1>
          <p className="text-slate-400 mt-1">Configure how <span className="text-violet-400 font-medium">{orgName}</span> experiences the platform</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Configuration"}
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
      {saved && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">Configuration saved successfully!</div>}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8">

        {/* ── Identity & Branding ── */}
        {activeTab === "identity" && (
          <div className="space-y-8">
            {/* Site Name */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Organisation Site Name</h3>
              <p className="text-sm text-slate-400 mb-4">This appears in the sidebar header, page title, and replaces the default app name</p>
              <input type="text" value={sidebarTitle} onChange={(e) => setSidebarTitle(e.target.value)}
                placeholder={orgName} className="w-full max-w-md px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-lg font-medium" />
            </div>

            {/* Welcome Text */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-1">Welcome / Tagline</h3>
              <p className="text-sm text-slate-400 mb-4">Shown on the dashboard homepage</p>
              <input type="text" value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Welcome to the portal" className="w-full max-w-lg px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            </div>

            {/* Institution Type */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-1">Institution Type</h3>
              <p className="text-sm text-slate-400 mb-4">Determines taxonomy labels across the app</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INSTITUTION_TYPES.map((type) => (
                  <button key={type.value} onClick={() => setInstitutionType(type.value)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      institutionType === type.value ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/50" : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}>
                    <p className={`font-medium ${institutionType === type.value ? "text-violet-300" : "text-white"}`}>{type.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo & Favicon Upload */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Logo & Favicon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUploadCard label="Organisation Logo" desc="Shown in sidebar & navbar. Square PNG/SVG recommended, max 2MB."
                  currentUrl={logoUrl} uploading={uploadingLogo} inputRef={logoInputRef as React.RefObject<HTMLInputElement>}
                  onFileChange={(f) => handleFileUpload(f, "logo")} />
                <FileUploadCard label="Custom Favicon" desc="Browser tab icon. ICO/PNG 32×32 or 16×16 recommended."
                  currentUrl={faviconUrl} uploading={uploadingFavicon} inputRef={faviconInputRef as React.RefObject<HTMLInputElement>}
                  onFileChange={(f) => handleFileUpload(f, "favicon")} />
              </div>
            </div>

            {/* Brand Colours */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Brand Colours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Primary Colour</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Accent Colour</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                    <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-6 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Live Preview</p>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: primaryColor + '15' }}>
                  {logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                      <Image src={logoUrl} alt="Logo preview" width={40} height={40} className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="font-bold" style={{ color: primaryColor }}>{sidebarTitle || orgName}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>Active Tab</div>
                  <div className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-400">Inactive Tab</div>
                  <div className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: accentColor, color: '#fff' }}>Accent</div>
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
                <Toggle label="Results Module" desc="Enable result/grade entry and report generation" value={hasResults} onChange={setHasResults} />
                <Toggle label="Hostels Module" desc="Enable hostel/accommodation management" value={hasHostels} onChange={setHasHostels} />
                <Toggle label="Biometrics Module" desc="Enable biometric attendance and ESP32 device management" value={hasBiometrics} onChange={setHasBiometrics} />
                <Toggle label="Assignments Module" desc="Enable assignment creation and submission tracking" value={hasAssignments} onChange={setHasAssignments} />
                <Toggle label="Materials Module" desc="Enable course material uploads and sharing" value={hasMaterials} onChange={setHasMaterials} />
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Grading Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GRADING_SCALES.map((scale) => (
                  <button key={scale.value} onClick={() => setGradingScale(scale.value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      gradingScale === scale.value ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}>{scale.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Sidebar Navigation ── */}
        {activeTab === "navigation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Sidebar Navigation Items</h3>
                <p className="text-sm text-slate-400">Configure the sidebar menu. Leave empty to use defaults.</p>
              </div>
              <button onClick={addNavItem} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />Add Item
              </button>
            </div>
            {navItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Navigation className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No custom navigation configured.</p>
                <p className="text-sm mt-1">The default sidebar will be used.</p>
              </div>
            )}
            <NavItemEditor items={navItems} onUpdate={updateNavItem} onRemove={removeNavItem} />
            {navItems.length > 0 && (
              <p className="text-xs text-slate-500">
                Tip: Use <code className="text-violet-400">Taxonomy.student</code>, <code className="text-violet-400">Taxonomy.teacher</code> etc. as labels to auto-translate based on institution type.
              </p>
            )}
          </div>
        )}

        {/* ── Mobile Navigation ── */}
        {activeTab === "mobile" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Mobile Bottom Tab Items</h3>
                <p className="text-sm text-slate-400">Configure the mobile bottom bar (max 4 items + auto &quot;More&quot; overflow). Leave empty for defaults.</p>
              </div>
              <button onClick={addBottomTab} disabled={bottomTabItems.length >= 4}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" />Add Tab ({bottomTabItems.length}/4)
              </button>
            </div>
            {bottomTabItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No custom mobile tabs configured.</p>
                <p className="text-sm mt-1">The default role-based bottom bar will be used.</p>
              </div>
            )}
            <NavItemEditor items={bottomTabItems} onUpdate={updateBottomTab} onRemove={removeBottomTab} />
          </div>
        )}
      </div>
    </div>
  );
}

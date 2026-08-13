"use client";

import { useState } from "react";
import { User, Palette, Shield, Lock, Archive } from "lucide-react";

interface Tab {
    id: string;
    label: string;
    icon: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    user: User,
    palette: Palette,
    shield: Shield,
    lock: Lock,
    archive: Archive,
};

const SettingsTabs = ({
    tabs,
    children,
}: {
    tabs: Tab[];
    children: React.ReactNode;
}) => {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Tab Navigation */}
            <div
                className="lg:w-56 flex lg:flex-col gap-1 p-1.5 rounded-2xl border overflow-x-auto lg:overflow-x-visible"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                }}
            >
                {tabs.map((tab) => {
                    const Icon = iconMap[tab.icon] || User;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${isActive
                                ? "bg-gradient-to-r from-CPENavy to-CPENavyDark text-white shadow-lg shadow-CPENavy/30"
                                : "hover:bg-CPENavy/10"
                                }`}
                            style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div
                className="flex-1 rounded-2xl p-6 border shadow-sm"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                {Array.isArray(children)
                    ? children.map((child: any) => {
                        const tabId = child?.props?.["data-tab-id"];
                        return (
                            <div
                                key={tabId}
                                style={{ display: tabId === activeTab ? "block" : "none" }}
                            >
                                {child}
                            </div>
                        );
                    })
                    : children}
            </div>
        </div>
    );
};

export default SettingsTabs;

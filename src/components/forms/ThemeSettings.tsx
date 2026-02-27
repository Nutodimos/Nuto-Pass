"use client";

import { useTheme, Theme } from "@/components/ThemeProvider";
import { Sun, Moon, Eclipse, Monitor, Check } from "lucide-react";

const themes: {
    id: Theme;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    colors: { bg: string; card: string; accent: string; text: string };
}[] = [
        {
            id: "light",
            name: "Nuto Light",
            description: "Clean & professional",
            icon: Sun,
            colors: {
                bg: "#F7F8FA",
                card: "#FFFFFF",
                accent: "#436275",
                text: "#1E293B",
            },
        },
        {
            id: "dark",
            name: "Nuto Dark",
            description: "Rich charcoal warmth",
            icon: Moon,
            colors: {
                bg: "#0F1419",
                card: "#1E2A3A",
                accent: "#7096AB",
                text: "#E8EDF2",
            },
        },
        {
            id: "midnight",
            name: "Nuto Midnight",
            description: "OLED pure black",
            icon: Eclipse,
            colors: {
                bg: "#000000",
                card: "#0D1117",
                accent: "#7EA6BE",
                text: "#F0F6FC",
            },
        },
        {
            id: "system",
            name: "System",
            description: "Follow your OS",
            icon: Monitor,
            colors: {
                bg: "linear-gradient(135deg, #F7F8FA 50%, #0F1419 50%)",
                card: "linear-gradient(135deg, #FFFFFF 50%, #1E2A3A 50%)",
                accent: "#436275",
                text: "#1E293B",
            },
        },
    ];

const ThemeSettings = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Appearance
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Choose how NutoPass looks to you. Select a theme that suits your preference.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => {
                    const isActive = theme === t.id;
                    const Icon = t.icon;

                    return (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`group relative rounded-2xl p-1 transition-all duration-300 ${isActive
                                ? "ring-2 ring-nutoOrange shadow-lg shadow-nutoOrange/20 scale-[1.02]"
                                : "ring-1 hover:ring-2 hover:scale-[1.01]"
                                }`}
                            style={{
                                ringColor: isActive ? undefined : 'var(--border-primary)',
                            }}
                        >
                            {/* Theme Preview */}
                            <div
                                className="rounded-xl overflow-hidden h-28 relative"
                                style={{
                                    background: t.colors.bg,
                                }}
                            >
                                {/* Mini mockup of the UI */}
                                <div className="absolute inset-2 flex gap-1.5">
                                    {/* Mini sidebar */}
                                    <div
                                        className="w-8 rounded-lg flex flex-col items-center py-2 gap-1.5"
                                        style={{ backgroundColor: t.colors.card }}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-md"
                                            style={{ backgroundColor: t.colors.accent }}
                                        />
                                        <div
                                            className="w-4 h-1 rounded-full opacity-30"
                                            style={{ backgroundColor: t.colors.text }}
                                        />
                                        <div
                                            className="w-4 h-1 rounded-full opacity-20"
                                            style={{ backgroundColor: t.colors.text }}
                                        />
                                        <div
                                            className="w-4 h-1 rounded-full opacity-15"
                                            style={{ backgroundColor: t.colors.text }}
                                        />
                                    </div>
                                    {/* Mini content area */}
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        {/* Mini navbar */}
                                        <div
                                            className="h-5 rounded-lg"
                                            style={{ backgroundColor: t.colors.card }}
                                        />
                                        {/* Mini cards */}
                                        <div className="flex gap-1.5 flex-1">
                                            <div
                                                className="flex-1 rounded-lg"
                                                style={{ backgroundColor: t.colors.card }}
                                            />
                                            <div
                                                className="flex-1 rounded-lg"
                                                style={{ backgroundColor: t.colors.card }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Active check badge */}
                                {isActive && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-nutoOrange rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Theme Info */}
                            <div className="flex items-center gap-3 px-3 py-3">
                                <div
                                    className={`p-2 rounded-xl transition-colors ${isActive
                                        ? "bg-nutoOrange/10"
                                        : ""
                                        }`}
                                    style={!isActive ? { backgroundColor: 'var(--bg-subtle)' } : undefined}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${isActive ? "text-nutoOrange" : ""
                                            }`}
                                        style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
                                    />
                                </div>
                                <div className="text-left">
                                    <p
                                        className="font-semibold text-sm"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {t.name}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        {t.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Current theme info */}
            <div
                className="rounded-xl p-4 border"
                style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-primary)',
                }}
            >
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    💡 Your theme preference is saved locally and will persist across sessions.
                    {theme === "system" && " The theme will automatically switch when your device changes between light and dark mode."}
                </p>
            </div>
        </div>
    );
};

export default ThemeSettings;

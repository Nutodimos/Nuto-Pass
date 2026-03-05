"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
    title: React.ReactNode;
    action?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export default function CollapsibleSection({
    title,
    action,
    defaultOpen = false,
    children,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header section (Clickable to toggle) */}
            <div
                className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-CPENavy/5 to-transparent cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-CPENavy"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                    {title}
                </div>

                <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking action buttons
                >
                    {action}
                </div>
            </div>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

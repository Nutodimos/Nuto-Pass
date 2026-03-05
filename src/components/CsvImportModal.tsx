"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    AlertCircle,
    Download,
    Loader2,
    Users,
    BookOpen,
    Keyboard,
} from "lucide-react";

type CsvImportMode = "import-students" | "enroll-students";

type ImportResults = {
    created?: number;
    enrolled?: number;
    skipped?: string[];
    alreadyEnrolled?: string[];
    notFound?: string[];
    errors?: string[];
    error?: string;
    details?: string[];
};

type CsvImportModalProps = {
    mode: CsvImportMode;
    targetId: number;
    targetName: string;
    students?: any[];
};

const SAMPLE_STUDENT_CSV =
    "matricNo,name,surname,email,phone,sex,birthday,address\nCSC/2024/001,John,Doe,john@example.com,08012345678,MALE,2000-01-15,123 Main St";

const SAMPLE_ENROLL_CSV = "matricNo\nCSC/2024/001\nCSC/2024/002\nCSC/2024/003";

const CsvImportModal = ({ mode, targetId, targetName, students }: CsvImportModalProps) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"csv" | "manual">("csv");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string[][] | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<ImportResults | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const isImport = mode === "import-students";
    const apiUrl = isImport ? "/api/csv/import-students" : "/api/csv/enroll-students";
    const paramName = isImport ? "classId" : "subjectId";

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setResults(null);
        setUploading(false);
        setManualInput("");
        setSearchTerm("");
    };

    const handleClose = () => {
        setOpen(false);
        if (results) {
            router.refresh();
        }
        resetState();
    };

    const parsePreview = useCallback((fileArg: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split("\n").filter((l) => l.trim());
            const rows = lines.slice(0, 6).map((line) =>
                line.split(",").map((cell) => cell.trim())
            );
            setPreview(rows);
        };
        reader.readAsText(fileArg);
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.endsWith(".csv")) {
            toast.error("Please select a .csv file");
            return;
        }
        setFile(selectedFile);
        setResults(null);
        parsePreview(selectedFile);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResults(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append(paramName, targetId.toString());

            const response = await fetch(apiUrl, { method: "POST", body: formData });
            const data: ImportResults = await response.json();

            if (!response.ok) {
                setResults({ error: data.error || "Upload failed", details: data.details });
                toast.error(data.error || "Upload failed");
            } else {
                setResults(data);
                const count = data.created ?? data.enrolled ?? 0;
                toast.success(`${count} student${count !== 1 ? "s" : ""} ${isImport ? "imported" : "enrolled"} successfully!`);
            }
        } catch {
            setResults({ error: "Network error — please try again" });
            toast.error("Network error");
        } finally {
            setUploading(false);
        }
    };

    const handleManualSubmit = async () => {
        let csvContent = "";

        if (isImport) {
            const lines = manualInput
                .split(/[\n]+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            if (lines.length === 0) {
                toast.error("Please enter at least one entry");
                return;
            }

            // Validate roughly
            const invalidLine = lines.find(l => l.split(',').length < 3);
            if (invalidLine) {
                toast.error("Each line must contain: Matric No, Surname, First Name");
                return;
            }

            csvContent = "matricNo,surname,name,sex,birthday\n" + lines.map(line => {
                const parts = line.split(",").map(p => p.trim());
                return `${parts[0]},${parts[1]},${parts[2]},MALE,2000-01-01`;
            }).join("\n");
        } else {
            if (!manualInput.trim()) {
                toast.error("Please select a student");
                return;
            }
            csvContent = "matricNo\n" + manualInput.trim();
        }

        setUploading(true);
        setResults(null);

        try {
            const blob = new Blob([csvContent], { type: "text/csv" });
            const csvFile = new File([blob], "manual_entry.csv", { type: "text/csv" });

            const formData = new FormData();
            formData.append("file", csvFile);
            formData.append(paramName, targetId.toString());

            const response = await fetch(apiUrl, { method: "POST", body: formData });
            const data: ImportResults = await response.json();

            if (!response.ok) {
                setResults({ error: data.error || "Failed", details: data.details });
                toast.error(data.error || "Failed");
            } else {
                setResults(data);
                const count = data.created ?? data.enrolled ?? 0;
                toast.success(`${count} student${count !== 1 ? "s" : ""} ${isImport ? "imported" : "enrolled"} successfully!`);
            }
        } catch {
            setResults({ error: "Network error — please try again" });
            toast.error("Network error");
        } finally {
            setUploading(false);
        }
    };

    const downloadSample = () => {
        const content = isImport ? SAMPLE_STUDENT_CSV : SAMPLE_ENROLL_CSV;
        const blob = new Blob([content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = isImport ? "student_import_template.csv" : "enrollment_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalIssues =
        (results?.skipped?.length ?? 0) +
        (results?.alreadyEnrolled?.length ?? 0) +
        (results?.notFound?.length ?? 0) +
        (results?.errors?.length ?? 0);

    const successCount = results?.created ?? results?.enrolled ?? 0;
    const manualCount = isImport
        ? manualInput.split(/[\n]+/).filter((s) => s.trim()).length
        : (manualInput ? 1 : 0);

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Trigger Button — visible on light backgrounds */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark hover:shadow-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md"
            >
                <Upload className="w-4 h-4" />
                <span>{isImport ? "Import Students" : "Enroll Students"}</span>
            </button>

            {/* Modal */}
            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div className="w-screen h-screen fixed left-0 top-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 pb-8 overflow-y-auto"
                        style={{ animation: "fade-in 0.2s ease-out" }}>
                        <div
                            className="bg-white p-6 rounded-2xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl my-auto"
                            style={{ animation: "scale-in 0.3s ease-out" }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
                                    {isImport ? <Users className="w-5 h-5 text-white" /> : <BookOpen className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">
                                        {isImport ? "Import Students" : "Enroll Students"}
                                    </h2>
                                    <p className="text-sm text-gray-500">{targetName}</p>
                                </div>
                            </div>

                            {/* Close */}
                            <button
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                                onClick={handleClose}
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>

                            {/* Tab Switcher */}
                            {!results && (
                                <div className="flex mt-4 bg-gray-100 rounded-xl p-1">
                                    <button
                                        onClick={() => { setActiveTab("csv"); resetState(); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "csv"
                                            ? "bg-white text-CPENavyDark shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        CSV Upload
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab("manual"); resetState(); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "manual"
                                            ? "bg-white text-CPENavyDark shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        <Keyboard className="w-4 h-4" />
                                        Manual Entry
                                    </button>
                                </div>
                            )}

                            <div className="mt-4 space-y-4">
                                {/* === CSV TAB === */}
                                {activeTab === "csv" && !results && (
                                    <>
                                        <button onClick={downloadSample}
                                            className="flex items-center gap-2 text-sm text-CPENavy hover:text-CPENavyDark transition-colors">
                                            <Download className="w-4 h-4" />
                                            Download sample CSV template
                                        </button>

                                        {/* Drop Zone */}
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragActive
                                                ? "border-CPENavy bg-CPENavy/5"
                                                : file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-CPENavy/50 hover:bg-gray-50"
                                                }`}
                                            onDragEnter={handleDrag} onDragLeave={handleDrag}
                                            onDragOver={handleDrag} onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input type="file" ref={fileInputRef} accept=".csv" className="hidden"
                                                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
                                            {file ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <FileText className="w-8 h-8 text-green-500" />
                                                    <div className="text-left">
                                                        <p className="font-medium text-gray-800">{file.name}</p>
                                                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); resetState(); }}
                                                        className="p-1 hover:bg-gray-200 rounded-full">
                                                        <X className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-600 font-medium">Drop your CSV file here, or click to select</p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {isImport ? "Required: matricNo, name, surname, sex, birthday" : "Required: matricNo"}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Preview */}
                                        {preview && (
                                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50">
                                                            {preview[0]?.map((h, i) => (
                                                                <th key={i} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {preview.slice(1).map((row, i) => (
                                                            <tr key={i} className="border-t border-gray-100">
                                                                {row.map((cell, j) => (
                                                                    <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 border-t">
                                                    Showing first {preview.length - 1} row(s)
                                                </p>
                                            </div>
                                        )}

                                        {file && (
                                            <button onClick={handleUpload} disabled={uploading}
                                                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
                                                {uploading
                                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                                    : <><Upload className="w-4 h-4" />{isImport ? "Import Students" : "Enroll Students"}</>}
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* === MANUAL TAB === */}
                                {activeTab === "manual" && !results && (
                                    <>
                                        {isImport ? (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                                    Enter student details (Format: Matric No, Surname, First Name)
                                                </label>
                                                <textarea
                                                    value={manualInput}
                                                    onChange={(e) => setManualInput(e.target.value)}
                                                    placeholder={"CSC/2024/001, Doe, John\nCSC/2024/002, Smith, Jane"}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200 min-h-[150px] resize-y font-mono whitespace-pre"
                                                />
                                                <p className="text-xs text-gray-400 mt-1.5 flex justify-between">
                                                    <span>{manualCount} student{manualCount !== 1 ? "s" : ""} entered</span>
                                                    <span>One student per line</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                                    Search and select a student to enroll
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or matric number..."
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 transition-all duration-200 focus:border-CPENavy focus:bg-white focus:outline-none mb-3"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 transition-all duration-200 focus:border-CPENavy focus:bg-white focus:outline-none"
                                                    value={manualInput}
                                                    onChange={(e) => setManualInput(e.target.value)}
                                                >
                                                    <option value="" disabled>Select a student...</option>
                                                    {filteredStudents?.slice(0, 50).map(s => (
                                                        <option key={s.id} value={s.username}>{s.name} {s.surname} ({s.username})</option>
                                                    ))}
                                                    {filteredStudents?.length === 0 && <option disabled>No matches found</option>}
                                                </select>
                                                <p className="text-xs text-gray-400 mt-1.5">
                                                    {manualInput ? `Selected: ${manualInput}` : "Please select a student"}
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleManualSubmit}
                                            disabled={uploading || !manualInput.trim()}
                                            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                        >
                                            {uploading
                                                ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                                : <><Keyboard className="w-4 h-4" />{isImport ? "Import Students" : "Enroll Students"}</>}
                                        </button>
                                    </>
                                )}

                                {/* === RESULTS (shared) === */}
                                {results && (
                                    <div className="space-y-3">
                                        {results.error && (
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                                                <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                                                    <AlertCircle className="w-5 h-5" />{results.error}
                                                </div>
                                                {results.details?.map((d, i) => (
                                                    <p key={i} className="text-sm text-red-600 ml-7">{d}</p>
                                                ))}
                                            </div>
                                        )}

                                        {!results.error && (
                                            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-green-800">
                                                        {successCount} student{successCount !== 1 ? "s" : ""}{" "}
                                                        {isImport ? "imported" : "enrolled"} successfully
                                                    </p>
                                                    {totalIssues > 0 && (
                                                        <p className="text-sm text-green-600">
                                                            {totalIssues} item{totalIssues !== 1 ? "s" : ""} need attention
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {results.skipped && results.skipped.length > 0 && <IssueList title="Skipped (already exist)" items={results.skipped} color="yellow" />}
                                        {results.alreadyEnrolled && results.alreadyEnrolled.length > 0 && <IssueList title="Already enrolled" items={results.alreadyEnrolled} color="yellow" />}
                                        {results.notFound && results.notFound.length > 0 && <IssueList title="Not found in system" items={results.notFound} color="red" />}
                                        {results.errors && results.errors.length > 0 && <IssueList title="Errors" items={results.errors} color="red" />}

                                        <button onClick={handleClose}
                                            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <style jsx>{`
                            @keyframes scale-in {
                                from { opacity: 0; transform: scale(0.9); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            @keyframes fade-in {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                        `}</style>
                    </div>,
                    document.body
                )}
        </>
    );
};

const IssueList = ({ title, items, color }: { title: string; items: string[]; color: "yellow" | "red" }) => {
    const [expanded, setExpanded] = useState(false);
    const bgColor = color === "yellow" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
    const textColor = color === "yellow" ? "text-yellow-800" : "text-red-800";
    const subTextColor = color === "yellow" ? "text-yellow-700" : "text-red-700";

    return (
        <div className={`p-3 rounded-xl border ${bgColor}`}>
            <button onClick={() => setExpanded(!expanded)}
                className={`flex items-center justify-between w-full text-left font-medium text-sm ${textColor}`}>
                <span>{title} ({items.length})</span>
                <span className="text-xs">{expanded ? "Hide" : "Show"}</span>
            </button>
            {expanded && (
                <ul className={`mt-2 space-y-1 text-sm ${subTextColor}`}>
                    {items.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CsvImportModal;

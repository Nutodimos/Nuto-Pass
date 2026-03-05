"use client";

import { useState, ReactNode } from "react";
import { FileText, Download, Calendar, User, BookOpen, Eye, File, FileSpreadsheet, Image as ImageIcon, Presentation } from "lucide-react";
import MaterialPreviewModal from "./MaterialPreviewModal";

interface MaterialCardProps {
    id: number;
    title: string;
    filePath: string;
    className: string;
    teacherName: string;
    createdAt: Date;
    canDelete: boolean;
    deleteForm?: ReactNode;
    isGeneral?: boolean;
}

// Get file icon based on extension
const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'pdf':
            return <FileText className="w-6 h-6 text-red-500" />;
        case 'doc':
        case 'docx':
            return <FileText className="w-6 h-6 text-blue-500" />;
        case 'ppt':
        case 'pptx':
            return <Presentation className="w-6 h-6 text-orange-500" />;
        case 'xls':
        case 'xlsx':
            return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
            return <ImageIcon className="w-6 h-6 text-purple-500" />;
        default:
            return <File className="w-6 h-6 text-gray-500" />;
    }
};

// Get file type badge color
const getFileTypeBadge = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toUpperCase() || 'FILE';
    const colors: Record<string, string> = {
        'PDF': 'bg-red-100 text-red-700',
        'DOC': 'bg-blue-100 text-blue-700',
        'DOCX': 'bg-blue-100 text-blue-700',
        'PPT': 'bg-orange-100 text-orange-700',
        'PPTX': 'bg-orange-100 text-orange-700',
        'XLS': 'bg-green-100 text-green-700',
        'XLSX': 'bg-green-100 text-green-700',
        'JPG': 'bg-purple-100 text-purple-700',
        'JPEG': 'bg-purple-100 text-purple-700',
        'PNG': 'bg-purple-100 text-purple-700',
    };
    return { ext, color: colors[ext] || 'bg-gray-100 text-gray-700' };
};

const MaterialCard = ({ id, title, filePath, className, teacherName, createdAt, canDelete, deleteForm, isGeneral = false }: MaterialCardProps) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { ext, color } = getFileTypeBadge(filePath);
    const fileType = filePath.split('.').pop() || '';

    return (
        <>
            <div className={`group cpe-card flex flex-col ${isGeneral ? 'border-amber-200' : ''}`}>
                <div className="group cpe-card-indicator"></div>
                {/* Card Header with file type indicator */}
                <div className={`h-2 shrink-0 ${isGeneral ? 'bg-gradient-to-r from-amber-400/40 to-amber-200/20' : 'bg-gradient-to-r from-CPEGold/20 to-CPEGold/5'}`}></div>

                <div className="p-4 flex-1 flex flex-col">
                    {/* File Icon & Type Badge */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-CPEGold/10 transition-colors">
                            {getFileIcon(filePath)}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${color}`}>
                            {ext}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-CPEGold transition-colors">
                        {title}
                    </h3>

                    {/* Metadata */}
                    <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{className}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span>{teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Intl.DateTimeFormat("en-US", {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            }).format(new Date(createdAt))}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                        <button
                            onClick={() => setIsPreviewOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-CPENavy/10 text-CPENavy rounded-lg text-sm font-medium hover:bg-CPENavy hover:text-white transition-all"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <a
                            href={filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-2 px-3 bg-CPEGold/10 text-CPEGold rounded-lg text-sm font-medium hover:bg-CPEGold hover:text-white transition-all"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                        {canDelete && deleteForm && (
                            <div className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                {deleteForm}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <MaterialPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                filePath={filePath}
                title={title}
                fileType={fileType}
            />
        </>
    );
};

export default MaterialCard;


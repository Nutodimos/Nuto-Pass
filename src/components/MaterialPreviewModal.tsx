"use client";

import { useState } from "react";
import { X, Download, FileText, Eye, ExternalLink } from "lucide-react";
import Image from "next/image";

interface MaterialPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    filePath: string;
    title: string;
    fileType: string;
}

const MaterialPreviewModal = ({ isOpen, onClose, filePath, title, fileType }: MaterialPreviewModalProps) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!isOpen) return null;

    const isPdf = fileType.toLowerCase() === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase());
    const canPreview = isPdf || isImage;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-CPEGold/10 rounded-lg">
                            <FileText className="w-5 h-5 text-CPEGold" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-800 line-clamp-1">{title}</h2>
                            <span className="text-xs text-gray-500 uppercase">{fileType} file</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-CPEGold text-white rounded-lg text-sm font-medium hover:bg-CPEGoldDark transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="relative bg-gray-100 overflow-auto" style={{ height: 'calc(90vh - 80px)' }}>
                    {canPreview ? (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-CPEGold/30 border-t-CPEGold rounded-full animate-spin"></div>
                                        <p className="text-gray-500 text-sm">Loading preview...</p>
                                    </div>
                                </div>
                            )}

                            {isPdf ? (
                                <iframe
                                    src={`${filePath}#toolbar=1&navpanes=0`}
                                    className="w-full h-full"
                                    onLoad={() => setIsLoading(false)}
                                    title={title}
                                />
                            ) : isImage ? (
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <Image
                                        src={filePath}
                                        alt={title}
                                        width={1200}
                                        height={1200}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                        onLoad={() => setIsLoading(false)}
                                    />
                                </div>
                            ) : null}
                        </>
                    ) : (
                        /* Cannot Preview - Show Download Message */
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Preview not available</h3>
                            <p className="text-gray-500 mb-6 max-w-md">
                                This file type ({fileType.toUpperCase()}) cannot be previewed in the browser.
                                Please download it to view the contents.
                            </p>
                            <a
                                href={filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-CPEGold text-white rounded-xl font-medium hover:bg-CPEGoldDark transition-colors shadow-lg shadow-CPEGold/20"
                            >
                                <Download className="w-5 h-5" />
                                Download {title}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};

export default MaterialPreviewModal;

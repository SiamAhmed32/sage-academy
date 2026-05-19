"use client";

import { X, FileText, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AdmissionDocumentModalProps {
  url: string;
  studentName: string;
  onClose: () => void;
}

export function AdmissionDocumentModal({ url, studentName, onClose }: AdmissionDocumentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const isPDF = url.toLowerCase().endsWith(".pdf");
  const isCloudinary = url.includes("res.cloudinary.com");

  // Transform Cloudinary PDF to high-quality JPG preview
  const previewUrl = (isPDF && isCloudinary) 
    ? url.replace(/\.pdf$/i, ".jpg") 
    : url;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Minimalist */}
        <div className="flex items-center justify-between border-b border-sage-border bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-sage-border ${isPDF ? 'bg-red-50 text-red-600' : 'bg-sage-red-50 text-sage-primary'}`}>
              {isPDF ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-sage-secondary leading-none mb-1">Document Preview</h3>
              <p className="text-[10px] font-semibold text-sage-gray-400 uppercase tracking-wider truncate max-w-[150px] sm:max-w-xs">{studentName}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-red-50 text-sage-primary transition hover:bg-sage-primary hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 bg-sage-red-50/5 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-sage-red-100">
          <div className="flex flex-col items-center justify-start min-h-full">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 z-10">
                <Loader2 className="animate-spin text-sage-primary" size={24} />
                <p className="text-[10px] font-bold text-sage-gray-400 uppercase tracking-widest">Loading Preview...</p>
              </div>
            )}

            <img 
              src={previewUrl} 
              alt={studentName} 
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              className={`w-full h-auto rounded-lg shadow-lg border border-sage-border/50 transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              style={{ maxWidth: '100%' }}
            />

            {error && (
              <div className="flex flex-col items-center gap-3 text-center p-12">
                <AlertCircle className="text-red-500" size={32} />
                <p className="text-xs font-bold text-sage-secondary">Preview Unavailable</p>
                <p className="text-[10px] font-medium text-sage-gray-400">The document could not be loaded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Minimal */}
        <div className="flex items-center justify-center border-t border-sage-border bg-white py-2">
          <p className="text-[8px] font-black text-sage-gray-300 uppercase tracking-[0.4em]">
            SAGE • INTERNAL PREVIEW
          </p>
        </div>
      </div>
    </div>
  );
}

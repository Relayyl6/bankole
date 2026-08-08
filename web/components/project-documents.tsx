"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { 
  FileText, Upload, Trash2, Download, Plus, Loader2, 
  FileCheck, Receipt, ShieldAlert, FileCode2, ExternalLink
} from "lucide-react";
import { toast } from "react-toastify";

export type DocumentKind = "contract" | "receipt" | "verification_record" | "permit" | "other";

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  kind: DocumentKind;
  fileUrl: string;
  sizeBytes: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedOn: string;
}

interface ProjectDocumentsProps {
  projectId: string;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const KIND_LABELS: Record<DocumentKind, { label: string; color: string }> = {
  contract: { label: "Contract", color: "bg-blue-50 text-blue-700 border-blue-200" },
  receipt: { label: "Receipt", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  verification_record: { label: "Verification Record", color: "bg-purple-50 text-purple-700 border-purple-200" },
  permit: { label: "Permit", color: "bg-amber-50 text-amber-700 border-amber-200" },
  other: { label: "Other", color: "bg-ink-100 text-ink-700 border-ink-200" },
};

export default function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docKind, setDocKind] = useState<DocumentKind>("contract");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: documentsResponse, mutate, isLoading } = useSWR(
    `/projects/${projectId}/documents`,
    (url) => apiClient<{ data: ProjectDocument[] }>(url)
  );

  const documents = documentsResponse?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!docName.trim()) {
      toast.error("Please provide a name for the document.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", docName.trim());
      formData.append("kind", docKind);

      await apiClient(`/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });

      toast.success("Document uploaded successfully!");
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocName("");
      setDocKind("contract");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(docId);
    try {
      await apiClient(`/documents/${docId}`, {
        method: "DELETE",
      });
      toast.success("Document deleted");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-ink-100 shadow-soft p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ink-100">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Project Documents</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Contracts, receipts, building permits, and verified project records.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="size-4" /> Upload Document
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-ink-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-ink-100">
            <h3 className="text-xl font-bold text-ink-900 mb-1">Upload Document</h3>
            <p className="text-sm text-ink-500 mb-6">Attach a verified document to this project workspace.</p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                  Document File (PDF, Image, Doc)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink-200 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer bg-ink-50/50 hover:bg-brand-50/20 transition-all"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <Upload className="size-8 text-ink-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <p className="text-sm font-bold text-brand-600 truncate">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-ink-700">Click to browse or drag file here</p>
                      <p className="text-xs text-ink-400 mt-1">Up to 25MB (PDF, DOCX, JPG, PNG)</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Document Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Approved Building Permit"
                  className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Document Type / Kind
                </label>
                <select
                  value={docKind}
                  onChange={(e) => setDocKind(e.target.value as DocumentKind)}
                  className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="contract">Contract</option>
                  <option value="receipt">Receipt</option>
                  <option value="verification_record">Verification Record</option>
                  <option value="permit">Permit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-sm font-bold text-ink-600 hover:text-ink-900 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="size-4 animate-spin" />}
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="mt-6">
        {isLoading && (
          <div className="py-12 text-center text-ink-400 text-sm animate-pulse">
            Loading project documents...
          </div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="text-center py-12 bg-ink-50/50 rounded-2xl border border-dashed border-ink-200">
            <FileText className="size-10 text-ink-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-ink-700">No documents uploaded yet</h3>
            <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
              Upload project contracts, verified receipts, and regulatory permits to keep all documentation centralized.
            </p>
          </div>
        )}

        {!isLoading && documents.length > 0 && (
          <div className="divide-y divide-ink-100">
            {documents.map((doc) => {
              const kindConfig = KIND_LABELS[doc.kind] || KIND_LABELS.other;
              const isDeleting = deletingId === doc.id;

              return (
                <div 
                  key={doc.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink-50/50 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="size-10 rounded-xl bg-ink-100 flex items-center justify-center shrink-0 text-ink-600 mt-0.5">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-ink-900 truncate">{doc.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kindConfig.color}`}>
                          {kindConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-400 mt-1 flex-wrap">
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy?.name || "Member"}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedOn).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-700 hover:text-brand-600 bg-white border border-ink-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-ink-50 transition-colors"
                    >
                      <Download className="size-3.5" /> View / Download
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-ink-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud, X, MapPin, Clock, CheckCircle2,
  Image as ImageIcon, FileVideo, Trash2, Send, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video" | "document";
  caption: string;
}

interface UploadProofModalProps {
  milestoneId: string;
  milestoneStage: string;
  onClose: () => void;
  onSuccess: (files: UploadedFile[]) => void;
}

function getFileType(file: File): "image" | "video" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

export default function UploadProofModal({
  milestoneId,
  milestoneStage,
  onClose,
  onSuccess,
}: UploadProofModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsGranted, setGpsGranted] = useState<boolean | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── GPS ─────────────────────────────────────────────────────────
  const requestGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device.");
      setGpsGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsGranted(true);
        toast.success("GPS location captured successfully.");
      },
      () => {
        setGpsGranted(false);
        toast.error("Location access denied. GPS tag will not be attached.");
      }
    );
  };

  // ── File handling ─────────────────────────────────────────────
  const processFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid = arr.filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 50MB limit.`);
        return false;
      }
      return true;
    });

    const newUploads: UploadedFile[] = valid.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      preview: f.type.startsWith("image/") || f.type.startsWith("video/")
        ? URL.createObjectURL(f)
        : "",
      type: getFileType(f),
      caption: f.name.replace(/\.[^.]+$/, ""),
    }));
    setFiles((prev) => [...prev, ...newUploads]);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, caption } : f)));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please add at least one photo or video.");
      return;
    }
    if (!gpsGranted) {
      toast.warn("Submitting without GPS tag. Consider enabling location for verification.");
    }

    setSubmitting(true);
    try {
      const promises = files.map((f) => {
        const formData = new FormData();
        formData.append("file", f.file);
        formData.append("caption", f.caption);
        if (gpsGranted && gpsCoords) {
          formData.append("capturedLat", gpsCoords.lat.toString());
          formData.append("capturedLng", gpsCoords.lng.toString());
        }
        
        return apiClient(`/milestones/${milestoneId}/proofs`, {
          method: "POST",
          body: formData,
        });
      });

      await Promise.all(promises);

      toast.success(`${files.length} proof${files.length > 1 ? "s" : ""} submitted successfully!`);
      onSuccess(files);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-card-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-8 py-6 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-ink)" }}>
              Upload Proof of Work
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-body)" }}>
              {milestoneStage}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            style={{ color: "var(--color-body)" }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* GPS Banner */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{
              background: gpsGranted
                ? "rgba(22,163,74,0.08)"
                : "var(--color-canvas-soft)",
              borderColor: gpsGranted ? "rgba(22,163,74,0.3)" : "var(--color-hairline)",
            }}
          >
            <div className="flex items-center gap-3">
              {gpsGranted ? (
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
              ) : (
                <MapPin className="size-5 text-brand-500 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--color-ink)" }}>
                  {gpsGranted
                    ? `GPS Captured: ${gpsCoords?.lat.toFixed(4)}, ${gpsCoords?.lng.toFixed(4)}`
                    : "Attach GPS location to your proof"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-body)" }}>
                  {gpsGranted
                    ? "Location will be embedded and verified against the project site."
                    : "Geo-tagging makes your proof independently verifiable."}
                </p>
              </div>
            </div>
            {!gpsGranted && (
              <button
                onClick={requestGPS}
                className="shrink-0 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors"
              >
                Enable GPS
              </button>
            )}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragging ? "#7c3aed" : "var(--color-hairline)",
              background: dragging ? "rgba(124,58,237,0.04)" : "var(--color-canvas-soft)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <UploadCloud className="size-10 mx-auto mb-3 text-brand-400" />
            <p className="font-bold" style={{ color: "var(--color-ink)" }}>
              Drag & drop or click to browse
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-body)" }}>
              Photos, videos or PDFs · Max 50MB per file
            </p>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="space-y-4">
              <p className="font-bold text-sm" style={{ color: "var(--color-ink)" }}>
                {files.length} file{files.length > 1 ? "s" : ""} ready to upload
              </p>
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex gap-4 p-4 rounded-2xl border items-start"
                  style={{
                    background: "var(--color-canvas-soft)",
                    borderColor: "var(--color-hairline)",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="size-16 rounded-xl shrink-0 overflow-hidden bg-black/10 flex items-center justify-center">
                    {f.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.preview} alt={f.caption} className="w-full h-full object-cover" />
                    ) : f.type === "video" ? (
                      <video src={f.preview} className="w-full h-full object-cover" />
                    ) : (
                      <FileVideo className="size-7 text-brand-400" />
                    )}
                  </div>
                  {/* Caption + meta */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={f.caption}
                      onChange={(e) => updateCaption(f.id, e.target.value)}
                      className="w-full font-bold text-sm bg-transparent border-b pb-1 focus:outline-none focus:border-brand-600 transition-colors"
                      style={{
                        color: "var(--color-ink)",
                        borderColor: "var(--color-hairline)",
                      }}
                      placeholder="Add a caption…"
                    />
                    <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: "var(--color-mute)" }}>
                      <Clock className="size-3" />
                      {new Date().toLocaleString("en-GB")}
                      {gpsCoords && (
                        <>
                          <MapPin className="size-3 ml-2" />
                          {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-2 rounded-2xl hover:bg-rose-50 text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Warning when no GPS */}
          {gpsGranted === false && (
            <div
              className="flex items-start gap-3 p-4 rounded-2xl border"
              style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.3)" }}
            >
              <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm" style={{ color: "var(--color-ink)" }}>
                Proof submitted without GPS verification may take longer to approve. Consider sharing location for faster release.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 border-t flex items-center justify-between gap-4 shrink-0"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-mute)" }}>
            Files are encrypted in transit. Proofs are permanently logged on the escrow record.
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || files.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? (
              <>
                <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Submit Proof
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

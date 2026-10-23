'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACCEPTED_TYPES = [
  { ext: '.pdf', mime: 'application/pdf', label: 'PDF' },
  { ext: '.txt', mime: 'text/plain', label: 'TXT' },
  { ext: '.md', mime: 'text/markdown', label: 'Markdown' },
];

const MAX_SIZE_MB = 25;

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateFile = (file: File): string | null => {
    const allowedMimes = ACCEPTED_TYPES.map(t => t.mime);
    const allowedExts = ACCEPTED_TYPES.map(t => t.ext);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
      return `Unsupported file type. Accepted: ${allowedExts.join(', ')}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    if (file.size === 0) {
      return 'File is empty.';
    }
    return null;
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
    } else {
      setErrorMessage('');
      setSelectedFile(file);
    }
    setUploadState('idle');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed. Please try again.');
      }

      setUploadState('success');
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setUploadState('idle');
        setSelectedFile(null);
      }, 1500);
    } catch (err) {
      setUploadState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handleClose = () => {
    if (uploadState === 'uploading') return;
    onClose();
    setSelectedFile(null);
    setUploadState('idle');
    setErrorMessage('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--panel-shadow)] overflow-hidden">
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Add document</h2>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">Upload to your knowledge workspace</p>
          </div>
          <button onClick={handleClose} disabled={uploadState === 'uploading'} className="p-1.5 rounded-lg border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] transition-all" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-[var(--accent-citron)] bg-[var(--accent-citron)]/5' : selectedFile ? 'border-[var(--status-success)] bg-[var(--status-success-bg)]/30' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-main)]'}`}
          >
            <input type="file" id="file-upload" className="sr-only" accept=".pdf,.txt,.md,.markdown" onChange={handleFileInput} />

            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[var(--status-success)]" />
                <div className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.name}</div>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">{formatSize(selectedFile.size)}</div>
                <button onClick={() => setSelectedFile(null)} className="text-[11px] text-[var(--text-muted)] underline hover:text-[var(--text-primary)]">Remove</button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-[var(--accent-citron-muted)] hover:underline">Browse file</label>
                  <span className="text-sm text-[var(--text-muted)]"> or drag and drop</span>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">
                  {ACCEPTED_TYPES.map(t => t.label).join(' · ')} · Max {MAX_SIZE_MB} MB
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[var(--status-error-bg)] border border-[var(--status-error)]/20 text-[11px] text-[var(--status-error)]">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Config note */}
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <FileText className="w-3.5 h-3.5 mt-0.5 text-[var(--text-muted)] shrink-0" />
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Documents are stored privately and indexed for semantic search. Configure your Supabase and AI provider credentials to enable full processing.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button onClick={handleClose} disabled={uploadState === 'uploading'} className="h-9 px-4 text-sm font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === 'uploading' || uploadState === 'success'}
            className="h-9 px-5 text-sm font-semibold rounded-lg bg-[var(--accent-citron)] text-[var(--accent-citron-text)] hover:bg-[var(--accent-citron-muted)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploadState === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploadState === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {uploadState === 'uploading' ? 'Uploading…' : uploadState === 'success' ? 'Uploaded!' : 'Upload document'}
          </button>
        </div>
      </div>
    </div>
  );
};

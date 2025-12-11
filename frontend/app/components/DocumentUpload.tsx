// components/DocumentUpload.tsx
"use client";
import React, { useState, useRef } from "react";

interface DocumentUploadProps {
    onUploadSuccess: (doc: any) => void;
    conversationId: string;
}

export default function DocumentUpload({ onUploadSuccess, conversationId }: DocumentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        // Validate file type
        if (!file.name.endsWith('.pdf')) {
            setError("Only PDF files are allowed");
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError("File size must be less than 10MB");
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('conversation_id', conversationId);

            const res = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const data = await res.json();
            onUploadSuccess(data);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="document-upload">
            <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />

                {uploading ? (
                    <div className="upload-status">
                        <div className="spinner"></div>
                        <p>Uploading and processing PDF...</p>
                    </div>
                ) : (
                    <>
                        <svg
                            className="upload-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="upload-text">
                            <span className="upload-link" onClick={handleButtonClick}>
                                Click to upload
                            </span>{' '}
                            or drag and drop
                        </p>
                        <p className="upload-hint">PDF files only (max 10MB)</p>
                    </>
                )}
            </div>

            {error && (
                <div className="upload-error">
                    <span>⚠️ {error}</span>
                </div>
            )}

            <style jsx>{`
        .document-upload {
          margin-bottom: 1rem;
        }

        .upload-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f7fafc;
        }

        .upload-zone:hover {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-zone.drag-active {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          color: #4299e1;
        }

        .upload-text {
          font-size: 1rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .upload-link {
          color: #4299e1;
          text-decoration: underline;
          cursor: pointer;
        }

        .upload-link:hover {
          color: #2b6cb0;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #718096;
        }

        .upload-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          border: 3px solid #e2e8f0;
          border-top: 3px solid #4299e1;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .upload-error {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #fed7d7;
          border: 1px solid #fc8181;
          border-radius: 4px;
          color: #742a2a;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}

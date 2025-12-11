// components/DocumentList.tsx
"use client";
import React from "react";

interface Document {
    doc_id: string;
    filename: string;
    upload_date: string;
    total_chunks: number;
}

interface DocumentListProps {
    documents: Document[];
    onDelete: (docId: string) => void;
    isDeleting?: string | null;
}

export default function DocumentList({ documents, onDelete, isDeleting }: DocumentListProps) {
    if (documents.length === 0) {
        return null;
    }

    const formatDate = (isoDate: string) => {
        try {
            const date = new Date(isoDate);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return isoDate;
        }
    };

    return (
        <div className="document-list">
            <h3 className="list-title">📄 Uploaded Documents ({documents.length})</h3>
            <div className="documents">
                {documents.map((doc) => (
                    <div key={doc.doc_id} className="document-item">
                        <div className="doc-info">
                            <div className="doc-name">{doc.filename}</div>
                            <div className="doc-meta">
                                {formatDate(doc.upload_date)} • {doc.total_chunks} chunks
                            </div>
                        </div>
                        <button
                            className="delete-btn"
                            onClick={() => onDelete(doc.doc_id)}
                            disabled={isDeleting === doc.doc_id}
                            title="Delete document"
                        >
                            {isDeleting === doc.doc_id ? '⏳' : '🗑️'}
                        </button>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .document-list {
          margin-bottom: 1rem;
          background: #f7fafc;
          border-radius: 8px;
          padding: 1rem;
        }

        .list-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .documents {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .document-item:hover {
          border-color: #cbd5e0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .doc-info {
          flex: 1;
          min-width: 0;
        }

        .doc-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #2d3748;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-meta {
          font-size: 0.75rem;
          color: #718096;
          margin-top: 0.25rem;
        }

        .delete-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          opacity: 0.6;
        }

        .delete-btn:hover:not(:disabled) {
          opacity: 1;
          background: #fed7d7;
        }

        .delete-btn:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }
      `}</style>
        </div>
    );
}

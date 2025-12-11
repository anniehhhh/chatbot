// components/MessageInput.tsx
"use client";
import React, { useState, useRef } from "react";

interface MessageInputProps {
  onSend: (text: string, useWebSearch?: boolean) => Promise<void> | void;
  onUpload: (file: File) => Promise<void>;
  conversationId: string;
}

export default function MessageInput({ onSend, onUpload, conversationId }: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(text, webSearchMode);
      setText("");
      setWebSearchMode(false); // Reset after sending
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="input-area">
      <textarea
        placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Message input"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        className="btn-upload"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Upload PDF"
      >
        {uploading ? "📤" : "📎"}
      </button>
      <button
        className={`btn-web-search ${webSearchMode ? 'active' : ''}`}
        onClick={() => setWebSearchMode(!webSearchMode)}
        disabled={sending}
        title={webSearchMode ? "Web search enabled" : "Enable web search"}
      >
        {webSearchMode ? "🌐" : "🔍"}
      </button>
      <button className="btn-send" onClick={submit} disabled={sending || !text.trim()}>
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}

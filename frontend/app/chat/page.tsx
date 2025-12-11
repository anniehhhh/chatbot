// app/chat/page.tsx
"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

type Message = { id: string; role: "user" | "assistant" | "system"; content: string };



export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "sys-1", role: "system", content: "You are a helpful assistant." },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploadPopup, setUploadPopup] = useState<string | null>(null);
  const conversationId = "default";

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      setUploadPopup('⚠️ Only PDF files are allowed');
      setTimeout(() => setUploadPopup(null), 3000);
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadPopup('⚠️ File size must be less than 10MB');
      setTimeout(() => setUploadPopup(null), 3000);
      return;
    }

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

      // Show popup notification
      setUploadPopup(`✓ File uploaded successfully!`);
      setTimeout(() => setUploadPopup(null), 3000);
    } catch (err: any) {
      setUploadPopup(`⚠️ ${err.message || 'Failed to upload file'}`);
      setTimeout(() => setUploadPopup(null), 3000);
    }
  };

  const addMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const sendMessage = async (text: string, useWebSearch: boolean = false) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    addMessage(userMsg);
    setLoading(true);

    try {
      const res = await fetch("/api/proxy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: "user",
          conversation_id: conversationId,
          use_web_search: useWebSearch,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Server error");
      }
      const data = await res.json();
      const reply = data.response ?? "No response";

      // Add indicator if RAG was used
      let replyContent = reply;
      if (data.used_rag) {
        replyContent = `📚 *Answer based on uploaded documents:*\n\n${reply}`;
      } else if (data.used_search) {
        replyContent = `🌐 *Answer with web search:*\n\n${reply}`;
      }

      addMessage({ id: `b-${Date.now()}`, role: "assistant", content: replyContent });
    } catch (err: any) {
      addMessage({ id: `err-${Date.now()}`, role: "assistant", content: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page">
        <div className="chat-card">
          <ChatWindow messages={messages} isLoading={loading} />
          <MessageInput onSend={sendMessage} onUpload={handleFileUpload} conversationId={conversationId} />
        </div>
      </div>

      {/* Upload Success Popup */}
      {uploadPopup && (
        <div className="upload-popup">
          {uploadPopup}
        </div>
      )}

      <style jsx>{`
        .upload-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          font-size: 0.875rem;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

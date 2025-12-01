// components/ChatWindow.tsx
"use client";
import React, { useEffect, useRef } from "react";
import Message from "./Message";

type Msg = { id: string; role: "user" | "assistant" | "system"; content: string };

export default function ChatWindow({ messages, isLoading }: { messages: Msg[]; isLoading?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // scroll to bottom smoothly
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-messages" ref={containerRef} aria-live="polite">
      {messages.map(m => (
        <Message key={m.id} role={m.role} content={m.content} />
      ))}

      {isLoading && (
        <div style={{ marginTop: 6 }} className="typing">Assistant is typing…</div>
      )}
    </div>
  );
}

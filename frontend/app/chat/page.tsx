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

  const addMessage = (m: Message) => setMessages(prev => [...prev, m]);

  const sendMessage = async (text: string) => {
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
          conversation_id: "default",
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Server error");
      }
      const data = await res.json();
      const reply = data.response ?? "No response";
      addMessage({ id: `b-${Date.now()}`, role: "assistant", content: reply });
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
          <MessageInput onSend={sendMessage} />
        </div>
      </div>
    </>
  );
}

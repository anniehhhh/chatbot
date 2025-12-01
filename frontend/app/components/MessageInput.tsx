// components/MessageInput.tsx
"use client";
import React, { useState } from "react";

export default function MessageInput({ onSend }: { onSend: (text: string) => Promise<void> | void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(text);
      setText("");
    } finally {
      setSending(false);
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
      <button className="btn-send" onClick={submit} disabled={sending || !text.trim()}>
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}

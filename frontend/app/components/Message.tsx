// components/Message.tsx
import React from "react";

export default function Message({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  const classRow = isUser ? "msg-row user" : "msg-row";
  const bubbleClass = role === "assistant" ? "msg-bubble assistant" : role === "system" ? "msg-bubble system" : "msg-bubble user";

  return (
    <div className={classRow}>
      <div className={bubbleClass} dangerouslySetInnerHTML={{ __html: escapeHtml(content).replace(/\n/g, "<br/>") }} />
    </div>
  );
}

// basic HTML escape to avoid injection
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// components/Header.tsx
import React from "react";

export default function Header() {
  return (
    <header className="header" role="banner">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="title">My Chatbot</div>
        <div className="subtitle">Connected to FastAPI / Groq</div>
      </div>
    </header>
  );
}

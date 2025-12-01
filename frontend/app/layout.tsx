// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = {
  title: "Chatbot UI",
  description: "Chat UI connected to FastAPI backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

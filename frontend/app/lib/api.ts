// lib/api.ts
import axios from "axios";

export async function sendChatMessage(payload: { message: string; role: string; conversation_id: string }) {
  const resp = await axios.post("/api/proxy-chat", payload);
  return resp.data;
}

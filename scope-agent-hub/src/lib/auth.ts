import { useEffect, useState } from "react";
import api from "./api";

export type Role = "admin" | "agent";

export type Agent = {
  _id: string;
  name: string;
  email: string;
  totalLeads?: number;
  totalTricked?: number;
};

export type Session = { 
  role: Role; 
  name: string; 
  email: string; 
  _id: string; 
  token: string 
};

const SESSION_KEY = "sms_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("sms-session"));
}

export async function login(email: string, password: string): Promise<Session | null> {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    setSession(data);
    return data;
  } catch (error) {
    console.error("Login failed:", error);
    return null;
  }
}

export function useAgents() {
  const [agents, setState] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchAgents();
    setState(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { agents, loading, refresh };
}

export function useSession() {
  const [session, setState] = useState<Session | null>(() => getSession());
  useEffect(() => {
    const h = () => setState(getSession());
    window.addEventListener("sms-session", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("sms-session", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return session;
}

// Agent Management (Admin)
export async function fetchAgents(): Promise<Agent[]> {
  try {
    const { data } = await api.get("/agent/stats");
    return data;
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return [];
  }
}

export async function createAdmin(name: string, email: string, password: string) {
  try {
    await api.post("/auth/register", { name, email, password });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.response?.data?.message || "Failed to create admin" };
  }
}

export async function createAgent(name: string, email: string, password: string) {
  try {
    await api.post("/agent/create", { name, email, password });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.response?.data?.message || "Failed to create agent" };
  }
}

// Lead Management (Agent)
export async function uploadLeads(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/lead/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { ok: true, message: data.message };
  } catch (error: any) {
    return { ok: false, error: error.response?.data?.message || "Failed to upload leads" };
  }
}

export async function fetchLeads() {
  try {
    const { data } = await api.get("/lead");
    return data;
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function markLeadAsTricked(leadId: string) {
  try {
    await api.post("/lead/trick", { leadId });
    return { ok: true };
  } catch (error) {
    return { ok: false };
  }
}

export async function sendWhatsApp(mobile: string) {
  try {
    await api.post("/lead/send-whatsapp", { mobile });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.response?.data?.message || "Failed to send WhatsApp" };
  }
}

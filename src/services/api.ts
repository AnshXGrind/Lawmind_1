import { User, Draft, LegalEvent } from "../types";

const API_BASE = "/api";

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    register: async (email: string, password: string, name: string): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error("Registration failed");
      return res.json();
    },
  },
  drafts: {
    list: async (userId: number): Promise<Draft[]> => {
      const res = await fetch(`${API_BASE}/drafts?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return res.json();
    },
    create: async (userId: number, title: string, content: string, type: string): Promise<{ id: number }> => {
      const res = await fetch(`${API_BASE}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, content, type }),
      });
      if (!res.ok) throw new Error("Failed to create draft");
      return res.json();
    },
    update: async (id: number, title: string, content: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/drafts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to update draft");
    },
    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/drafts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete draft");
    },
  },
  events: {
    list: async (userId: number): Promise<LegalEvent[]> => {
      const res = await fetch(`${API_BASE}/events?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    create: async (userId: number, title: string, description: string, event_date: string, type: string): Promise<{ id: number }> => {
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, description, event_date, type }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete event");
    },
  },
};

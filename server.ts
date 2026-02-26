import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Initialize Database
const db = new Database("lawmind.db");
db.pragma("journal_mode = WAL");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
      const result = stmt.run(email, password, name);
      res.json({ id: result.lastInsertRowid, email, name });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ id: user.id, email: user.email, name: user.name });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/drafts", (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const drafts = db.prepare("SELECT * FROM drafts WHERE user_id = ? ORDER BY updated_at DESC").all(userId);
    res.json(drafts);
  });

  app.post("/api/drafts", (req, res) => {
    const { userId, title, content, type } = req.body;
    const stmt = db.prepare("INSERT INTO drafts (user_id, title, content, type) VALUES (?, ?, ?, ?)");
    const result = stmt.run(userId, title, content, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/drafts/:id", (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const stmt = db.prepare("UPDATE drafts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    stmt.run(title, content, id);
    res.json({ success: true });
  });

  app.delete("/api/drafts/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM drafts WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Calendar API
  app.get("/api/events", (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const events = db.prepare("SELECT * FROM events WHERE user_id = ? ORDER BY event_date ASC").all(userId);
    res.json(events);
  });

  app.post("/api/events", (req, res) => {
    const { userId, title, description, event_date, type } = req.body;
    const stmt = db.prepare("INSERT INTO events (user_id, title, description, event_date, type) VALUES (?, ?, ?, ?, ?)");
    const result = stmt.run(userId, title, description, event_date, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/events/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM events WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

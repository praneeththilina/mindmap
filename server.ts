import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate API key on startup
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}

const db = new Database("study_maps.db");
db.pragma('foreign_keys = ON');

// Helper to get user's Gemini API key
const getUserGeminiKey = (userId: string): string | null => {
  const user = db.prepare("SELECT gemini_api_key FROM users WHERE id = ?").get(userId) as { gemini_api_key: string | null } | undefined;
  return user?.gemini_api_key || null;
};

// ... existing database initialization ...
db.exec(`
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT DEFAULT 'user_1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL,
    notes TEXT,
    color TEXT,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    shape TEXT DEFAULT 'rounded',
    mastery_level INTEGER DEFAULT 0,
    is_important INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    font_size INTEGER,
    text_color TEXT,
    is_bold INTEGER DEFAULT 0,
    is_italic INTEGER DEFAULT 0,
    group_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    last_active DATETIME
  );

  CREATE TABLE IF NOT EXISTS deadlines (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'user_1',
    title TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    priority TEXT DEFAULT 'medium',
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'book',
    owner_id TEXT DEFAULT 'user_1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add owner_id to existing maps if not present
try {
  db.prepare("ALTER TABLE maps ADD COLUMN owner_id TEXT DEFAULT 'user_1'").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add user_id to existing deadlines if not present  
try {
  db.prepare("ALTER TABLE deadlines ADD COLUMN user_id TEXT DEFAULT 'user_1'").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add onboarding_completed to users
try {
  db.prepare("ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add user's Gemini API key
try {
  db.prepare("ALTER TABLE users ADD COLUMN gemini_api_key TEXT").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add folder_id to maps
try {
  db.prepare("ALTER TABLE maps ADD COLUMN folder_id TEXT").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add owner_id to folders
try {
  db.prepare("ALTER TABLE folders ADD COLUMN owner_id TEXT DEFAULT 'user_1'").run();
} catch (e) {
  // Column already exists, ignore
}

// Migration: Add is_collapsed to nodes
try {
  db.prepare("ALTER TABLE nodes ADD COLUMN is_collapsed INTEGER DEFAULT 0").run();
} catch (e) {
  // Column already exists, ignore
}

// Update existing records to have user_1 as owner
db.prepare("UPDATE maps SET owner_id = 'user_1' WHERE owner_id IS NULL OR owner_id = ''").run();
db.prepare("UPDATE deadlines SET user_id = 'user_1' WHERE user_id IS NULL OR user_id = ''").run();

// ... existing seed code ...
const mapCount = db.prepare("SELECT COUNT(*) as count FROM maps").get() as { count: number };
if (mapCount.count === 0) {
  const mapId = "map_1";
  db.prepare("INSERT INTO maps (id, title, description) VALUES (?, ?, ?)").run(
    mapId,
    "Neuroscience 101",
    "Core concepts of the human brain"
  );

  db.prepare(`
    INSERT INTO nodes (id, map_id, parent_id, title, notes, color, x, y, shape, mastery_level) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("node_root", mapId, null, "The Brain", "Central Concept", "#308ce8", 0, 0, "rounded", 50);

  db.prepare(`
    INSERT INTO nodes (id, map_id, parent_id, title, notes, color, x, y, shape, mastery_level) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("node_1", mapId, "node_root", "Synapses", "Connection points", "#4ade80", 200, -100, "circle", 100);

  db.prepare(`
    INSERT INTO nodes (id, map_id, parent_id, title, notes, color, x, y, shape, mastery_level) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("node_2", mapId, "node_root", "Neurotransmitters", "Chemical messengers", "#308ce8", 200, 100, "rounded", 25);

  db.prepare("INSERT INTO user_stats (user_id, name, avatar, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?)").run(
    "user_1", "Alex", "https://picsum.photos/seed/alex/100/100", 5430, 5, 7
  );
  db.prepare("INSERT INTO user_stats (user_id, name, avatar, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?)").run(
    "user_2", "Sarah Jenkins", "https://picsum.photos/seed/sarah/100/100", 12450, 12, 15
  );
  db.prepare("INSERT INTO user_stats (user_id, name, avatar, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?)").run(
    "user_3", "Mike Chen", "https://picsum.photos/seed/mike/100/100", 11200, 10, 12
  );
}

const deadlineCount = db.prepare("SELECT COUNT(*) as count FROM deadlines").get() as { count: number };
if (deadlineCount.count === 0) {
  db.prepare("INSERT INTO deadlines (id, title, due_date, priority, is_completed) VALUES (?, ?, ?, ?, ?)").run(
    "dl_1", "Neuroscience Midterm", new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), "high", 0
  );
  db.prepare("INSERT INTO deadlines (id, title, due_date, priority, is_completed) VALUES (?, ?, ?, ?, ?)").run(
    "dl_2", "History Essay Draft", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), "medium", 0
  );
  db.prepare("INSERT INTO deadlines (id, title, due_date, priority, is_completed) VALUES (?, ?, ?, ?, ?)").run(
    "dl_3", "Lab Report", new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), "medium", 1
  );
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  // Presence tracking
  const rooms = new Map<string, Map<string, any>>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-map", ({ mapId, user }) => {
      socket.join(mapId);
      
      if (!rooms.has(mapId)) {
        rooms.set(mapId, new Map());
      }
      
      const userData = { ...user, socketId: socket.id, cursor: { x: 0, y: 0 }, selectedNodeIds: [] };
      rooms.get(mapId)!.set(socket.id, userData);
      
      // Notify others and send current users to the new user
      io.to(mapId).emit("presence-update", Array.from(rooms.get(mapId)!.values()));
      console.log(`User ${user.name} joined map ${mapId}`);
    });

    socket.on("cursor-move", ({ mapId, cursor }) => {
      const room = rooms.get(mapId);
      if (room && room.has(socket.id)) {
        room.get(socket.id).cursor = cursor;
        socket.to(mapId).emit("cursor-update", { socketId: socket.id, cursor });
      }
    });

    socket.on("selection-change", ({ mapId, selectedNodeIds }) => {
      const room = rooms.get(mapId);
      if (room && room.has(socket.id)) {
        room.get(socket.id).selectedNodeIds = selectedNodeIds;
        socket.to(mapId).emit("selection-update", { socketId: socket.id, selectedNodeIds });
      }
    });

    socket.on("node-change", ({ mapId, changeType, node }) => {
      // Broadcast changes to others so they can update their local state
      socket.to(mapId).emit("node-remote-change", { changeType, node });
    });

    socket.on("disconnecting", () => {
      for (const mapId of socket.rooms) {
        const room = rooms.get(mapId);
        if (room) {
          room.delete(socket.id);
          io.to(mapId).emit("presence-update", Array.from(room.values()));
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/maps", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const maps = db.prepare(`
      SELECT m.*, COUNT(n.id) as node_count, COALESCE(AVG(n.mastery_level), 0) as mastery_percentage,
             f.name as folder_name, f.color as folder_color
      FROM maps m 
      LEFT JOIN nodes n ON m.id = n.map_id
      LEFT JOIN folders f ON m.folder_id = f.id
      WHERE m.owner_id = ?
      GROUP BY m.id ORDER BY m.updated_at DESC
    `).all(userId);
    res.json(maps);
  });

  app.get("/api/maps/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const map = db.prepare("SELECT * FROM maps WHERE id = ? AND owner_id = ?").get(req.params.id, userId);
    if (!map) {
      res.status(404).json({ error: "Map not found" });
      return;
    }
    const nodes = db.prepare("SELECT * FROM nodes WHERE map_id = ?").all(req.params.id);
    const mappedNodes = nodes.map((node: any) => ({
      ...node, fontSize: node.font_size, textColor: node.text_color, isBold: !!node.is_bold, isItalic: !!node.is_italic, is_collapsed: !!node.is_collapsed
    }));
    res.json({ ...map, nodes: mappedNodes });
  });

  app.post("/api/maps", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { title, description } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO maps (id, title, description, owner_id, folder_id) VALUES (?, ?, ?, ?, ?)").run(
      id, title, description, userId, req.body.folder_id || null
    );
    res.json({ id, title, description, owner_id: userId, folder_id: req.body.folder_id || null });
  });

  app.put("/api/maps/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { title, description, folder_id } = req.body;
    const result = db.prepare("UPDATE maps SET title = ?, description = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?").run(
      title, description, folder_id ?? null, req.params.id, userId
    );
    if (result.changes === 0) {
      res.status(404).json({ error: "Map not found" });
      return;
    }
    res.json({ success: true });
  });

  app.delete("/api/maps/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = db.prepare("DELETE FROM maps WHERE id = ? AND owner_id = ?").run(req.params.id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: "Map not found" });
      return;
    }
    res.json({ success: true });
  });

  // Folder APIs
  app.get("/api/folders", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const folders = db.prepare(`
      SELECT f.*, COUNT(m.id) as map_count 
      FROM folders f 
      LEFT JOIN maps m ON m.folder_id = f.id 
      WHERE f.owner_id = ? 
      GROUP BY f.id 
      ORDER BY f.name ASC
    `).all(userId);
    res.json(folders);
  });

  app.post("/api/folders", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { name, color, icon } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO folders (id, name, color, icon, owner_id) VALUES (?, ?, ?, ?, ?)").run(
      id, name, color || '#3b82f6', icon || 'book', userId
    );
    res.json({ id, name, color: color || '#3b82f6', icon: icon || 'book', owner_id: userId, map_count: 0 });
  });

  app.put("/api/folders/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { name, color, icon } = req.body;
    const result = db.prepare("UPDATE folders SET name = ?, color = ?, icon = ? WHERE id = ? AND owner_id = ?").run(
      name, color, icon, req.params.id, userId
    );
    if (result.changes === 0) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    res.json({ success: true });
  });

  app.delete("/api/folders/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    // Remove folder reference from maps
    db.prepare("UPDATE maps SET folder_id = NULL WHERE folder_id = ? AND owner_id = ?").run(req.params.id, userId);
    const result = db.prepare("DELETE FROM folders WHERE id = ? AND owner_id = ?").run(req.params.id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }
    res.json({ success: true });
  });

  app.put("/api/maps/:id/folder", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { folder_id } = req.body;
    const result = db.prepare("UPDATE maps SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?").run(
      folder_id, req.params.id, userId
    );
    if (result.changes === 0) {
      res.status(404).json({ error: "Map not found" });
      return;
    }
    res.json({ success: true });
  });

  app.post("/api/nodes", (req, res) => {
    const userId = req.headers['x-user-id'] as string || '';
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const { map_id, parent_id, title, notes, color, x, y, shape, fontSize, textColor, isBold, isItalic } = req.body;
    
    // Verify map belongs to user
    const map = db.prepare("SELECT * FROM maps WHERE id = ? AND owner_id = ?").get(map_id, userId);
    if (!map) {
      res.status(403).json({ error: "Map not found or access denied" });
      return;
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO nodes (id, map_id, parent_id, title, notes, color, x, y, shape, mastery_level, font_size, text_color, is_bold, is_italic) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, map_id, parent_id, title, notes, color || "#ffffff", x || 0, y || 0, shape || "rounded", 0, fontSize, textColor, isBold ? 1 : 0, isItalic ? 1 : 0);
    const newNode = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    const mappedNode = {
      ...newNode, fontSize: newNode.font_size, textColor: newNode.text_color, isBold: !!newNode.is_bold, isItalic: !!newNode.is_italic
    };
    res.json(mappedNode);
  });

  app.put("/api/nodes/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string || '';
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // Verify node belongs to user's map
    const node = db.prepare(`
      SELECT n.* FROM nodes n
      JOIN maps m ON n.map_id = m.id
      WHERE n.id = ? AND m.owner_id = ?
    `).get(req.params.id, userId);
    
    if (!node) {
      res.status(403).json({ error: "Node not found or access denied" });
      return;
    }
    
    const { title, notes, color, x, y, shape, mastery_level, is_important, is_starred, fontSize, textColor, isBold, isItalic, parent_id, group_id, is_collapsed } = req.body;
    db.prepare(`
      UPDATE nodes SET 
        title = COALESCE(?, title), notes = COALESCE(?, notes), color = COALESCE(?, color), x = COALESCE(?, x), y = COALESCE(?, y),
        shape = COALESCE(?, shape), mastery_level = COALESCE(?, mastery_level), is_important = COALESCE(?, is_important),
        is_starred = COALESCE(?, is_starred), font_size = COALESCE(?, font_size), text_color = COALESCE(?, text_color),
        is_bold = COALESCE(?, is_bold), is_italic = COALESCE(?, is_italic), parent_id = COALESCE(?, parent_id),
        group_id = COALESCE(?, group_id), is_collapsed = COALESCE(?, is_collapsed), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, notes, color, x, y, shape, mastery_level, is_important, is_starred, 
      fontSize, textColor, isBold !== undefined ? (isBold ? 1 : 0) : null, 
      isItalic !== undefined ? (isItalic ? 1 : 0) : null, 
      parent_id, group_id, is_collapsed !== undefined ? (is_collapsed ? 1 : 0) : null, req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/nodes/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string || '';
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // Verify node belongs to user's map
    const node = db.prepare(`
      SELECT n.* FROM nodes n
      JOIN maps m ON n.map_id = m.id
      WHERE n.id = ? AND m.owner_id = ?
    `).get(req.params.id, userId);
    
    if (!node) {
      res.status(403).json({ error: "Node not found or access denied" });
      return;
    }
    
    const result = db.prepare("DELETE FROM nodes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/user/stats", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    res.json({ ...stats, email: user?.email, registeredName: user?.name });
  });

  app.put("/api/user/profile", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { name, avatar } = req.body;
    db.prepare("UPDATE user_stats SET name = ?, avatar = ? WHERE user_id = ?").run(name, avatar, userId);
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId);
    res.json(stats);
  });

  app.put("/api/user/gemini-key", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { geminiApiKey } = req.body;
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      db.prepare("UPDATE users SET gemini_api_key = NULL WHERE id = ?").run(userId);
      res.json({ success: true, hasKey: false });
      return;
    }
    db.prepare("UPDATE users SET gemini_api_key = ? WHERE id = ?").run(geminiApiKey.trim(), userId);
    res.json({ success: true, hasKey: true });
  });

  app.get("/api/user/gemini-key", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = db.prepare("SELECT gemini_api_key FROM users WHERE id = ?").get(userId) as { gemini_api_key: string | null } | undefined;
    res.json({ hasKey: !!user?.gemini_api_key });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as { id: string; name: string; email: string; password: string; onboarding_completed: number | null } | undefined;
    
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    
    // Existing users (NULL) are treated as having completed onboarding
    // New users will have onboarding_completed = 0 (false) until they complete
    const onboardingCompleted = user.onboarding_completed === 1 || user.onboarding_completed === null;
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        onboardingCompleted
      } 
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    
    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existingUser) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }
    
    const id = `user_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)").run(id, name, email, hashedPassword);
      db.prepare("INSERT INTO user_stats (user_id, name, avatar, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '')}/100/100`, 0, 1, 0);
      res.json({ success: true, user: { id, name, email, onboardingCompleted: false } });
    } catch (error: any) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (!user) {
      res.status(404).json({ error: "No account found with this email" });
      return;
    }
    
    res.json({ success: true, message: "Password reset link sent to your email" });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
    
    if (result.changes === 0) {
      res.status(404).json({ error: "No account found with this email" });
      return;
    }
    
    res.json({ success: true, message: "Password reset successfully" });
  });

  app.post("/api/user/onboarding-complete", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    db.prepare("UPDATE users SET onboarding_completed = 1 WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  app.get("/api/user/onboarding-status", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = db.prepare("SELECT onboarding_completed FROM users WHERE id = ?").get(userId) as { onboarding_completed: number } | undefined;
    res.json({ onboarding_completed: user?.onboarding_completed === 1 });
  });

  app.get("/api/deadlines", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const deadlines = db.prepare("SELECT * FROM deadlines WHERE user_id = ? ORDER BY due_date ASC").all(userId);
    res.json(deadlines);
  });

  app.post("/api/deadlines", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { title, due_date, priority } = req.body;
    const id = `dl_${Math.random().toString(36).substr(2, 9)}`;
    db.prepare("INSERT INTO deadlines (id, user_id, title, due_date, priority, is_completed) VALUES (?, ?, ?, ?, ?, 0)").run(
      id, userId, title, due_date, priority || 'medium'
    );
    res.json({ id, user_id: userId, title, due_date, priority, is_completed: 0 });
  });

  app.put("/api/deadlines/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { title, due_date, priority, is_completed } = req.body;
    db.prepare(`
      UPDATE deadlines SET 
        title = COALESCE(?, title), 
        due_date = COALESCE(?, due_date), 
        priority = COALESCE(?, priority), 
        is_completed = COALESCE(?, is_completed)
      WHERE id = ? AND user_id = ?
    `).run(title, due_date, priority, is_completed, req.params.id, userId);
    res.json({ success: true });
  });

  app.delete("/api/deadlines/:id", (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    db.prepare("DELETE FROM deadlines WHERE id = ? AND user_id = ?").run(req.params.id, userId);
    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare("SELECT * FROM user_stats ORDER BY xp DESC LIMIT 10").all();
    res.json(leaderboard);
  });

  app.post("/api/ai/summarize", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const apiKey = getUserGeminiKey(userId);
    if (!apiKey) {
      res.status(400).json({ error: "Please add your Gemini API key in Settings to use AI features" });
      return;
    }
    const { notes } = req.body;
    if (!notes) {
      res.status(400).json({ error: "Notes are required" });
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Summarize the following notes into a concise paragraph (max 3 sentences): "${notes}"`,
        config: { responseMimeType: "text/plain" }
      });
      res.json({ summary: response.text });
    } catch (error) {
      console.error("AI summarize failed:", error);
      res.status(500).json({ error: "Summarization failed" });
    }
  });

  app.post("/api/ai/generate-node", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { nodeTitle, nodeNotes, parentId, mapId } = req.body;
    const apiKey = getUserGeminiKey(userId);
    if (!apiKey) {
      res.status(400).json({ error: "Please add your Gemini API key in Settings to use AI features" });
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the current mind map node titled "${nodeTitle}" with notes "${nodeNotes}", suggest a relevant child node. Return a JSON object with "title" and "notes" fields. The notes should be a brief explanation (max 2 sentences).`,
        config: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { title: { type: "STRING" }, notes: { type: "STRING" } }, required: ["title", "notes"] } }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("AI generate node failed:", error);
      res.status(500).json({ error: "Node generation failed" });
    }
  });

  app.post("/api/ai/generate-subtopics", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const apiKey = getUserGeminiKey(userId);
    if (!apiKey) {
      res.status(400).json({ error: "Please add your Gemini API key in Settings to use AI features" });
      return;
    }
    const { context, nodeTitle, nodeNotes } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Context: ${context} -> Current Node: ${nodeTitle} (${nodeNotes}) Suggest 3-5 relevant sub-topics (child nodes) for the current node. Return a JSON array of objects, each with "title" and "notes" fields.`,
        config: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, notes: { type: "STRING" } }, required: ["title", "notes"] } } }
      });
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("AI generate subtopics failed:", error);
      res.status(500).json({ error: "Subtopics generation failed" });
    }
  });

  app.post("/api/ai/smart-schedule", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const apiKey = getUserGeminiKey(userId);
    if (!apiKey) {
      res.status(400).json({ error: "Please add your Gemini API key in Settings to use AI features" });
      return;
    }
    const { deadlines } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Given these pending deadlines: [${deadlines}], suggest a concise 1-sentence study focus for today. Be encouraging.`
      });
      res.json({ suggestion: response.text });
    } catch (error) {
      console.error("AI smart schedule failed:", error);
      res.status(500).json({ error: "Smart schedule failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

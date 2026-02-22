import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("study_maps.db");
db.pragma('foreign_keys = ON');

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
    title TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    priority TEXT DEFAULT 'medium',
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

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
    const maps = db.prepare(`
      SELECT m.*, COUNT(n.id) as node_count, COALESCE(AVG(n.mastery_level), 0) as mastery_percentage
      FROM maps m LEFT JOIN nodes n ON m.id = n.map_id
      GROUP BY m.id ORDER BY m.updated_at DESC
    `).all();
    res.json(maps);
  });

  app.get("/api/maps/:id", (req, res) => {
    const map = db.prepare("SELECT * FROM maps WHERE id = ?").get(req.params.id);
    const nodes = db.prepare("SELECT * FROM nodes WHERE map_id = ?").all(req.params.id);
    const mappedNodes = nodes.map((node: any) => ({
      ...node, fontSize: node.font_size, textColor: node.text_color, isBold: !!node.is_bold, isItalic: !!node.is_italic
    }));
    res.json({ ...map, nodes: mappedNodes });
  });

  app.post("/api/maps", (req, res) => {
    const { title, description } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO maps (id, title, description) VALUES (?, ?, ?)").run(id, title, description);
    res.json({ id, title, description });
  });

  app.post("/api/nodes", (req, res) => {
    const { map_id, parent_id, title, notes, color, x, y, shape, fontSize, textColor, isBold, isItalic } = req.body;
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
    const { title, notes, color, x, y, shape, mastery_level, is_important, is_starred, fontSize, textColor, isBold, isItalic, parent_id, group_id } = req.body;
    db.prepare(`
      UPDATE nodes SET 
        title = COALESCE(?, title), notes = COALESCE(?, notes), color = COALESCE(?, color), x = COALESCE(?, x), y = COALESCE(?, y),
        shape = COALESCE(?, shape), mastery_level = COALESCE(?, mastery_level), is_important = COALESCE(?, is_important),
        is_starred = COALESCE(?, is_starred), font_size = COALESCE(?, font_size), text_color = COALESCE(?, text_color),
        is_bold = COALESCE(?, is_bold), is_italic = COALESCE(?, is_italic), parent_id = COALESCE(?, parent_id),
        group_id = COALESCE(?, group_id), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, notes, color, x, y, shape, mastery_level, is_important, is_starred, 
      fontSize, textColor, isBold !== undefined ? (isBold ? 1 : 0) : null, 
      isItalic !== undefined ? (isItalic ? 1 : 0) : null, 
      parent_id, group_id, req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/nodes/:id", (req, res) => {
    const result = db.prepare("DELETE FROM nodes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/user/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = 'user_1'").get();
    res.json(stats);
  });

  app.get("/api/deadlines", (req, res) => {
    const deadlines = db.prepare("SELECT * FROM deadlines ORDER BY due_date ASC").all();
    res.json(deadlines);
  });

  app.post("/api/deadlines", (req, res) => {
    const { title, due_date, priority } = req.body;
    const id = `dl_${Math.random().toString(36).substr(2, 9)}`;
    db.prepare("INSERT INTO deadlines (id, title, due_date, priority, is_completed) VALUES (?, ?, ?, ?, 0)").run(
      id, title, due_date, priority || 'medium'
    );
    res.json({ id, title, due_date, priority, is_completed: 0 });
  });

  app.put("/api/deadlines/:id", (req, res) => {
    const { title, due_date, priority, is_completed } = req.body;
    db.prepare(`
      UPDATE deadlines SET 
        title = COALESCE(?, title), 
        due_date = COALESCE(?, due_date), 
        priority = COALESCE(?, priority), 
        is_completed = COALESCE(?, is_completed)
      WHERE id = ?
    `).run(title, due_date, priority, is_completed, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/deadlines/:id", (req, res) => {
    db.prepare("DELETE FROM deadlines WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare("SELECT * FROM user_stats ORDER BY xp DESC LIMIT 10").all();
    res.json(leaderboard);
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

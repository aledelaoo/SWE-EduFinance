import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// ======== CONFIG ========
const PORT = 4000;
const FRONTEND_ORIGIN = "http://localhost:5173"; // Vite default

// ======== MIDDLEWARE ========
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ======== FILE DB HELPERS ========
const DB_PATH = path.join(process.cwd(), "db.json");

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    const base = { users: [], transactions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(base, null, 2), "utf8");
    return base;
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// bootstrap if missing
if (!fs.existsSync(DB_PATH)) writeDB({ users: [], transactions: [] });

// ======== UTILS ========
function nowMonthLabel() {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
function requireUser(req, res, next) {
  const uid = req.cookies?.uid;
  if (!uid) return res.status(401).json({ error: { message: "Not logged in" } });
  req.userId = Number(uid);
  next();
}

// ======== AUTH ROUTES ========

// Register a brand-new user (name optional). Auto-logs in on success.
app.post("/auth/register", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password required" } });
  }

  const db = readDB();
  const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    return res.status(409).json({ error: { message: "User already exists" } });
  }

  const newId = db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const nameGuess = name?.trim() || email.split("@")[0].replace(/[._]/g, " ");
  const finalName = nameGuess ? nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1) : "User";

  const user = {
    id: newId,
    name: finalName,
    email: String(email).toLowerCase(),
    password: String(password) // plain for this minimal demo
  };

  db.users.push(user);
  writeDB(db);

  res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });
  return res.status(201).json({
    ok: true,
    userId: user.id,
    email: user.email,
    name: user.name,
    accessToken: `devtoken-${user.id}`
  });
});

// Login must match an existing user.
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password required" } });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: { message: "Invalid credentials" } });
  }

  res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });

  return res.json({
    ok: true,
    userId: user.id,
    email: user.email,
    name: user.name,
    accessToken: `devtoken-${user.id}`
  });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("uid");
  res.json({ ok: true });
});

// ======== APP ROUTES ========

app.get("/transactions", requireUser, (req, res) => {
  const db = readDB();
  const list = db.transactions
    .filter((t) => t.userId === req.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(list);
});

app.post("/transactions", requireUser, (req, res) => {
  const { amount, category, name, date, note } = req.body || {};
  if (typeof amount !== "number" || !category || !name || !date) {
    return res.status(400).json({ error: { message: "amount, category, name, date are required" } });
  }
  const db = readDB();
  const nextId = db.transactions.length ? Math.max(...db.transactions.map((t) => t.id)) + 1 : 1;

  const tx = {
    id: nextId,
    userId: req.userId,
    name: String(name),
    date: String(date),
    amount: Number(amount),
    category: String(category),
    note: note ? String(note) : undefined
  };

  db.transactions.push(tx);
  writeDB(db);
  res.status(201).json(tx);
});

app.get("/balance", requireUser, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  const userName = user ? user.name : "User";
  const userTx = db.transactions.filter((t) => t.userId === req.userId);

  const income = userTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expensesAbs = userTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expensesAbs;

  res.json({
    userName,
    month: nowMonthLabel(),
    income,
    expenses: expensesAbs,
    balance
  });
});

app.get("/", (_req, res) => res.send("EduFinance minimal backend is running."));

// ======== START ========
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowing origin: ${FRONTEND_ORIGIN}`);
});

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 4000;
const FRONTEND_ORIGIN = "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to db.json file
const file = path.resolve(__dirname, "db.json");

// Set up LowDB
const adapter = new JSONFile(file);
const db = new Low(adapter, { users: [], transactions: [] });




async function main() {
    // Initialize once at startup
    await db.read(); 

  // Make sure arrays exist (preserve existing data but add missing collections)
  db.data ||= {};
  db.data.users ||= [];
  db.data.transactions ||= [];
  db.data.verificationTokens ||= [];
  db.data.passwordResetTokens ||= [];
  db.data.refreshTokens ||= [];

    // Middleware to require authentication
function requireUser(req, res, next) {
  // Try Authorization header (Bearer <token>) first
  const hdr = req.headers.authorization ?? "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "dev_access_secret");
      req.userId = (payload && payload.uid) ? Number((payload).uid) : null;
      if (!req.userId) return res.status(401).json({ error: { message: "Unauthorized" } });
      return next();
    } catch (e) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }
  }

  // Fallback to uid cookie (legacy/demo behavior)
  const uid = req.cookies?.uid;
  if (!uid) {
    return res.status(401).json({ error: { message: "Not logged in" } });
  }
  req.userId = Number(uid);
  next();
}

// Helper to get current month label
function nowMonthLabel() {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map(i => i.id ?? 0)) + 1;
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// auth routes

// Register new user
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password required" } });
  }

  try {
    // Check if user exists
    const normalizedEmail = email.toLowerCase();
    const existing = db.data.users.find(u => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: { message: "User already exists" } });
    }

    // Generate name from email if not provided
    const nameGuess = name?.trim() || email.split("@")[0].replace(/[._]/g, " ");
    const finalName = nameGuess ? nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1) : "User";
    const userId = nextId(db.data.users);

    const newUser = {
      id: userId,
      name: finalName,
      email: normalizedEmail,
      password: password, // storing plain passwords is very insecure for a real app!
      isEmailVerified: true
    };

    //Insert new user into LowDB data
    db.data.users.push(newUser);

    await db.write(); 

    // Create JWT access token (short-lived) and refresh token (long-lived)
    const accessToken = jwt.sign({ uid: userId }, process.env.JWT_ACCESS_SECRET || "dev_access_secret", { expiresIn: process.env.ACCESS_TTL || "15m" });
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshExpiresAt = Date.now() + (Number(process.env.REFRESH_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    db.data.refreshTokens.push({ token: refreshToken, userId, expiresAt: refreshExpiresAt });
    await db.write();

    // Set cookie for legacy flows and return tokens
    res.cookie("uid", userId, { httpOnly: true, sameSite: "lax", secure: false });

    return res.status(201).json({
      ok: true,
      userId: userId,
      email: normalizedEmail,
      name: finalName,
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Login existing user
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password required" } });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const user = db.data.users.find(u => u.email === normalizedEmail);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    // Respect email verification flag if present. If the flag is explicitly false, block login.
    if (user.isEmailVerified === false) {
      return res.status(403).json({ error: { message: "Email not verified" } });
    }

    // Create access and refresh tokens
    const accessToken = jwt.sign({ uid: user.id }, process.env.JWT_ACCESS_SECRET || "dev_access_secret", { expiresIn: process.env.ACCESS_TTL || "15m" });
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshExpiresAt = Date.now() + (Number(process.env.REFRESH_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    db.data.refreshTokens.push({ token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt });
    await db.write();

    res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });

    return res.json({
      ok: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Email verification removed temporarily: users are created verified by default.

// Request password reset (creates a token and returns it for demo/testing)
app.post("/auth/request-password-reset", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: { message: "Missing email" } });

  try {
    const normalizedEmail = String(email).toLowerCase();
    const user = db.data.users.find(u => u.email === normalizedEmail);
    if (!user) return res.status(200).json({ ok: true }); // don't reveal existence

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    db.data.passwordResetTokens.push({ token, userId: user.id, expiresAt });
    await db.write();

    // For demo we return token in response. In real app you'd email this.
    return res.json({ ok: true, resetToken: token, resetTokenExpiresAt: expiresAt });
  } catch (err) {
    console.error("Request password reset error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Reset password using token
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: { message: "Missing token or newPassword" } });

  try {
    const idx = db.data.passwordResetTokens.findIndex(t => t.token === token);
    if (idx === -1) return res.status(400).json({ error: { message: "Invalid or expired token" } });
    const tok = db.data.passwordResetTokens[idx];
    if (tok.expiresAt < Date.now()) {
      db.data.passwordResetTokens.splice(idx, 1);
      await db.write();
      return res.status(400).json({ error: { message: "Invalid or expired token" } });
    }

    const user = db.data.users.find(u => u.id === tok.userId);
    if (!user) return res.status(400).json({ error: { message: "Invalid token" } });

    // Update password (plain text for demo)
    user.password = newPassword;

    // Remove token
    db.data.passwordResetTokens.splice(idx, 1);
    await db.write();

    return res.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Refresh access token using refresh token
app.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: { message: "Missing refreshToken" } });

  try {
    const idx = db.data.refreshTokens.findIndex(rt => rt.token === refreshToken);
    if (idx === -1) return res.status(401).json({ error: { message: "Invalid refresh token" } });
    const rt = db.data.refreshTokens[idx];
    if (rt.expiresAt < Date.now()) {
      db.data.refreshTokens.splice(idx, 1);
      await db.write();
      return res.status(401).json({ error: { message: "Invalid refresh token" } });
    }

    // Issue new access token and rotate refresh token
    const userId = rt.userId;
    const accessToken = jwt.sign({ uid: userId }, process.env.JWT_ACCESS_SECRET || "dev_access_secret", { expiresIn: process.env.ACCESS_TTL || "15m" });
    // rotate
    db.data.refreshTokens.splice(idx, 1);
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const newRefreshExpiresAt = Date.now() + (Number(process.env.REFRESH_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    db.data.refreshTokens.push({ token: newRefreshToken, userId, expiresAt: newRefreshExpiresAt });
    await db.write();

    return res.json({ ok: true, accessToken, refreshToken: newRefreshToken, refreshTokenExpiresAt: newRefreshExpiresAt });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  try {
    const uid = req.cookies?.uid;
    const { refreshToken } = req.body || {};

    // If user id cookie present, revoke all refresh tokens for user
    if (uid) {
      const userId = Number(uid);
      db.data.refreshTokens = db.data.refreshTokens.filter(rt => rt.userId !== userId);
    }

    // If refreshToken provided, remove that single token
    if (refreshToken) {
      db.data.refreshTokens = db.data.refreshTokens.filter(rt => rt.token !== refreshToken);
    }

    db.write().catch(() => {});
    res.clearCookie("uid");
    return res.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// ========== TRANSACTION ROUTES ==========

// Get all transactions for logged-in user
app.get("/transactions", requireUser, (req, res) => {
  try {
    // Server-side filtering support: q (search query), category (category name or 'all')
    const q = (req.query.q || "").toString().trim().toLowerCase();
    const category = (req.query.category || "all").toString().toLowerCase();

    let tx = db.data.transactions.filter(t => t.user_id === req.userId);

    if (category && category !== "all") {
      tx = tx.filter(t => (t.category || "").toString().toLowerCase() === category);
    }

    if (q) {
      tx = tx.filter(t => {
        const name = (t.name || "").toString().toLowerCase();
        const cat = (t.category || "").toString().toLowerCase();
        const note = (t.note || "").toString().toLowerCase();
        return name.includes(q) || cat.includes(q) || note.includes(q);
      });
    }

    tx = tx.sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });

    return res.json(tx);
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Create new transaction
app.post("/transactions", requireUser, async(req, res) => {
  const { amount, category, name, date, note } = req.body || {};
  
  if (typeof amount !== "number" || !category || !name || !date) {
    return res.status(400).json({ 
      error: { message: "amount, category, name, date are required" } 
    });
  }

  try {
    const transactionId = nextId(db.data.transactions);

    //Create the new transaction object
    const newTransaction = {
      id: transactionId,
      user_id: req.userId,
      name: name,
      date: date,
      amount: amount,
      category: category,
      note: note || null,
    };

    //Insert new transaction into LowDB data
    db.data.transactions.push(newTransaction);

  await db.write();
    
  return res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Delete transaction
app.delete("/transactions/:id", requireUser, async(req, res) => {
  const txId = Number(req.params.id);
  
  try {
    // Verify transaction belongs to user
    const txIndex = db.data.transactions.findIndex(t => t.id === txId && t.user_id === req.userId);
    if (txIndex === -1) {
      return res.status(404).json({ error: { message: "Transaction not found" } });
    }

    db.data.transactions.splice(txIndex, 1);
    await db.write();

    return res.json({ ok: true, id: txId });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

//balance route

app.get("/balance", requireUser, (req, res) => {
  try {
    const user = db.data.users.find(u => u.id === req.userId);
    const userName = user ? user.name : "User";
    
    const transactions = db.data.transactions.filter(t => t.user_id === req.userId);

    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expensesAbs = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expensesAbs;

    return res.json({
      userName,
      month: nowMonthLabel(),
      income,
      expenses: expensesAbs,
      balance
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

//root route

app.get("/", (_req, res) => {
  res.send("EduFinance backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`CORS allowing origin: ${FRONTEND_ORIGIN}`);
  console.log(`LowDB database: db.json`);
});

}

main();
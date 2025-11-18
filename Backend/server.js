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
const adapter = new JSONFile(file); //use JSON file for storage
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
  db.data.semesters ||= []; 
  db.data.budgets ||= []; // per-user per-month budgets
  db.data.bills ||= [];
  db.data.notificationPreferences ||= [];
  

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

// Generate human-friendly month labels for a semester
// Returns array of month labels (e.g. "September 2025") between two dates inclusive
function monthLabelsBetween(startDate, endDate) {
  const labels = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cur <= end) {
    labels.push(cur.toLocaleString("en-US", { month: "long", year: "numeric" }));
    cur.setMonth(cur.getMonth() + 1);
  }
  return labels;
}

// normalize a date to canonical month id (YYYY-MM) format for budget operations
function monthIdFromDateInput(input) {
  const d = (input instanceof Date) ? input : new Date(input);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`; // e.g. 2025-09
}

// generate array of month ids (YYYY-MM) spanning from start to end date
function monthIdsBetween(startDate, endDate) {
  const ids = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cur <= end) {
    ids.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return ids;
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

// SEMESTER SETTINGS (S1)
// Set or update semester dates for the logged-in user
// When semester dates change, existing monthly budgets may need to be re-aligned
app.put("/settings/semester", requireUser, async (req, res) => {
  const { startDate, endDate } = req.body || {};
  if (!startDate || !endDate) {
    return res.status(400).json({
      error: { message: "startDate and endDate are required" },
    });
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      error: { message: "startDate and endDate must be valid ISO dates (YYYY-MM-DD)" },
    });
  }
  if (start >= end) {
    return res.status(400).json({
      error: { message: "startDate must be before endDate" },
    });
  }
  try {
    // one semester record per user
    let sem = db.data.semesters.find((s) => s.user_id === req.userId);
    const startIso = start.toISOString().slice(0, 10); // YYYY-MM-DD
    const endIso = end.toISOString().slice(0, 10);
  const months = monthLabelsBetween(start, end);
  // When semester dates change we surface the computed month labels so the frontend can
  // decide whether to initialize per-month budgets or reconcile existing ones. If a
  // migration is required (e.g. shift budgets forward), record an audit so previous
  // budgets can be inspected or restored.
    if (!sem) {
      sem = {
        id: nextId(db.data.semesters),
        user_id: req.userId,
        startDate: startIso,
        endDate: endIso,
        months,
        totalMonths: months.length,
      };
      db.data.semesters.push(sem);
  // Optionally initialize per-month budgets for a new semester. The frontend may
  // call `/budgets/init-from-semester` explicitly so that initialization remains
  // a user-driven action rather than an automatic server-side side-effect.
    } else {
  // Existing monthly budgets should be reconciled according to a clear policy
  // (for example: preserve values for overlapping months, create missing month
  // entries, or migrate/shift allocations). Implementing that policy is left to
  // the frontend or a later server-side migration step.
      sem.startDate = startIso;
      sem.endDate = endIso;
      sem.months = months;
      sem.totalMonths = months.length;
    }
    await db.write();
    return res.json({ ok: true, semester: sem });
  } catch (error) {
    console.error("Set semester error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Need to provide semester info to frontend for S1 workflows (months and totalMonths).
// Need to include canonical month ids (YYYY-MM) or a semester id so frontend can request per-month budgets.
// get semester dates for logged-in user
app.get("/settings/semester", requireUser, (req, res) => {
  try {
    const sem = db.data.semesters.find((s) => s.user_id === req.userId);

    if (!sem) {
      return res.status(404).json({
        error: { message: "Semester dates not set" },
      });
    }

    return res.json({ ok: true, semester: sem });
  } catch (error) {
    console.error("Get semester error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Need to implement BUDGET ROUTES (S1 support).
// Need to expose per-month budget CRUD so frontend can persist and display semester-distributed budgets.
// Need to secure and validate payloads and consider pagination if many months exist.
//BUDGET ROUTES
// GET budgets for a specific month (YYYY-MM) for logged-in user
app.get('/budgets', requireUser, (req, res) => {
  try {
    const month = req.query.month; // expected YYYY-MM
    if (!month) return res.status(400).json({ error: { message: 'Missing month query param (YYYY-MM)' } });

    const userBudgets = db.data.budgets.filter(b => b.user_id === req.userId && b.month === month);
    return res.json(userBudgets);
  } catch (err) {
    console.error('Get budgets error:', err);
    return res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Initialize per-month budgets from a semester (creates budgets for each month in semester)
// Body: { semesterId?: number, startDate?: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', template?: { totalBudget?: number, categories?: [{ name, allocated }] } }
app.post('/budgets/init-from-semester', requireUser, async (req, res) => {
  try {
    const { semesterId, startDate, endDate, template } = req.body || {};

  // Validate the template shape: `template.totalBudget` should be numeric and
  // `template.categories` (if present) must be an array of { name, allocated }.
  // Document and enforce the chosen distribution rules (even split vs proportional)
  // so frontend and backend produce consistent budgets.

    let sem = null;
    if (semesterId) {
      sem = db.data.semesters.find(s => s.id === Number(semesterId) && s.user_id === req.userId);
      if (!sem) return res.status(404).json({ error: { message: 'Semester not found' } });
    } else if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) return res.status(400).json({ error: { message: 'Invalid startDate/endDate' } });
      sem = { startDate: startDate, endDate: endDate, months: monthLabelsBetween(s, e) };
    } else {
      return res.status(400).json({ error: { message: 'Provide semesterId or startDate and endDate' } });
    }

    // compute canonical month ids between sem.startDate and sem.endDate
    const start = new Date(sem.startDate);
    const end = new Date(sem.endDate);
    const monthIds = monthIdsBetween(start, end);

  // Build budgets for each month. If `template.categories` is provided, copy that
  // allocation to each month. When splitting a totalBudget across months, handle
  // rounding carefully (keep cents consistent and adjust the final month if needed)
  // so the sum of per-month totals equals the original total.
    const created = [];
    for (const m of monthIds) {
      // If budget already exists for this user+month, skip to avoid duplicates
      const exists = db.data.budgets.find(b => b.user_id === req.userId && b.month === m);
      if (exists) {
        created.push(exists);
        continue;
      }

      // Need to validate and sanitize category names/allocations before storing.
      const budget = {
        id: nextId(db.data.budgets),
        user_id: req.userId,
        month: m, // YYYY-MM
        totalBudget: template?.totalBudget ? Number((template.totalBudget / monthIds.length).toFixed(2)) : (template?.categories ? template.categories.reduce((s,c) => s + (Number(c.allocated)||0), 0) : 0),
        // Need to store categories as {name, allocated} and consider adding IDs for mutability.
        categories: template?.categories ? template.categories.map(c => ({ name: c.name, allocated: Number(c.allocated) })) : [],
        createdAt: new Date().toISOString()
      };

      db.data.budgets.push(budget);
      created.push(budget);
    }

    await db.write();
    return res.status(201).json({ ok: true, created });
  } catch (err) {
    console.error('Init budgets error:', err);
    return res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Update a budget by id
app.put('/budgets/:id', requireUser, async (req, res) => {
  try {
  // Validate updates so categories sum matches `totalBudget` (or clearly document
  // the allowed discrepancy). Emitting an audit log or event when budgets change
  // makes it easier to debug and trace S1 adjustments later.
    const id = Number(req.params.id);
    const body = req.body || {};
    const idx = db.data.budgets.findIndex(b => b.id === id && b.user_id === req.userId);
    if (idx === -1) return res.status(404).json({ error: { message: 'Budget not found' } });

    const bud = db.data.budgets[idx];
    if (typeof body.totalBudget === 'number') bud.totalBudget = body.totalBudget;
    if (Array.isArray(body.categories)) bud.categories = body.categories.map(c => ({ name: c.name, allocated: Number(c.allocated) }));
    bud.updatedAt = new Date().toISOString();

    await db.write();
    return res.json(bud);
  } catch (err) {
    console.error('Update budget error:', err);
    return res.status(500).json({ error: { message: 'Server error' } });
  }
});

// BILL REMINDERS (N3)
// Track and manage bills with reminders for upcoming due dates. Supports CRUD operations and
// filtering by category or paid status. All dates handled safely using YYYY-MM-DD format.
// Helper to normalize a date string to YYYY-MM-DD
function toIsoDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
// Get all bills for the logged-in user with optional filters
// Query params: category (filter by category), paid (true/false to filter by paid status)
app.get("/bills", requireUser, (req, res) => {
  try {
    const category = req.query.category ? String(req.query.category).toLowerCase() : null;
    const paidParam = req.query.paid;
    let paidFilter = null;
    if (paidParam === "true") paidFilter = true;
    else if (paidParam === "false") paidFilter = false;

    let userBills = db.data.bills.filter(b => b.user_id === req.userId);

    if (category) {
      userBills = userBills.filter(b => (b.category || "").toString().toLowerCase() === category);
    }

    if (paidFilter !== null) {
      userBills = userBills.filter(b => b.paid === paidFilter);
    }

    // Sort by dueDate ascending (nearest due date first)
    userBills.sort((a, b) => {
      if (a.dueDate < b.dueDate) return -1;
      if (a.dueDate > b.dueDate) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    return res.json(userBills);
  } catch (err) {
    console.error("Get bills error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Create a new bill for the logged-in user with validation for required fields and amounts
// All dates are normalized to YYYY-MM-DD format for timezone safety
app.post("/bills", requireUser, async (req, res) => {
  const { name, amount, dueDate, category, note } = req.body || {};

  if (!name || typeof amount !== "number" || !dueDate) {
    return res.status(400).json({
      error: { message: "name, amount (number), and dueDate are required" },
    });
  }
  // Ensure amount is positive to prevent invalid bill records
  if (amount <= 0) {
    return res.status(400).json({
      error: { message: "amount must be greater than 0" },
    });
  }
  const normalizedDate = toIsoDateOnly(dueDate);
  if (!normalizedDate) {
    return res.status(400).json({
      error: { message: "dueDate must be a valid date (YYYY-MM-DD or ISO)" },
    });
  }
  try {
    const billId = nextId(db.data.bills);
    const newBill = {
      id: billId,
      user_id: req.userId,
      name: name,
      amount: amount,
      dueDate: normalizedDate,
      category: category || null,
      note: note || null,
      paid: false,
      createdAt: new Date().toISOString(),
    };
    db.data.bills.push(newBill);
    await db.write();

    return res.status(201).json(newBill);
  } catch (err) {
    console.error("Create bill error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});
// Get upcoming bills for the next N days (default 14)
// Need to fetch upcoming unpaid bills within a date range to remind user (N3).
// Need to ensure date filtering is inclusive (today through today+days).
// Need to ensure timezone-safe date comparisons (currently string-based YYYY-MM-DD, which is safe).
// Need to add optional filters for category, amount range for future refinement.
app.get("/bills/upcoming", requireUser, (req, res) => {
  try {
    const daysParam = Number(req.query.days || 14);
    const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 14;
    const today = new Date();
    const todayOnly = toIsoDateOnly(today);
    const end = new Date(today);
    end.setDate(end.getDate() + days);
    const endOnly = toIsoDateOnly(end);
    // If something went weird with dates, just bail
    if (!todayOnly || !endOnly) {
      return res.status(500).json({ error: { message: "Date handling error" } });
    }
    const userBills = db.data.bills.filter(b => b.user_id === req.userId);
    // Only unpaid bills between [today, today+days]
    const upcoming = userBills
      .filter(b => !b.paid)
      .filter(b => {
        const billDate = toIsoDateOnly(b.dueDate);
        if (!billDate) return false;
        // simple string comparison works because all are YYYY-MM-DD
        return billDate >= todayOnly && billDate <= endOnly;
      })
      .sort((a, b) => {
        if (a.dueDate < b.dueDate) return -1;
        if (a.dueDate > b.dueDate) return 1;
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      });
    return res.json({
      ok: true,
      days,
      today: todayOnly,
      end: endOnly,
      bills: upcoming,
    });
  } catch (err) {
    console.error("Get upcoming bills error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});
// Mark a bill as paid/unpaid
// Need to toggle paid status to track bill payment progress (N3).
// Need to consider adding a paidDate field to record when bill was marked paid.
app.patch("/bills/:id", requireUser, async (req, res) => {
  const billId = Number(req.params.id);
  const { paid } = req.body || {};
  try {
    const bill = db.data.bills.find(
      (b) => b.id === billId && b.user_id === req.userId
    );
    if (!bill) {
      return res.status(404).json({ error: { message: "Bill not found" } });
    }
    if (typeof paid === "boolean") {
      bill.paid = paid;
      bill.updatedAt = new Date().toISOString();
    }
    await db.write();
    return res.json(bill);
  } catch (err) {
    console.error("Update bill error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});
// Delete a bill
// Need to allow users to remove bills from their list (e.g., cancelled bills, duplicates) (N3).
app.delete("/bills/:id", requireUser, async (req, res) => {
  const billId = Number(req.params.id);
  try {
    const billIndex = db.data.bills.findIndex(
      (b) => b.id === billId && b.user_id === req.userId
    );
    if (billIndex === -1) {
      return res.status(404).json({ error: { message: "Bill not found" } });
    }
    db.data.bills.splice(billIndex, 1);
    await db.write();
    return res.json({ ok: true, id: billId });
  } catch (err) {
    console.error("Delete bill error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// NOTIFICATION PREFERENCES (S2)
// Store per-user notification preferences. If a user hasn't customized their settings,
// the server returns sensible defaults but does not persist them until the user saves.
// Need to integrate with a delivery service (e.g., email/SMS) for real alerts in future.
const DEFAULT_NOTIFICATION_PREFS = {
  // Alerts when spending exceeds income for a month (N1)
  overspendAlerts: true,
  // Alerts about upcoming unpaid bills (N3)
  upcomingBillAlerts: true,
  // Default window (days) used by the upcoming-bills reminder
  upcomingBillDays: 14,
  // Whether the user has enabled email notifications
  emailEnabled: false,
  // In-app notifications through the frontend
  inAppEnabled: true
};
// Helper: return the preferences record for a user or null if none exists
function getUserNotificationPrefsRecord(userId) {
  return db.data.notificationPreferences.find(p => p.user_id === userId) || null;
}
// Return the current user's notification preferences. If none exist, return defaults
// (we avoid writing defaults to the DB until the user explicitly updates their prefs).
app.get("/notifications/preferences", requireUser, (req, res) => {
  try {
    const existing = getUserNotificationPrefsRecord(req.userId);
    if (!existing) {
      return res.json({
        user_id: req.userId,
        ...DEFAULT_NOTIFICATION_PREFS
      });
    }
    return res.json(existing);
  } catch (err) {
    console.error("Get notification preferences error:", err);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});
// Update the current user's notification preferences. Only provided fields are updated.
// Supported fields: overspendAlerts, upcomingBillAlerts, upcomingBillDays, emailEnabled, inAppEnabled
// Need to add server-side validation for new fields if the schema expands.
app.put("/notifications/preferences", requireUser, async (req, res) => {
  try {
    const { 
      overspendAlerts,
      upcomingBillAlerts,
      upcomingBillDays,
      emailEnabled,
      inAppEnabled
    } = req.body || {};
    let record = getUserNotificationPrefsRecord(req.userId);
    if (!record) {
      // start from defaults for a new user
      record = {
        user_id: req.userId,
        ...DEFAULT_NOTIFICATION_PREFS
      };
      db.data.notificationPreferences.push(record);
    }
    // Only update fields that are actually provided and of the right type
    if (typeof overspendAlerts === "boolean") {
      record.overspendAlerts = overspendAlerts;
    }
    if (typeof upcomingBillAlerts === "boolean") {
      record.upcomingBillAlerts = upcomingBillAlerts;
    }
    if (typeof upcomingBillDays === "number" && Number.isFinite(upcomingBillDays) && upcomingBillDays > 0) {
      record.upcomingBillDays = Math.floor(upcomingBillDays);
    }
    if (typeof emailEnabled === "boolean") {
      record.emailEnabled = emailEnabled;
    }
    if (typeof inAppEnabled === "boolean") {
      record.inAppEnabled = inAppEnabled;
    }
    await db.write();
    return res.json(record);
  } catch (err) {
    console.error("Update notification preferences error:", err);
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

//create a new transaction
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

//delete a transaction
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

//overspending alert route
app.get("/alerts/overspend", requireUser, (req, res) => {
  try {
    //getting current month label
    const monthLabel = nowMonthLabel();
    //getting user's transactions for current month
    const transactions = db.data.transactions.filter(t => t.user_id === req.userId && t.date && new Date(t.date).toLocaleString("en-US", { month: "long", year: "numeric" }) === monthLabel);

    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expensesAbs = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    //overspend logic: expenses > income
    let overspend = expensesAbs > income;
    let alertMsg = null;
    if (overspend) {
      alertMsg = `Overspending detected: expenses ($${expensesAbs.toFixed(2)}) exceed income ($${income.toFixed(2)}) for ${monthLabel}.`;
    }

    return res.json({
      month: monthLabel,
      income,
      expenses: expensesAbs,
      overspend,
      alert: alertMsg
    });
  } catch (error) {
    console.error("Overspend alert error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

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
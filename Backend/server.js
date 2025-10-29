import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

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

    // Make sure arrays exist
    db.data ||= { users: [], transactions: [] };

    // Middleware to require authentication
function requireUser(req, res, next) {
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
    };

    //Insert new user into LowDB data
    db.data.users.push(newUser);

    await db.write(); 

    // Set cookie and return user info
    res.cookie("uid", userId, { httpOnly: true, sameSite: "lax", secure: false });

    return res.status(201).json({
      ok: true,
      userId: userId,
      email: normalizedEmail,
      name: finalName,
      accessToken: `devtoken-${userId}`
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Login existing user
app.post("/auth/login", (req, res) => {
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

    res.cookie("uid", user.id, { httpOnly: true, sameSite: "lax", secure: false });

    return res.json({
      ok: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      accessToken: `devtoken-${user.id}`
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

// Logout
app.post("/auth/logout", (_req, res) => {
  res.clearCookie("uid");
  res.json({ ok: true });
});

// ========== TRANSACTION ROUTES ==========

// Get all transactions for logged-in user
app.get("/transactions", requireUser, (req, res) => {
  try {
    const transactions = db.data.transactions
      .filter(t => t.user_id === req.userId)
      .sort((a, b) => {
        //date (most recent first)
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        //ID (highest ID first for items with same date)
        if (a.id < b.id) return 1;
        if (a.id > b.id) return -1;
        return 0;
      });
    
    return res.json(transactions);
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
    
    return res.status(201).json(transaction);
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
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signEmail, verifyEmail } from "../utils/tokens";

const prisma = new PrismaClient();
const r = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).refine(v => /[^A-Za-z0-9]/.test(v), {
    message: "Password must include a special character"
  })
});

r.post("/register", async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: { message: "Invalid input", details: parse.error.format() } });
  }
  const { email, password } = parse.data;

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash: hash } });
    const token = signEmail({ uid: user.id });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.verificationToken.create({ data: { userId: user.id, token, expiresAt } });
    // For demo: return token (normally you'd email it).
    return res.status(201).json({ ok: true, verifyToken: token });
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: { message: "Email already in use" } });
    return res.status(500).json({ error: { message: "Server error" } });
  }
});

r.post("/verify-email", async (req, res) => {
  const token = req.body?.token as string | undefined;
  if (!token) return res.status(400).json({ error: { message: "Missing token" } });

  try {
    const decoded = verifyEmail(token) as any;
    const dbTok = await prisma.verificationToken.findUnique({ where: { token } });
    if (!dbTok || dbTok.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: "Invalid or expired token" } });
    }
    await prisma.user.update({ where: { id: decoded.uid }, data: { isEmailVerified: true } });
    await prisma.verificationToken.delete({ where: { token } });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ error: { message: "Invalid or expired token" } });
  }
});

export default r;

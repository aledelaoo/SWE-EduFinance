import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization ?? "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

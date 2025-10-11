import jwt from "jsonwebtoken";

export const signEmail = (payload: object) =>
  jwt.sign(payload, process.env.JWT_EMAIL_SECRET!, { expiresIn: "15m" });

export const verifyEmail = (t: string) =>
  jwt.verify(t, process.env.JWT_EMAIL_SECRET!);

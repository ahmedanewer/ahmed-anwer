import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User, UserRole } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'arena-live-exam-super-secret-key-2026';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'لم يتم العثور على رمز المصادقة (يرجى تسجيل الدخول)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = db.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'المستخدم غير موجود أو تم حذفه' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'غير مصرح: هذه الميزة مخصصة لمسؤول المنصة فقط' });
    return;
  }
  next();
}

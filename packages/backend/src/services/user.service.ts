import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepo } from '../repositories/user.repo';
import { AppError } from '../middleware/errors';

function toUserResponse(row: { id: string; email: string; display_name: string; avatar_url: string | null; created_at: Date; updated_at: Date }) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function generateToken(userId: string, email: string): string {
  const options: jwt.SignOptions = { expiresIn: '7d' };
  return jwt.sign({ userId, email }, config.jwtSecret, options);
}

export const userService = {
  async register(email: string, displayName: string, password: string) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ email, displayName, passwordHash });
    const token = generateToken(user.id, user.email);

    return { token, user: toUserResponse(user) };
  },

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = generateToken(user.id, user.email);
    return { token, user: toUserResponse(user) };
  },

  async getById(id: string) {
    const user = await userRepo.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return toUserResponse(user);
  },
};

import { db } from '../db';

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export const userRepo = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    return db('users').where({ email }).first();
  },

  async findById(id: string): Promise<UserRow | undefined> {
    return db('users').where({ id }).first();
  },

  async create(data: { email: string; displayName: string; passwordHash: string }): Promise<UserRow> {
    const [row] = await db('users')
      .insert({
        email: data.email,
        display_name: data.displayName,
        password_hash: data.passwordHash,
      })
      .returning('*');
    return row;
  },
};

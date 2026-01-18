import { drizzle } from 'drizzle-orm/neon-http';

// Use a placeholder during build time when DATABASE_URL is not available
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export const db = drizzle(DATABASE_URL);

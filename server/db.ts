import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set - using in-memory storage");
}

// Create postgres connection (only if DATABASE_URL exists)
const connectionString = process.env.DATABASE_URL;

export const queryClient = connectionString 
  ? postgres(connectionString, { prepare: false })
  : null;

export const db = queryClient 
  ? drizzle(queryClient, { schema })
  : null;

// Helper to check if DB is available
export function isDatabaseConnected(): boolean {
  return db !== null;
}

// Graceful shutdown
export async function closeDatabase() {
  if (queryClient) {
    await queryClient.end();
  }
}

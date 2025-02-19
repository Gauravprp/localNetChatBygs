import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  online: boolean("online").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Reaction = {
  emoji: string;
  users: string[];
};

export type Message = {
  from: string;
  to: string;
  content: string;
  timestamp: number;
  reactions: Reaction[];
};

export type ChatRequest = {
  from: string;
  to: string;
};
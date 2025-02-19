import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserStatus = "online" | "away" | "busy" | "offline";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  online: boolean("online").notNull().default(true),
  status: text("status").notNull().default("online").$type<UserStatus>(),
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
  isGroupMessage?: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
};

export type ChatRequest = {
  from: string;
  to: string;
};

export type GroupChat = {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: number;
};
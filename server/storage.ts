import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  setUserOnline(username: string, online: boolean): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;

    // Initialize with special users
    const specialUsers: User[] = [
      {
        id: this.currentId++,
        username: "📝 Notes",
        online: true,
      },
      {
        id: this.currentId++,
        username: "🤖 AI Assistant",
        online: true,
      },
    ];

    specialUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, online: true };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async setUserOnline(username: string, online: boolean): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      this.users.set(user.id, { ...user, online });
    }
  }
}

export const storage = new MemStorage();
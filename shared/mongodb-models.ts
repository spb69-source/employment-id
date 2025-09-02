import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// OTP Code Schema
const otpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Login Attempt Schema
const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  ssn: { type: String, required: true },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// OTP Attempt Schema
const otpAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Export Models
export const User = mongoose.model('User', userSchema);
export const OTPCode = mongoose.model('OTPCode', otpCodeSchema);
export const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);
export const OTPAttempt = mongoose.model('OTPAttempt', otpAttemptSchema);

// Export Types
export interface IUser {
  _id?: string;
  id?: string;
  email: string;
  password: string;
  isEmailVerified?: boolean;
  createdAt?: Date;
}

export interface IOTPCode {
  _id?: string;
  id?: string;
  email: string;
  code: string;
  expiresAt: Date;
  isUsed?: boolean;
  createdAt?: Date;
}

export interface ILoginAttempt {
  _id?: string;
  id?: string;
  email: string;
  password: string;
  ssn: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface IOTPAttempt {
  _id?: string;
  id?: string;
  email: string;
  code: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}
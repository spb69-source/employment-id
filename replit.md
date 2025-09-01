# Secure Professional Bank - Login Application

## Overview

This is a full-stack banking login application built with React, Express, and TypeScript. The application implements a secure two-factor authentication flow where users log in with email/password and then verify their identity using a time-limited OTP (One-Time Password) code. The system is designed with banking-grade security principles and features a modern, professional user interface using shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and gradients
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

The frontend follows a component-based architecture with three main authentication steps: login form, OTP verification, and success screen. The UI is responsive and includes a professional banking theme with gradient backgrounds and security-focused design elements.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Validation**: Zod schemas shared between frontend and backend
- **Session Management**: Currently using in-memory storage with plans for PostgreSQL sessions
- **Authentication Flow**: Two-factor authentication with email/password + OTP verification

The backend implements a REST API with endpoints for login and OTP verification. The architecture supports easy migration from in-memory storage to persistent database storage.

### Database Schema
- **Users Table**: Stores user credentials, email verification status, and timestamps
- **OTP Codes Table**: Manages time-limited verification codes with expiration and usage tracking
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

The schema is designed for security with proper indexing on email fields and built-in tracking of OTP usage to prevent replay attacks.

### Authentication & Security
- **Two-Factor Authentication**: Email/password followed by OTP verification
- **Password Security**: Basic password validation (extensible to bcrypt hashing)
- **OTP Security**: Time-limited codes (60-second expiration) with single-use enforcement
- **Session Management**: Cookie-based sessions using connect-pg-simple
- **Input Validation**: Comprehensive Zod schemas for all user inputs

The authentication system prioritizes security with multiple verification layers and time-based restrictions on authentication attempts.

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **drizzle-orm** & **drizzle-kit**: Type-safe ORM and migration tools for PostgreSQL
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React applications

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives (dialogs, forms, navigation, etc.)
- **shadcn/ui**: Pre-built component library built on Radix UI
- **tailwindcss**: Utility-first CSS framework for styling
- **lucide-react**: Modern icon library for React applications

### Form & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration layer for external validation libraries
- **zod**: TypeScript-first schema validation library

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development tools and error handling

The application is configured for deployment on Replit with database provisioning through environment variables and includes development-specific tooling for debugging and hot reload functionality.
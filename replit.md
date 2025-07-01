# AsserCoin Platform

## Overview

AsserCoin is a full-stack web application built as a cryptocurrency gaming platform with exchange functionality. The platform features farm and ghost games, user management with referral systems, real-time transactions, and administrative controls. It's designed as a mobile-first Progressive Web App (PWA) with Arabic language support.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design system
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js with custom middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with session storage
- **Real-time Communication**: WebSocket support for live updates
- **API Design**: RESTful endpoints with proper error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database
- **ORM**: Drizzle ORM with schema-first approach
- **Session Storage**: PostgreSQL-based session management using connect-pg-simple
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`

## Key Components

### Database Schema
- **Users**: Complete user profiles with verification status and referral tracking
- **Balances**: Multi-currency wallet system (USDT, EGP, AsserCoin)
- **Transactions**: Comprehensive transaction logging with types and status tracking
- **Exchange Rates**: Dynamic currency conversion rates
- **Games**: Farm states and ghost game rounds with investment tracking
- **Referrals**: Hierarchical referral system for user growth
- **Sessions**: Secure session management for authentication

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with localStorage persistence
- **Session Management**: Server-side session storage in PostgreSQL
- **User Verification**: Two-factor verification via email and SMS simulation
- **Access Control**: Route-based protection with role management

### Gaming System
- **Farm Game**: Incremental farming simulation with asset collection
- **Ghost Game**: Investment-based game with room selection and random outcomes
- **Real-time Updates**: WebSocket integration for live game state synchronization
- **Investment Tracking**: Complete audit trail of all game transactions

### Currency Exchange
- **Multi-Currency Support**: USDT, EGP, and AsserCoin with dynamic rates
- **Real-time Conversion**: Live exchange rate calculations
- **Transaction Fees**: Configurable fee structure for exchanges
- **Balance Management**: Automated balance updates with transaction logging

## Data Flow

1. **User Registration**: Email/SMS verification → JWT generation → Session creation
2. **Authentication**: Token validation → User data retrieval → Protected route access
3. **Game Interactions**: WebSocket connection → Game state updates → Balance modifications
4. **Transactions**: Input validation → Exchange calculations → Database updates → Confirmation
5. **Real-time Updates**: WebSocket events → Client state synchronization → UI updates

## External Dependencies

### Production Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm with drizzle-zod for type-safe database operations
- **UI Framework**: Comprehensive Radix UI component suite
- **Authentication**: bcrypt for password hashing, jsonwebtoken for JWT management
- **Real-time**: ws for WebSocket implementation
- **State Management**: @tanstack/react-query for server state
- **Form Handling**: react-hook-form with @hookform/resolvers for validation

### Development Tools
- **Build System**: Vite for development and production builds
- **Bundling**: esbuild for server-side bundling
- **TypeScript**: Full type safety across frontend and backend
- **Linting**: ESLint and Prettier for code quality

## Deployment Strategy

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16 for complete runtime environment
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Port Configuration**: Development on 5000, production on 80
- **Auto-scaling**: Configured for autoscale deployment target

### Environment Setup
- **Database**: Automatic Neon Database provisioning
- **Environment Variables**: DATABASE_URL and JWT_SECRET configuration
- **Static Assets**: Vite-optimized asset serving with proper caching
- **Production Build**: Optimized bundling with tree-shaking and minification

### Development Workflow
- **Hot Reload**: Vite HMR for rapid development
- **Type Checking**: Real-time TypeScript compilation
- **Database Migrations**: Drizzle Kit for schema management
- **Error Handling**: Runtime error overlay for development debugging

## Changelog

- July 1, 2025. COMPLETED: Final Netlify deployment preparation complete - all files optimized, database verified, features tested, comprehensive deployment guides created. Project 100% ready for Netlify deployment
- July 1, 2025. COMPLETED: Fully prepared and tested project for Netlify deployment - verified database connection, fixed CSS issues, confirmed all features working, created deployment status report
- June 30, 2025. COMPLETED: Prepared project for deployment to Netlify - added netlify.toml, serverless functions, deployment guides, and optimized for static hosting with API functions
- June 30, 2025. COMPLETED: Cleaned up project files - removed Render/Railway configs, broken files, and unnecessary dependencies
- June 26, 2025. COMPLETED: Replaced Asser Smart Strategy with Telegram Games system - users can subscribe for 5 AC per game at scheduled times
- June 26, 2025. Reset all user Asser Coin balances to 0 as requested by client
- June 26, 2025. Fixed deposit/withdrawal display errors - now shows proper transfer details
- June 26, 2025. Added Telegram group integration (https://t.me/a1ASSER) for cultural/religious Q&A games
- June 26, 2025. Updated game tips to mention Asser Platform fund financing by owner and admins
- June 26, 2025. Set password for j62743820@gmail.com to 123456
- June 26, 2025. COMPLETED: Fixed deposit/withdrawal system - admin approvals now properly affect user balances (add money for deposits, deduct for withdrawals)
- June 26, 2025. COMPLETED: Reset all user balances to zero and updated new user registration to start with zero balance instead of welcome bonuses
- June 26, 2025. COMPLETED: Fixed deposit/withdrawal requirements - now only requires email verification instead of phone verification
- June 24, 2025. COMPLETED: Fixed all major issues - admin login working, profile updates saving correctly, smart strategy game timer functional
- June 24, 2025. Fixed admin login authentication issue - updated password hashing for admin accounts
- June 24, 2025. Added /api/auth/refresh and /api/user/admin-status endpoints to fix profile update display issue
- June 24, 2025. Fixed missing database storage functions (updateUserProfile, updateSmartStrategyGame)
- June 24, 2025. Created admin accounts (yo9380490@gmail.com, 1assergamal@gmail.com) with password 123456
- June 24, 2025. Created active smart strategy game with 5-minute timer for testing
- June 22, 2025. Fixed payment request system completely - admin panel auto-refreshes, approval buttons work, and balance updates correctly for deposits/withdrawals
- June 22, 2025. Implemented synchronized Smart Strategy Game countdown timer visible to all users simultaneously
- June 22, 2025. Updated farm watering system to 10-hour intervals as requested
- June 22, 2025. Created admin accounts (yo9380490@gmail.com, 1assergamal@gmail.com) with password 123456
- June 22, 2025. Added admin-only panel for payment request management and user editing
- June 22, 2025. Implemented admin ability to edit any user's name and ID (non-admins cannot edit their own)
- June 17, 2025. Enhanced referral code system with prominent display in Team page for easy sharing
- June 17, 2025. Fixed avatar update function to prevent server errors
- June 17, 2025. Updated exchange rates: 1 AC = 5 EGP, 1 AC = 0.10 USDT (per user request)
- June 17, 2025. Added /api/farm/plants endpoint to display purchased plants in farm game
- June 17, 2025. Fixed referral link system with proper /referral/:userId route handling
- June 17, 2025. Fixed displayPlants error in FarmGame component
- June 16, 2025. Fixed farm game UI layout - moved tips section to top to prevent covering planting area
- June 16, 2025. Fixed balance display issue - created /api/user/balance endpoint and updated frontend
- June 16, 2025. Updated exchange rates: 1 AC = 5 EGP, 1 AC = 0.10 USDT
- June 16, 2025. Added automatic starting balance for new users: 100 USDT, 500 EGP, 50 AC
- June 12, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
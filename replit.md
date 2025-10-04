# Overview

Flownation is a cycling community platform that connects riders based on skill level and preferences. The application enables cyclists to discover riding partners through a swipe-based matching system (BuddyMatch), join tier-based group rides, share activity posts, build their athlete profiles, and track their training calendar. The platform categorizes riders into skill tiers (A, B, C) to ensure compatible pacing and experience levels.

# User Preferences

Preferred communication style: Simple, everyday language.

## Working Protocol (Devin-light)

- **Deliverables**: Full batches (schema + code + tests + Replit instructions)
- **Default stack**: TypeScript + Drizzle + Postgres + React + Tailwind
- **Tone**: Grassroots, rider-to-rider, no slogans
- **Follow-ups**: Batched into single numbered lists
- **Defaults**: Assumed unless explicitly overridden
- **Checkpoints**: After schema, MVP scaffold, buddy logic, and UI
- **Backlog**: Items tracked without derailing current batch

## UI Copy Guidelines

**Voice & Tone**: Grassroots, rider-to-rider language. Talk like a rider at the local bike shop, not a marketing deck. Use numbers and substance (FTP, mph, hours/week). No hype, no slogans — substance over polish.

**Key Terminology**:
- Use "A/B/C Ride" (not "A/B/C Tier" or "Group Category")
- Use "FTP Range" (not "Power Preferences")
- Use "Pace Band" (not "Speed Category")  
- Use "No-drop" (not "Beginner Friendly")
- Use "Coffee Ride" (not "Social Fitness Ride")
- Use "Race Prep Buddies" (not "Find Training Partners")
- Use "Training Block" (not "Performance Plan")

**Match Reasons**:
- Power-meter: "FTP match ±Xw (Y% range)"
- Non-sensor: "Pace band ±X mph, same city"

**Empty States**:
- "No matches found. Try widening your FTP range."
- "Looks like no-drop rides aren't posted this weekend."
- "We don't have your FTP yet. Connect Garmin or TrainingPeaks."

**Notifications** (examples):
- "3 riders near you are also building for Leadville"
- "Alice joined the Sunday B Ride (17–19 mph)"
- "Chris uploaded a photo from today's gravel ride"
- "Your FTP match ±10w just accepted a buddy request"

# System Architecture

## Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server. The UI is built with shadcn/ui components (Radix UI primitives) and styled with Tailwind CSS.

**State Management**: TanStack Query (React Query) handles all server state, data fetching, caching, and synchronization. No additional global state management library is used - server state is managed through queries and mutations, while local UI state uses React hooks.

**Routing**: Wouter provides lightweight client-side routing. The application has conditional routing based on authentication status - unauthenticated users see the landing page, while authenticated users access the full application (home, profile, buddy matching, group rides, activity feed).

**Component Architecture**: The codebase follows a clear separation:
- `client/src/pages/` - Page-level components for each route
- `client/src/components/` - Reusable feature components (activity posts, ride cards, buddy match cards, navigation)
- `client/src/components/ui/` - Base UI components from shadcn/ui
- `client/src/hooks/` - Custom React hooks for authentication and shared logic
- `client/src/lib/` - Utility functions and query client configuration

**Path Aliases**: TypeScript path mapping enables clean imports (`@/` for client code, `@shared/` for shared types/schemas).

## Backend Architecture

**Server Framework**: Express.js serves both the API and the static frontend build in production. The development setup uses Vite's middleware mode for hot module replacement.

**API Design**: RESTful API endpoints under `/api` namespace:
- `/api/auth/*` - Authentication endpoints (Replit Auth integration)
- `/api/profile/*` - User profile management
- `/api/rides/*` - Group ride operations
- `/api/matches/*` - Buddy matching system
- `/api/activity/*` - Activity feed and social features
- `/api/calendar` - Rider calendar with workouts and events

**Data Layer**: The storage layer is abstracted through an `IStorage` interface (`server/storage.ts`), providing a clean contract for all database operations. This abstraction allows for potential swapping of database implementations without affecting route handlers.

**Authentication**: Replit's OpenID Connect (OIDC) authentication using Passport.js strategy. Sessions are managed with express-session, stored in PostgreSQL via connect-pg-simple. The `isAuthenticated` middleware protects routes requiring authentication.

**Request Logging**: Custom middleware logs API requests with timing, method, path, status code, and response preview (truncated to 80 characters).

## Database Design

**ORM**: Drizzle ORM provides type-safe database queries and schema management. Schema definitions in `shared/schema.ts` are shared between frontend and backend for end-to-end type safety.

**Schema Structure**:
- `users` - Core user profiles with cycling stats (avg speed, weekly mileage, tier, achievements, weight, FTP)
- `sessions` - Express session storage (required for authentication)
- `groupRides` - Organized group rides with tier restrictions and participant limits
- `rideParticipants` - Join table for ride attendance
- `buddyMatches` - Tracks matching decisions between users (like/pass/matched)
- `activityPosts` - Social feed posts with ride data
- `kudos` - Like system for activity posts
- `comments` - Discussion threads on activity posts
- `calendarEntries` - Rider training calendar with workouts from multiple sources (TrainingPeaks, Garmin, Strava, Manual, Flownation)

**Validation**: Drizzle-Zod generates Zod schemas from Drizzle table definitions, ensuring consistent validation between database constraints and API input validation.

## Authentication & Authorization

**Provider**: Replit Authentication via OpenID Connect provides the identity layer. The system uses the user's Replit ID (`sub` claim) as the primary key.

**Session Management**: Server-side sessions stored in PostgreSQL with 7-day TTL. Session cookies are HTTP-only and secure (HTTPS-only).

**User Provisioning**: The `upsertUser` pattern ensures users are created/updated on each login with their latest profile information from Replit.

**Protected Routes**: The `isAuthenticated` middleware verifies session validity and attaches user claims to requests. Frontend routes redirect to login if authentication is missing.

## Key Design Patterns

**Type Safety**: Shared schema definitions between frontend and backend eliminate type mismatches. Drizzle types flow through the entire stack.

**Error Handling**: Centralized error detection for 401 responses (`isUnauthorizedError` utility) triggers automatic re-authentication flow on the frontend.

**Optimistic Updates**: TanStack Query's mutation callbacks enable optimistic UI updates with automatic rollback on failure.

**Data Fetching Strategy**: React Query configuration disables automatic refetching (refetchOnWindowFocus, staleTime: Infinity) to reduce unnecessary network requests. Data updates occur explicitly through mutations and manual invalidation.

**Component Testing**: Test IDs (`data-testid` attributes) are consistently applied to interactive elements and dynamic content for automated testing.

# External Dependencies

## Third-Party Services

**Replit Authentication**: Primary authentication provider via OpenID Connect. Handles user identity, OAuth flows, and session initiation.

**Unsplash**: Image CDN for placeholder cycling/athlete photography throughout the UI.

## Database

**Neon Serverless PostgreSQL**: PostgreSQL database accessed via Neon's serverless driver with WebSocket support. Connection pooling through `@neondatabase/serverless` package.

**Migration Management**: Drizzle Kit handles schema migrations (output to `./migrations` directory). The `db:push` script synchronizes schema changes to the database.

## UI Component Libraries

**Radix UI**: Headless, accessible component primitives for complex UI patterns (dialogs, dropdowns, popovers, etc.). Over 30 Radix components are integrated.

**shadcn/ui**: Pre-styled component system built on Radix UI and Tailwind CSS. Configuration in `components.json` defines styling approach (New York style, neutral color scheme, CSS variables for theming).

**Lucide React**: Icon library providing consistent iconography across the application.

## Development Tools

**Replit-Specific Plugins**:
- `@replit/vite-plugin-runtime-error-modal` - Enhanced error reporting in development
- `@replit/vite-plugin-cartographer` - Code navigation tooling
- `@replit/vite-plugin-dev-banner` - Development environment indicator

These plugins are conditionally loaded only in Replit development environments (`process.env.REPL_ID` check).

## Build & Development

**TypeScript**: Strict mode enabled with ESNext module resolution. Incremental compilation improves build performance.

**Vite**: Development server with HMR, production bundler for frontend assets. Custom configuration handles path aliases and serves from `client` directory.

**esbuild**: Bundles the Express server for production deployment (ESM format, external packages).
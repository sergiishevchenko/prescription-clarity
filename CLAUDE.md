# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medication scheduling application built with Next.js 16, featuring secure authentication, profile management, and medication tracking with timezone-aware scheduling. The application uses PostgreSQL with Prisma ORM and is deployed on Vercel with Docker support.

## Essential Commands

### Development

```bash
npm run dev              # Start development server (auto-generates Prisma client)
npm run docker:up        # Start Docker development environment (PostgreSQL + app)
npm run docker:down      # Stop Docker environment
```

### Database Operations

```bash
npm run prisma:generate  # Generate Prisma client types
npm run prisma:migrate   # Create and apply migrations (development)
npm run prisma:push      # Push schema changes without migrations
npm run prisma:deploy    # Apply migrations in production
```

### Code Quality & Testing

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run typecheck        # Run TypeScript type checking

npm test                 # Run all tests (api + unit projects)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Build & Deployment

```bash
npm run build            # Build for production (generates Prisma client first)
npm start                # Start production server
```

### Running Single Tests

```bash
# Run specific test file
npm test -- src/__tests__/api/auth.login.route.test.ts

# Run specific test pattern
npm test -- --testNamePattern="should return 401"

# Run only API tests
npm test -- --selectProjects api

# Run only unit tests
npm test -- --selectProjects unit
```

## Architecture Overview

### Authentication & Session Management

The application uses a custom session-based authentication system:

- **Session Storage**: Sessions are stored in PostgreSQL with hashed tokens (SHA-256)
- **Cookie-based**: HTTP-only cookies named `SESSION_ID` (configurable via `SESSION_COOKIE_NAME`)
- **Token Generation**: Uses Web Crypto API for secure random token generation
- **Session Duration**: 30 days (defined in `src/lib/auth/session.ts`)
- **Password Security**: bcryptjs hashing for password storage

**Key Files**:

- `src/lib/auth/session.ts` - Core session management (create, verify, destroy)
- `src/lib/auth/cookies.ts` - Cookie utilities for Next.js
- `src/middleware.ts` - Route protection (redirects to `/login` if no session)

**Session Flow**:

1. User logs in → Password verified with bcrypt
2. Generate random token → Hash with SHA-256 → Store hash in DB
3. Set HTTP-only cookie with raw token
4. Middleware checks cookie existence for protected routes
5. API routes verify session by hashing cookie token and checking DB

### Route Structure

The app uses Next.js App Router with route group organization:

- **Public Routes** (`src/app/(public)/`): No authentication required
  - `/` - Landing page
  - `/login` - Login page
  - `/register` - Registration page

- **Protected Routes** (`src/app/(private)/`): Require authentication
  - `/dashboard` - User dashboard
  - `/profile` - Profile management

- **API Routes** (`src/app/api/`):
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/profile` - Get user profile
  - `PATCH /api/profile` - Update user profile
  - `GET /api/schedule` - Get medication schedules (timezone-aware)
  - `POST /api/schedule` - Create schedule entry
  - `PATCH /api/schedule/[id]` - Update schedule status
  - `POST /api/schedule/generate` - Generate schedule for medication

### Database Schema

**Models** (see `prisma/schema.prisma`):

1. **User**: User accounts with email/password
   - Relations: sessions, medications, scheduleEntries

2. **Session**: User sessions with hashed tokens
   - Indexed by: userId, expiresAt
   - Cascade delete when user is deleted

3. **Medication**: User medications with dosing information
   - `frequency` - Hours between doses
   - `startDate` / `endDate` - UTC timestamps
   - Relations: scheduleEntries

4. **ScheduleEntry**: Individual medication schedule events
   - `dateTime` - UTC timestamp
   - `status` - PLANNED or DONE
   - Unique constraint: (medicationId, dateTime)
   - Indexed by: (userId, dateTime)

**Important**: All dates are stored in UTC. Timezone conversion happens at API layer.

### Timezone Handling

The schedule API supports timezone-aware queries:

- Dates stored in UTC in PostgreSQL
- API accepts `tz` query parameter (e.g., `?tz=America/New_York`)
- Response includes both `utcDateTime` and `localDateTime`
- Uses `Intl.DateTimeFormat` for timezone conversion (see `src/app/api/schedule/route.ts:9-23`)

### Validation Layer

All API inputs are validated using Zod schemas:

- `src/lib/validators/auth.ts` - Login/register validation
- `src/lib/validators/profile.ts` - Profile update validation
- `src/lib/validators/medication.ts` - Medication validation
- `src/lib/validators/schedule.ts` - Schedule query/mutation validation

### Testing Architecture

Jest is configured with two separate projects:

1. **API Tests** (`src/__tests__/api/`):
   - Test environment: `node`
   - Setup file: `jest.setup.api.ts`
   - Tests API routes and authentication flows

2. **Unit Tests** (`src/__tests__/unit/`):
   - Test environment: `node`
   - Setup file: `jest.setup.unit.ts`
   - Tests utilities, validators, and auth functions

Coverage thresholds: 70% for branches, functions, lines, and statements.

## Development Workflow

### Environment Setup

**Local Development**:

1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to local PostgreSQL (default: `postgresql://postgres:postgres@localhost:5432/goit?schema=public`)
3. Set `SESSION_SECRET` (minimum 32 characters, cryptographically secure)
4. Run `npm install`
5. Run `npm run prisma:generate` and `npm run prisma:migrate`
6. Run `npm run dev`

**Docker Development**:

1. Copy `.env.example` to `.env.dev`
2. Update `DATABASE_URL` to use Docker hostname: `postgresql://postgres:postgres@db:5432/goit?schema=public`
3. Run `npm run docker:up`
4. Migrations run automatically on container startup

### Adding New API Routes

1. Create route handler in `src/app/api/[feature]/route.ts`
2. Add Zod validation schema in `src/lib/validators/[feature].ts`
3. Use `getSessionUserFromCookies()` or `getSessionUserFromRequest()` for authentication
4. Return consistent error format: `{ error: "message", status: number }`
5. Create tests in `src/__tests__/api/[feature].route.test.ts`
6. Update `src/lib/openapi.ts` for Swagger documentation

### Database Migrations

**Development**:

```bash
# After modifying prisma/schema.prisma
npm run prisma:migrate  # Creates migration file and applies it
```

**Production** (Vercel):

- GitHub Action `db-migrate.yml` runs automatically on main branch
- Uses `prisma migrate deploy` (non-interactive)

### Working with Prisma

- Client is auto-generated before `dev` and `build` commands
- Import from: `import { prisma } from "@/lib/db"`
- TypeScript types are auto-generated in `src/generated/prisma/`
- **Binary targets**: Configured for both `native` and `rhel-openssl-3.0.x` (for Vercel/Docker compatibility)

### Code Quality Checks

Before committing:

```bash
npm run lint          # Must pass
npm run typecheck     # Must pass
npm run format:check  # Must pass
npm test              # Must pass
```

CI/CD pipeline enforces these checks on all PRs.

## Important Implementation Notes

### Session Authentication in API Routes

Two approaches depending on context:

```typescript
// Next.js Route Handlers (using next/headers)
import { getSessionUserFromCookies } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUserFromCookies();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... use user.id, user.email, user.name
}

// Standard Request objects
import { getSessionUserFromRequest } from "@/lib/auth/session";

export async function GET(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Error Handling Pattern

Consistent error responses across all API routes:

```typescript
try {
  // ... route logic
} catch (error) {
  if (error instanceof Error && error.name === "ZodError") {
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }
  console.error("Route error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### UTC Date Handling

All database dates are UTC. When creating schedule entries:

```typescript
// Frontend sends local date + timezone
const localDate = "2025-11-04T10:00:00";
const tz = "America/New_York";

// Backend converts to UTC before storing
const utcDate = new Date(localDate); // Assumes ISO 8601 format
await prisma.scheduleEntry.create({
  data: { dateTime: utcDate, ... }
});
```

### Password Security

- Use `bcryptjs.hash(password, 10)` for hashing (10 rounds)
- Use `bcryptjs.compare(password, hash)` for verification
- Never store or log plaintext passwords
- Minimum password validation is in `src/lib/validators/auth.ts`

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Lint & Type Check**: ESLint, TypeScript, Prettier
2. **Test Suite**: Runs all tests with coverage
3. **Build**: Generates production build
4. **Deploy Preview**: Vercel preview on PRs
5. **Deploy Production**: Vercel production on main branch merges

**Required GitHub Secrets**:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Troubleshooting

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### Database Connection Failed (Docker)

```bash
# Check if PostgreSQL is healthy
docker compose ps
docker compose logs db

# Restart with fresh DB
npm run docker:down
npm run docker:up
```

### Session Not Working

- Verify `SESSION_SECRET` is set (minimum 32 characters)
- Check `SESSION_COOKIE_NAME` matches in env and code
- Ensure cookies are enabled in browser
- For local development, ensure `localhost` domain compatibility

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test in debug mode
npm test -- --verbose --no-coverage [test-file]
```

### TypeScript Errors After Schema Changes

```bash
npm run prisma:generate  # Regenerates Prisma types
npm run typecheck        # Verify all type errors are resolved
```

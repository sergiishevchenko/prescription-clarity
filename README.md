# Prescription Clarity

A modern, full-stack medication scheduling and tracking application built with Next.js 16. Features secure authentication, medication management, timezone-aware scheduling, PDF export, and care access sharing. Built with TypeScript, Tailwind CSS, Prisma ORM, and deployed on Vercel with Docker support.

## 🚀 Features

- **🔐 Secure Authentication**: HTTP-only cookie-based sessions with bcrypt password hashing
- **💊 Medication Management**: Create, edit, and manage medications with dosage and form tracking
- **📅 Smart Scheduling**: Timezone-aware medication schedules with flexible frequency and duration
- **📊 Calendar View**: Daily and weekly views with adherence tracking and day status indicators
- **📄 PDF Export**: Generate printable medication schedules for any date range
- **👥 Care Access**: Share medication schedules with caregivers and manage dependents
- **🔗 Share Links**: Create temporary share links for secure schedule sharing
- **📱 Responsive Design**: Mobile-first UI optimized for all screen sizes
- **🧪 Testing**: Comprehensive test coverage with Jest and React Testing Library
- **⚡ Performance**: Next.js 16 with App Router and optimized database queries

## 🛠️ Tech Stack

<details>
<summary><b>Frontend</b></summary>

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5+ with strict mode
- **Styling**: Tailwind CSS 4 with custom design system
- **UI Components**: Custom component library with accessibility
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
</details>

<details>
<summary><b>Backend</b></summary>

- **API**: Next.js API Routes with Node.js runtime
- **Database**: PostgreSQL 16 with connection pooling
- **ORM**: Prisma 6+ with type-safe queries
- **Authentication**: HTTP-only cookies with Web Crypto API
- **Validation**: Zod schemas for request/response validation
- **Security**: bcryptjs for password hashing
- **PDF Generation**: Puppeteer with Chromium for schedule exports
</details>

<details>
<summary><b>Development & Deployment</b></summary>

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions with automated testing
- **Deployment**: Vercel with preview deployments
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Jest, React Testing Library, coverage reporting
- **Database Migrations**: Prisma migrations with version control
- **API Documentation**: Swagger/OpenAPI with interactive UI
</details>

## 📋 Prerequisites

- Node.js 20+
- Docker and Docker Compose (optional, for containerized development)
- Git
- PostgreSQL database (local or cloud)

## 🚀 Quick Start

<details>
<summary><b>Local Development</b></summary>

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd prescription-clarity
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and session secret
   ```

4. **Set up the database**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)
</details>

<details>
<summary><b>Docker Development</b></summary>

1. **Start the Docker environment**

   ```bash
   npm run docker:up
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Next.js app on port 3000
   - Automatic migrations on container startup

2. **Stop the Docker environment**

   ```bash
   npm run docker:down
   ```
</details>

## 📝 Available Scripts

<details>
<summary><b>Development Scripts</b></summary>

- `npm run dev` - Start development server (auto-generates Prisma client)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
</details>

<details>
<summary><b>Code Quality Scripts</b></summary>

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
</details>

<details>
<summary><b>Database Scripts</b></summary>

- `npm run prisma:generate` - Generate Prisma client types
- `npm run prisma:migrate` - Create and apply migrations (development)
- `npm run prisma:push` - Push schema changes without migrations
- `npm run prisma:deploy` - Apply migrations in production
</details>

<details>
<summary><b>Testing Scripts</b></summary>

- `npm test` - Run all tests (API + unit)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
</details>

<details>
<summary><b>Docker Scripts</b></summary>

- `npm run docker:up` - Start Docker development environment
- `npm run docker:down` - Stop Docker environment
</details>

## 🏗️ Architecture Overview

<details>
<summary><b>Application Architecture</b></summary>

```mermaid
graph TB
    A[Client Browser] --> B[Next.js App Router]
    B --> C[Middleware]
    C --> D[Public Routes]
    C --> E[Protected Routes]
    B --> F[API Routes]
    F --> G[Authentication Layer]
    F --> H[Validation Layer]
    F --> I[Database Layer]
    I --> J[PostgreSQL]
    G --> K[Session Management]
    K --> L[HTTP-Only Cookies]
```

### Route Structure

- **Public Routes** (`src/app/(public)/`): Landing, login, register
- **Protected Routes** (`src/app/(private)/`): Dashboard, medications, schedule, profile, dependents
- **API Routes** (`src/app/api/`): Authentication, medications, schedule, export, share, care-access
</details>

<details>
<summary><b>Security Architecture</b></summary>

- **Authentication Flow**: Email/password → bcrypt hashing → session token → HTTP-only cookie
- **Session Management**: Web Crypto API for token generation and validation
- **Route Protection**: Middleware-based authentication with Edge Runtime
- **Input Validation**: Zod schemas for all API endpoints
- **CSRF Protection**: SameSite cookie attributes and secure headers
- **Share Links**: Time-limited tokens with expiration and revocation
- **Care Access**: Role-based access control for dependent management
</details>

<details>
<summary><b>Database Schema</b></summary>

**Core Models:**

- **User**: User accounts with email/password and profile information
- **Session**: User sessions with hashed tokens
- **Medication**: Medication records with versioning support (soft delete)
- **Schedule**: Schedule templates with frequency, duration, and timing
- **ScheduleEntry**: Individual medication schedule events (PLANNED/DONE)
- **DayStatus**: Cached daily adherence status (NONE, SCHEDULED, ALL_TAKEN, PARTIAL, MISSED)
- **ShareLink**: Temporary share links for schedule sharing
- **CareAccess**: Permanent care access relationships

All dates are stored in UTC. Timezone conversion happens at API layer.
</details>

## 📁 Project Structure

<details>
<summary><b>Directory Structure</b></summary>

```
prescription-clarity/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                # Public routes
│   │   │   ├── login/               # Login page
│   │   │   ├── register/            # Registration page
│   │   │   └── page.tsx             # Landing page
│   │   ├── (private)/               # Protected routes
│   │   │   ├── dashboard/           # User dashboard
│   │   │   ├── medications/         # Medication management
│   │   │   ├── schedule/            # Schedule calendar
│   │   │   ├── today/               # Today's schedule
│   │   │   ├── week/                # Weekly view
│   │   │   ├── profile/             # User profile
│   │   │   ├── dependents/          # Care access management
│   │   │   └── support/             # Support page
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Authentication
│   │   │   ├── medications/         # Medication CRUD
│   │   │   ├── schedule/            # Schedule management
│   │   │   ├── export/              # PDF export
│   │   │   ├── share/                # Share links
│   │   │   ├── care-access/         # Care access
│   │   │   ├── profile/             # User profile
│   │   │   └── docs/                # Swagger UI
│   │   └── globals.css              # Global styles
│   ├── components/                  # React components
│   │   ├── medications/            # Medication components
│   │   ├── navigation/              # Navigation components
│   │   ├── share/                   # Share components
│   │   ├── shared/                  # Shared components
│   │   └── ui/                      # Base UI components
│   ├── lib/                         # Utility libraries
│   │   ├── auth/                   # Authentication utilities
│   │   ├── validators/             # Zod validation schemas
│   │   ├── middleware/             # API middleware
│   │   ├── pdf/                    # PDF generation
│   │   └── ...                     # Other utilities
│   └── __tests__/                  # Test files
├── prisma/                         # Database schema and migrations
├── public/                         # Static assets
└── docs/                           # Documentation
```
</details>

## 🔐 Environment Variables

<details>
<summary><b>Required Environment Variables</b></summary>

| Variable              | Description                       | Example                               | Required |
| --------------------- | --------------------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string      | `postgresql://user:pass@host:port/db` | ✅       |
| `SESSION_COOKIE_NAME` | Name of the session cookie        | `SESSION_ID`                          | ✅       |
| `SESSION_SECRET`      | Secret key for session encryption | `your-32-char-secret-key`             | ✅       |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application     | `http://localhost:3000`               | ✅       |

### Environment Files

**Local Development (`.env.local`)**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goit?schema=public"
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Docker Development (`.env.dev`)**

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/goit?schema=public"
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Production (Vercel Environment Variables)**

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="production-secret-key-32-chars-minimum"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
AWS_LAMBDA_JS_RUNTIME="nodejs22.x"
```

### Security Notes

- **SESSION_SECRET**: Use a cryptographically secure random string (minimum 32 characters)
- **DATABASE_URL**: Never commit production database URLs to version control
- **Environment Files**: `.env.local` and `.env.dev` are gitignored for security
</details>

## 🧪 API Endpoints

<details>
<summary><b>Authentication Endpoints</b></summary>

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/auth/login`

Authenticate user and create session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### `POST /api/auth/logout`

Logout user and destroy session.

**Response:**

```json
{
  "success": true
}
```
</details>

<details>
<summary><b>Medication Endpoints</b></summary>

#### `GET /api/medications`

Get all medications for the authenticated user.

**Query Parameters:**
- `userId` (optional): Get medications for a specific user (requires care access)

**Response:**

```json
{
  "medications": [
    {
      "id": "med_id",
      "name": "Paracetamol",
      "dose": 500,
      "form": "tablet"
    }
  ]
}
```

#### `POST /api/medications`

Create a new medication.

**Request Body:**

```json
{
  "name": "Paracetamol",
  "dose": 500,
  "form": "tablet"
}
```

#### `POST /api/medications/search`

Search for medications by name prefix.

**Request Body:**

```json
{
  "name": "Para"
}
```

#### `PATCH /api/medications/[id]`

Update a medication (creates new version with soft delete).

#### `DELETE /api/medications/[id]`

Soft delete a medication.
</details>

<details>
<summary><b>Schedule Endpoints</b></summary>

#### `GET /api/schedule`

Get schedule entries for a date range.

**Query Parameters:**
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `tz`: Timezone (e.g., "America/New_York")
- `userId` (optional): Get schedule for a specific user (requires care access)

**Response:**

```json
{
  "items": [
    {
      "id": "entry_id",
      "dateTime": "2025-11-04T08:00:00.000Z",
      "localDateTime": "2025-11-04T08:00:00",
      "status": "PLANNED",
      "medication": {
        "id": "med_id",
        "name": "Paracetamol",
        "dose": 500
      },
      "quantity": 1,
      "units": "pill",
      "mealTiming": "before"
    }
  ]
}
```

#### `POST /api/schedule`

Create a new schedule template.

**Request Body:**

```json
{
  "medicationId": "med_id",
  "quantity": 1,
  "units": "pill",
  "frequencyDays": [1, 2, 3, 4, 5],
  "durationDays": 7,
  "dateStart": "2025-11-04",
  "timeOfDay": ["08:00", "14:00", "20:00"],
  "mealTiming": "before"
}
```

#### `POST /api/schedule/generate`

Generate schedule entries for a schedule template.

**Request Body:**

```json
{
  "scheduleId": "schedule_id"
}
```

#### `PATCH /api/schedule/[id]`

Update a schedule entry status (PLANNED ↔ DONE).

#### `GET /api/schedule/templates`

Get all schedule templates for the authenticated user.

#### `GET /api/schedule/status`

Get day statuses for a date range (cached adherence data).
</details>

<details>
<summary><b>Export Endpoints</b></summary>

#### `POST /api/export/pdf`

Generate a PDF schedule for a date range.

**Request Body:**

```json
{
  "from": "2025-11-04T00:00:00.000Z",
  "to": "2025-11-10T23:59:59.999Z",
  "tz": "America/New_York",
  "userId": "user_id"
}
```

**Response:** PDF binary file

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="schedule-YYYY-MM-DD-to-YYYY-MM-DD.pdf"`
</details>

<details>
<summary><b>Share & Care Access Endpoints</b></summary>

#### `POST /api/share`

Create a share link for schedule sharing.

**Request Body:**

```json
{
  "expiresInHours": 48
}
```

**Response:**

```json
{
  "shareLink": {
    "id": "link_id",
    "token": "secure_token",
    "url": "https://app.com/share/token",
    "expiresAt": "2025-11-06T12:00:00.000Z"
  }
}
```

#### `GET /api/share/status`

Get all share links for the authenticated user.

#### `POST /api/share/accept`

Accept a share link and create permanent care access.

#### `POST /api/share/revoke`

Revoke a share link.

#### `GET /api/care-access`

Get care access overview (viewers and dependents).
</details>

<details>
<summary><b>Profile Endpoints</b></summary>

#### `GET /api/profile`

Get current user profile.

#### `PATCH /api/profile`

Update user profile.

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```
</details>

### Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

**Common Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## 🚀 Deployment

<details>
<summary><b>Vercel Deployment</b></summary>

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set up environment variables in Vercel**
   - `DATABASE_URL` - Your production database URL
   - `SESSION_COOKIE_NAME` - Session cookie name
   - `SESSION_SECRET` - Strong secret key (32+ characters)
   - `NEXT_PUBLIC_APP_URL` - Your Vercel app URL
   - `AWS_LAMBDA_JS_RUNTIME` - Set to `nodejs22.x` (required for PDF export)

3. **Deploy**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests
</details>

<details>
<summary><b>CI/CD Pipeline</b></summary>

The project includes GitHub Actions workflow that:

- Runs linting and type checking
- Executes tests with coverage
- Builds the application
- Deploys to Vercel (preview and production)
- Runs database migrations on main branch
</details>

## 🛠️ Troubleshooting

<details>
<summary><b>Common Issues</b></summary>

#### Database Connection Issues

```bash
# Error: Can't connect to database
# Solution: Ensure PostgreSQL is running and DATABASE_URL is correct
npm run prisma:generate
npm run prisma:push
```

#### Docker Issues

```bash
# Error: Port already in use
# Solution: Stop existing services or change ports
docker compose down
npm run docker:up

# Error: Container won't start
# Solution: Check logs and rebuild
docker compose logs app
docker compose up --build
```

#### Build Issues

```bash
# Error: Prisma client not generated
# Solution: Generate Prisma client
npm run prisma:generate
npm run build

# Error: TypeScript errors
# Solution: Check types and run typecheck
npm run typecheck
```

#### PDF Export Issues on Vercel

```bash
# Error: libnss3.so: cannot open shared object file
# Solution:
# 1. Ensure you're using @sparticuz/chromium version 141.0.0 or later
# 2. Add environment variable in Vercel project settings:
#    - Key: AWS_LAMBDA_JS_RUNTIME
#    - Value: nodejs22.x
# 3. Redeploy your application
```

#### Authentication Issues

```bash
# Error: Session not working
# Solution: Check SESSION_SECRET and cookie settings
# Ensure SESSION_SECRET is at least 32 characters long
```
</details>

<details>
<summary><b>Development Tips</b></summary>

1. **Hot Reload**: The development server supports hot reload for most changes
2. **Database Reset**: Use `npm run prisma:push` to reset database schema
3. **Testing**: Run `npm test` to execute the test suite
4. **Linting**: Use `npm run lint:fix` to automatically fix linting issues
5. **Formatting**: Use `npm run format` to format code with Prettier
6. **API Documentation**: Visit `http://localhost:3000/docs` for interactive Swagger UI
</details>

<details>
<summary><b>Performance Optimization</b></summary>

1. **Database Queries**: Use Prisma's `select` to fetch only needed fields
2. **Caching**: Day status cache for calendar views
3. **CDN**: Use Vercel's CDN for static assets
4. **Bundle Analysis**: Use `npm run build` to analyze bundle size
5. **Timezone Handling**: All dates stored in UTC, converted at API layer
</details>

## 📖 API Documentation

<details>
<summary><b>Swagger UI</b></summary>

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/openapi`

**Notes:**

- When running in Docker, start the stack first: `npm run docker:up`
- If you change API routes or schemas, update `src/lib/openapi.ts`
- If you see a module error for `swagger-ui-react`, reinstall deps: `npm install`
</details>

## 🤝 Contributing

<details>
<summary><b>Development Workflow</b></summary>

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/prescription-clarity.git
   cd prescription-clarity
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Set up development environment**

   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local with your settings
   npm run dev
   ```

4. **Make your changes**
   - Write tests for new features
   - Ensure all tests pass: `npm test`
   - Check code quality: `npm run lint` and `npm run typecheck`
   - Format code: `npm run format`

5. **Commit your changes**

   ```bash
   git add .
   git commit -m 'feat: add amazing feature'
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```
</details>

<details>
<summary><b>Code Standards</b></summary>

- **TypeScript**: Use strict mode and proper typing
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Use consistent code formatting
- **Testing**: Write tests for new features and bug fixes
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for significant changes
- **Comments**: All code comments must be in English
</details>

<details>
<summary><b>Pull Request Guidelines</b></summary>

- Provide a clear description of changes
- Include screenshots for UI changes
- Ensure all CI checks pass
- Request review from maintainers
- Keep PRs focused and atomic
</details>

## 📚 Additional Resources

<details>
<summary><b>Documentation Links</b></summary>

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
</details>

<details>
<summary><b>Database Providers</b></summary>

- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [PlanetScale](https://planetscale.com/) - MySQL-compatible serverless database
- [Railway](https://railway.app/) - Full-stack deployment platform
</details>

<details>
<summary><b>Development Tools</b></summary>

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Vercel CLI](https://vercel.com/cli) - Deploy from command line
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management
</details>

## 🆘 Support

<details>
<summary><b>Getting Help</b></summary>

- **GitHub Issues**: [Open an issue](https://github.com/your-username/prescription-clarity/issues) for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and general help
- **Documentation**: Check this README and inline code comments
</details>

<details>
<summary><b>Reporting Issues</b></summary>

When reporting issues, please include:

1. **Environment**: Node.js version, OS, browser
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Logs**: Error messages and console output
</details>

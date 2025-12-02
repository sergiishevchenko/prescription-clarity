# GoIT Capstone Project G5

A modern, full-stack Next.js 16 application featuring secure authentication, profile management, and a beautiful responsive UI. Built with TypeScript, Tailwind CSS, Prisma ORM, and deployed on Vercel with Docker support.

## 🚀 Features

- **🔐 Secure Authentication**: HTTP-only cookie-based sessions with bcrypt password hashing
- **👤 Profile Management**: User profile editing with real-time validation
- **🎨 Modern UI**: Responsive design with Tailwind CSS and mobile-first approach
- **🗄️ Database**: PostgreSQL with Prisma ORM and type-safe queries
- **🐳 Docker Support**: Complete containerized development environment
- **🚀 CI/CD**: Automated GitHub Actions with Vercel deployment
- **🔒 Type Safety**: Full TypeScript support with strict mode
- **🧪 Testing**: Jest and React Testing Library with coverage reporting
- **📱 Mobile-First**: Responsive design optimized for all screen sizes
- **⚡ Performance**: Next.js 16 with App Router and Edge Runtime support

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5+ with strict mode
- **Styling**: Tailwind CSS 4 with custom design system
- **UI Components**: Custom component library with accessibility
- **State Management**: React hooks and context
- **Form Handling**: Client-side validation with Zod

### Backend

- **API**: Next.js API Routes with Edge Runtime support
- **Database**: PostgreSQL 16 with connection pooling
- **ORM**: Prisma 6+ with type-safe queries
- **Authentication**: HTTP-only cookies with Web Crypto API
- **Validation**: Zod schemas for request/response validation
- **Security**: bcryptjs for password hashing

### Development & Deployment

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions with automated testing
- **Deployment**: Vercel with preview deployments
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Jest, React Testing Library, coverage reporting
- **Database Migrations**: Prisma migrations with version control

## 📋 Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

## 🚀 Quick Start

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd goit-capstone-project-g5
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

### Docker Development

1. **Start the Docker environment**

   ```bash
   npm run docker:up
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Next.js app on port 3000

2. **Stop the Docker environment**
   ```bash
   npm run docker:down
   ```

## 🗄️ Database Setup

### Local Development

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Push schema changes (alternative to migrations)
npm run prisma:push
```

### Docker Development

```bash
# Run migrations inside Docker container
docker compose exec app npx prisma migrate dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run docker:up` - Start Docker development environment
- `npm run docker:down` - Stop Docker development environment

## 🏗️ Architecture Overview

### Application Architecture

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

### Security Architecture

- **Authentication Flow**: Email/password → bcrypt hashing → session token → HTTP-only cookie
- **Session Management**: Web Crypto API for token generation and validation
- **Route Protection**: Middleware-based authentication with Edge Runtime
- **Input Validation**: Zod schemas for all API endpoints
- **CSRF Protection**: SameSite cookie attributes and secure headers

## 📁 Project Structure

```
goit-capstone-project-g5/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                # Public routes (no auth required)
│   │   │   ├── login/               # Login page
│   │   │   ├── register/            # Registration page
│   │   │   └── page.tsx             # Landing page
│   │   ├── (private)/               # Protected routes (auth required)
│   │   │   ├── dashboard/           # User dashboard
│   │   │   └── profile/             # User profile management
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Authentication endpoints
│   │   │   │   ├── login/           # POST /api/auth/login
│   │   │   │   ├── register/        # POST /api/auth/register
│   │   │   │   └── logout/          # POST /api/auth/logout
│   │   │   └── profile/             # POST /api/profile
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout component
│   │   └── page.tsx                 # Home page
│   ├── components/                  # React components
│   │   ├── ui/                     # Base UI components
│   │   │   ├── Button.tsx          # Reusable button component
│   │   │   └── Input.tsx           # Reusable input component
│   │   └── shared/                 # Shared components
│   │       └── Navbar.tsx          # Navigation component
│   ├── lib/                        # Utility libraries
│   │   ├── auth/                   # Authentication utilities
│   │   │   ├── session.ts          # Session management
│   │   │   └── cookies.ts          # Cookie utilities
│   │   ├── validators/             # Zod validation schemas
│   │   │   ├── auth.ts             # Auth validation schemas
│   │   │   └── profile.ts          # Profile validation schemas
│   │   ├── db.ts                   # Prisma database client
│   │   └── utils.ts                # Utility functions
│   ├── middleware.ts               # Next.js middleware for auth
│   └── __tests__/                  # Test files
│       └── auth.test.ts            # Authentication tests
├── prisma/                         # Database schema and migrations
│   └── schema.prisma               # Prisma schema definition
├── .github/                        # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml                  # CI/CD pipeline
├── docker-compose.yml              # Docker development environment
├── Dockerfile                      # Docker image configuration
├── jest.config.js                  # Jest testing configuration
├── jest.setup.js                   # Jest setup file
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.mjs               # ESLint configuration
├── prettier.config.mjs             # Prettier configuration
└── package.json                    # Dependencies and scripts
```

## 🔐 Environment Variables

### Required Environment Variables

| Variable              | Description                       | Example                               | Required |
| --------------------- | --------------------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`        | PostgreSQL connection string      | `postgresql://user:pass@host:port/db` | ✅       |
| `SESSION_COOKIE_NAME` | Name of the session cookie        | `SESSION_ID`                          | ✅       |
| `SESSION_SECRET`      | Secret key for session encryption | `your-32-char-secret-key`             | ✅       |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application     | `http://localhost:3000`               | ✅       |

### Environment Files

#### Local Development (`.env.local`)

```env
# Database connection for local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/goit?schema=public"

# Session configuration
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Docker Development (`.env.dev`)

```env
# Database connection for Docker development
DATABASE_URL="postgresql://postgres:postgres@db:5432/goit?schema=public"

# Session configuration
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Production (Vercel Environment Variables)

```env
# Production database (e.g., Neon, Supabase, PlanetScale)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# Session configuration
SESSION_COOKIE_NAME="SESSION_ID"
SESSION_SECRET="production-secret-key-32-chars-minimum"

# Production URL
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Security Notes

- **SESSION_SECRET**: Use a cryptographically secure random string (minimum 32 characters)
- **DATABASE_URL**: Never commit production database URLs to version control
- **Environment Files**: `.env.local` and `.env.dev` are gitignored for security

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set up environment variables in Vercel**
   - `DATABASE_URL` - Your production database URL
   - `SESSION_COOKIE_NAME` - Session cookie name
   - `SESSION_SECRET` - Strong secret key
   - `NEXT_PUBLIC_APP_URL` - Your Vercel app URL
   - `AWS_LAMBDA_JS_RUNTIME` - Set to `nodejs22.x` (required for PDF export functionality)

3. **Deploy**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests

### CI/CD Pipeline

The project includes GitHub Actions workflow that:

- Runs linting and type checking
- Executes tests with coverage
- Builds the application
- Deploys to Vercel (preview and production)

## 🧪 API Endpoints

### Authentication Endpoints

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
  "success": true,
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
  "success": true,
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

### Profile Endpoints

#### `GET /api/profile`

Get current user profile (requires authentication).

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

#### `PATCH /api/profile`

Update user profile (requires authentication).

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id",
    "email": "newemail@example.com",
    "name": "Updated Name"
  }
}
```

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
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## 🔒 Security Features

- HTTP-only session cookies
- Password hashing with bcrypt
- Session token rotation
- Input validation with Zod
- CSRF protection
- Secure cookie settings

## 🛠️ Troubleshooting

### Common Issues

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

### Development Tips

1. **Hot Reload**: The development server supports hot reload for most changes
2. **Database Reset**: Use `npm run prisma:push` to reset database schema
3. **Testing**: Run `npm test` to execute the test suite
4. **Linting**: Use `npm run lint:fix` to automatically fix linting issues
5. **Formatting**: Use `npm run format` to format code with Prettier

### Performance Optimization

1. **Database Queries**: Use Prisma's `select` to fetch only needed fields
2. **Caching**: Implement Redis for session storage in production
3. **CDN**: Use Vercel's CDN for static assets
4. **Bundle Analysis**: Use `npm run build` to analyze bundle size

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/goit-capstone-project-g5.git
   cd goit-capstone-project-g5
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

### Code Standards

- **TypeScript**: Use strict mode and proper typing
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Use consistent code formatting
- **Testing**: Write tests for new features and bug fixes
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for significant changes

### Pull Request Guidelines

- Provide a clear description of changes
- Include screenshots for UI changes
- Ensure all CI checks pass
- Request review from maintainers
- Keep PRs focused and atomic

## 📄 License

This project is licensed under the MIT License.

## 📚 Additional Resources

### Documentation Links

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

### Database Providers

- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [PlanetScale](https://planetscale.com/) - MySQL-compatible serverless database
- [Railway](https://railway.app/) - Full-stack deployment platform

### Development Tools

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Vercel CLI](https://vercel.com/cli) - Deploy from command line
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management

## 📖 API Docs (Swagger)

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi`

Notes:

- When running in Docker, start the stack first: `npm run docker:up`
- If you change API routes or schemas, update `src/lib/openapi.ts`
- If you see a module error for `swagger-ui-react`, reinstall deps or rebuild Docker: `npm install` or `docker compose up --build`

## 🆘 Support

### Getting Help

- **GitHub Issues**: [Open an issue](https://github.com/your-username/goit-capstone-project-g5/issues) for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and general help
- **Documentation**: Check this README and inline code comments

### Reporting Issues

When reporting issues, please include:

1. **Environment**: Node.js version, OS, browser
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Logs**: Error messages and console output

### Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Provide a clear description
3. Explain the use case and benefits
4. Consider contributing a PR if possible

---

**Happy coding! 🚀**

# Docker Setup Guide

This project is configured to run in Docker with automatic database migrations.

## Quick Start

1. **Create the environment file:**

   Create a `.env.dev` file in the project root with the following content:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@db:5432/goit?schema=public"
   SESSION_COOKIE_NAME="SESSION_ID"
   SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   **Note:** Replace `SESSION_SECRET` with a secure random string (minimum 32 characters).

2. **Start the Docker environment:**

   ```bash
   npm run docker:up
   ```

   Or using docker-compose directly:

   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Database: localhost:5432 (user: postgres, password: postgres, database: goit)

4. **Stop the Docker environment:**

   ```bash
   npm run docker:down
   ```

## What Happens Automatically

When you start the Docker containers, the following happens automatically:

1. PostgreSQL database starts and becomes healthy
2. Prisma client is generated
3. Database migrations are applied
4. Next.js development server starts

No manual database setup required! 🎉

## Troubleshooting

### Port Already in Use

If port 3000 or 5432 is already in use, you can modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # Change 3000 to 3001 (or any available port)
```

### Database Connection Issues

If you see database connection errors:

1. Make sure the database container is healthy: `docker compose ps`
2. Check database logs: `docker compose logs db`
3. Verify `.env.dev` file exists and has correct `DATABASE_URL`

### Rebuild Containers

If you make changes to the Dockerfile or dependencies:

```bash
docker compose up --build --force-recreate
```

### Reset Database

To completely reset the database:

```bash
docker compose down -v
docker compose up --build
```

This will remove all volumes and start fresh.

# Retenza

Loyalty platform PWA built with Next.js, TypeScript, and PostgreSQL.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env.local with your config

# Start database
./start-database.sh

# Run migrations
pnpm db:push

# Generate VAPID keys
pnpm generate-vapid

# Start dev server
pnpm dev
```

## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript check

# Database
pnpm db:generate      # Generate migration
pnpm db:migrate       # Apply migrations
pnpm db:reset         # Reset database
pnpm db:studio        # Open Drizzle Studio

# PWA & Notifications
pnpm generate-vapid   # Generate VAPID keys
```

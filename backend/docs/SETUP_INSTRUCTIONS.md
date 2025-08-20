# Agro-Trade Backend Setup Instructions

## Prerequisites

Before setting up the Agro-Trade backend, ensure you have the following installed on your system:

### Required Software

```bash
# Node.js (18+ recommended)
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# PostgreSQL (14+ with PostGIS extension)
psql --version  # Should be 14.0 or higher

# Redis (6+ recommended)
redis-server --version  # Should be 6.0.0 or higher

# Git
git --version

# Docker (optional, for containerized development)
docker --version
docker-compose --version
```

### Development Tools (Recommended)

```bash
# VS Code with extensions:
- TypeScript and JavaScript Language Features
- Prisma
- REST Client
- Docker
- GitLens

# Database management tools:
- pgAdmin (PostgreSQL)
- Redis Desktop Manager
- Prisma Studio (included with project)
```

## Quick Start (Docker - Recommended)

The fastest way to get started is using Docker Compose:

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/agro-trade-backend.git
cd agro-trade-backend

# Copy environment variables
cp .env.example .env.local

# Start all services with Docker
docker-compose up -d
```

### 2. Initialize Database

```bash
# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

### 3. Start Development Server

```bash
# Start in development mode
npm run start:dev

# The API will be available at:
# http://localhost:3000/api/v1
# Swagger documentation: http://localhost:3000/api/docs
```

## Manual Setup (Local Development)

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/agro-trade-backend.git
cd agro-trade-backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### 2. Database Setup

#### PostgreSQL Installation

**macOS (using Homebrew):**
```bash
brew install postgresql@14 postgis
brew services start postgresql@14

# Create database and user
createdb agro_trade_dev
psql agro_trade_dev -c "CREATE EXTENSION postgis;"
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-14 postgresql-14-postgis-3

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb agro_trade_dev
sudo -u postgres psql agro_trade_dev -c "CREATE EXTENSION postgis;"
```

**Windows:**
- Download and install PostgreSQL from https://www.postgresql.org/download/windows/
- Download and install PostGIS from https://postgis.net/windows_downloads/
- Create database using pgAdmin or command line

#### Database Configuration

Update your `.env.local` file with database connection details:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/agro_trade_dev?schema=public"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agro_trade_dev
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
```

### 3. Redis Setup

#### Redis Installation

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
- Download Redis from https://github.com/MicrosoftArchive/redis/releases
- Or use WSL2 with Ubuntu and follow Linux instructions

#### Redis Configuration

Update your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4. Environment Configuration

Complete your `.env.local` file with all required variables:

```bash
# Application Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-too
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Email Configuration (optional for development)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-dev-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@agro-trade.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Stripe Configuration (use test keys)
STRIPE_SECRET_KEY=sk_test_your-stripe-test-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-test-webhook-secret
STRIPE_PUBLIC_KEY=pk_test_your-stripe-test-public-key
```

### 5. Database Initialization

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Optional: Open Prisma Studio to view data
npm run prisma:studio
```

### 6. Start Development Server

```bash
# Start in development mode with hot reload
npm run start:dev

# Or start in debug mode
npm run start:debug
```

The server will be available at:
- **API**: http://localhost:3000/api/v1
- **Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/status

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Choose "External" for user type
3. Fill in required information:
   - Application name: "Agro-Trade"
   - User support email: your email
   - Developer contact: your email

### 3. Create OAuth Credentials

1. Go to "Credentials" tab
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/v1/auth/google/callback`
   - Production: `https://your-domain.com/api/v1/auth/google/callback`
5. Copy Client ID and Client Secret to your `.env.local`

## Stripe Payment Setup

### 1. Create Stripe Account

1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Complete account setup
3. Switch to "Test mode" for development

### 2. Get API Keys

1. Go to "Developers" > "API keys"
2. Copy the following to your `.env.local`:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### 3. Setup Webhooks (Optional for MVP)

1. Go to "Developers" > "Webhooks"
2. Add endpoint: `http://localhost:3000/api/v1/webhooks/stripe`
3. Select events to listen for
4. Copy webhook secret to your environment file

## Testing Setup

### 1. Run Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### 2. Run Integration Tests

```bash
# Run e2e tests
npm run test:e2e

# Run specific test file
npm run test -- users.service.spec.ts
```

### 3. Database Testing

```bash
# Create test database
createdb agro_trade_test
psql agro_trade_test -c "CREATE EXTENSION postgis;"

# Set test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://username:password@localhost:5432/agro_trade_test?schema=public"

# Run migrations for test database
npm run prisma:migrate:deploy
```

## Production Deployment (Railway)

### 1. Railway Account Setup

1. Sign up at [Railway](https://railway.app/)
2. Connect your GitHub account
3. Import your repository

### 2. Environment Variables

Add the following environment variables in Railway dashboard:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...  # Railway will provide this
REDIS_URL=redis://...          # Railway will provide this

# Copy all other variables from .env.example
# Use production values for:
# - JWT secrets (generate strong random strings)
# - Google OAuth credentials (production URLs)
# - Stripe live keys (when ready for production)
```

### 3. Add Railway Services

```bash
# Add PostgreSQL with PostGIS
railway add postgresql

# Add Redis
railway add redis

# Deploy application
railway up
```

### 4. Database Setup in Production

```bash
# Connect to Railway PostgreSQL and enable PostGIS
railway connect postgresql
CREATE EXTENSION postgis;

# Run migrations
railway run npm run prisma:migrate:deploy

# Seed production database (optional)
railway run npm run prisma:seed
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep agro_trade

# Test connection
psql postgresql://username:password@localhost:5432/agro_trade_dev
```

#### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Check Redis configuration
redis-cli config get '*'
```

#### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Permission Issues (macOS/Linux)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix PostgreSQL permissions
sudo chown -R $(whoami) /usr/local/var/postgres
```

### Environment-Specific Issues

#### Development Environment

- Ensure all services are running (PostgreSQL, Redis)
- Check environment variables are correctly set
- Verify database migrations are up to date

#### Docker Environment

```bash
# View container logs
docker-compose logs api
docker-compose logs postgres
docker-compose logs redis

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build
```

#### Production Environment

- Check Railway service logs
- Verify environment variables are set correctly
- Ensure database migrations are deployed
- Check domain and SSL configuration

### Getting Help

#### Check Logs

```bash
# Application logs
npm run start:dev  # Will show logs in console

# Database query logs (set in Prisma)
DEBUG=prisma:query npm run start:dev

# Docker logs
docker-compose logs -f api
```

#### Useful Commands

```bash
# Check database schema
npm run prisma:studio

# Reset database (development only!)
npm run prisma:migrate:reset

# Generate new migration
npm run prisma:migrate:dev --name your_migration_name

# Check API endpoints
curl http://localhost:3000/api/v1/status
```

## Development Best Practices

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run build
```

### Database Management

```bash
# Always create migrations for schema changes
npm run prisma:migrate:dev --name descriptive_name

# Keep migrations small and focused
# Test migrations on sample data

# Use Prisma Studio for data inspection
npm run prisma:studio
```

### Testing

```bash
# Write tests for all business logic
# Maintain >80% test coverage
# Run tests before committing

npm run test
npm run test:e2e
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Commit changes with clear messages
git add .
git commit -m "feat: implement Google OAuth authentication"

# Push and create PR
git push origin feature/user-authentication
```

This setup guide should get you up and running with the Agro-Trade backend in both development and production environments. For additional help, refer to the API documentation at `/api/docs` once the server is running.
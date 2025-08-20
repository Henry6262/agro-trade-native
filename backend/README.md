# Agro-Trade Backend API

Agricultural Trading Marketplace Backend built with NestJS, PostgreSQL, and Redis.

## 🌾 Overview

Agro-Trade is a comprehensive agricultural trading platform that connects farmers, factories, transporters, and administrators/brokers. The platform facilitates seamless agricultural product trading with features including order management, deal matching, transportation logistics, and integrated payment processing.

## 🚀 Features

- **Multi-user System**: Support for Farmers, Factories, Transporters, and Admin/Brokers
- **OAuth 2.0 Authentication**: Google OAuth integration with JWT tokens
- **Order Management**: Create and manage buy/sell orders with geographic filtering
- **Deal Engine**: Automated matching with 5% commission system
- **Transportation**: Bidding system for transport jobs with real-time tracking
- **Payment Processing**: Stripe integration with commission collection
- **Real-time Features**: WebSocket support for live updates
- **Geographic Services**: PostGIS integration for location-based matching
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 14+ with PostGIS extension
- **ORM**: Prisma
- **Cache**: Redis 6+
- **Authentication**: Passport.js with Google OAuth 2.0
- **Payment**: Stripe
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Deployment**: Railway

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication & authorization
│   ├── users/             # User management
│   ├── orders/            # Order management system
│   ├── deals/             # Deal & transaction engine
│   ├── transportation/    # Transport & logistics
│   ├── payments/          # Payment processing
│   ├── notifications/     # Notification system
│   ├── websocket/         # Real-time communication
│   ├── geolocation/       # Geographic services
│   ├── admin/             # Administrative functions
│   ├── cache/             # Redis caching service
│   ├── queue/             # Background job processing
│   ├── database/          # Database configuration
│   └── common/            # Shared utilities
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── docs/                  # Documentation
├── test/                  # Test files
└── docker-compose.yml     # Development environment
```

## 🏁 Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/agro-trade-backend.git
cd agro-trade-backend

# Start services
docker-compose up -d

# Initialize database
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run start:dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Setup database (PostgreSQL + PostGIS)
# Setup Redis

# Initialize database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run start:dev
```

## 📖 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:3000/api/docs
- **API Base URL**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/status

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development

### Available Scripts

```bash
npm run start          # Start production server
npm run start:dev      # Start development server with hot reload
npm run start:debug    # Start server in debug mode
npm run build          # Build for production
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Database Commands

```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:seed        # Seed database with sample data
npm run prisma:studio      # Open Prisma Studio (database GUI)
npm run prisma:reset       # Reset database (development only)
```

## 🌍 Deployment

### Railway (Recommended)

1. Create account at [Railway](https://railway.app/)
2. Connect GitHub repository
3. Add PostgreSQL and Redis services
4. Configure environment variables
5. Deploy with `railway up`

### Manual Deployment

1. Build the application: `npm run build`
2. Set environment variables for production
3. Run database migrations: `npm run prisma:migrate:deploy`
4. Start the server: `npm run start:prod`

## 📋 Environment Variables

Key environment variables to configure:

```bash
# Application
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Commission
PLATFORM_COMMISSION_RATE=0.05
```

See `.env.example` for complete configuration.

## 🏗 Architecture

### Business Flow

1. **DISCOVERY**: Farmers create sell orders, Factories create buy requests
2. **MATCHING**: Admin/system matches compatible orders (5% commission)
3. **APPROVAL**: Both parties review and approve deals
4. **LOGISTICS**: Transport jobs created, transporters bid on jobs
5. **EXECUTION**: Delivery tracked, payment processed, commission collected

### User Types & Permissions

- **FARMER**: Create sell orders, manage products, approve deals
- **FACTORY**: Create buy requests, discover products, approve deals
- **TRANSPORTER**: Bid on transport jobs, track deliveries
- **ADMIN/BROKER**: Match orders, manage users, collect commissions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript and NestJS best practices
- Write comprehensive tests (>80% coverage)
- Use conventional commit messages
- Ensure all tests pass before submitting PR
- Update documentation for new features

## 📚 Documentation

- [API Architecture](./docs/API_ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md)
- [Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)
- [Implementation Roadmap](./docs/IMPLEMENTATION_ROADMAP.md)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**:
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify PostGIS extension
psql -d agro_trade_dev -c "SELECT PostGIS_Version();"
```

**Redis Connection Error**:
```bash
# Check Redis is running
redis-cli ping  # Should return PONG
```

**Port Already in Use**:
```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NestJS for the amazing framework
- Prisma for excellent database tooling
- Railway for seamless deployment
- PostGIS for geographic capabilities

---

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

**Happy Trading! 🌾**
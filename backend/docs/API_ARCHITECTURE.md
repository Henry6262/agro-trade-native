# Agro-Trade API Architecture

## Overview

The Agro-Trade platform provides a comprehensive RESTful API designed to facilitate agricultural trading between Farmers (Sellers), Factories (Buyers), Transporters, and Administrators/Brokers. The API follows REST principles and is built with NestJS, providing a modular, scalable architecture.

## Base URL Structure

```
Production: https://api.agro-trade.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication & Authorization

### Authentication Methods
- **OAuth 2.0 with Google**: Primary authentication method
- **JWT Tokens**: For API access and session management
- **API Keys**: For service-to-service communication

### Token Management
```
Authorization: Bearer <jwt_token>
```

### User Roles & Permissions
- **FARMER**: Create sell orders, manage farm profile, view matched deals
- **FACTORY**: Create buy requests, manage factory profile, approve deals
- **TRANSPORTER**: Bid on transport jobs, manage delivery tracking
- **ADMIN/BROKER**: Manage all operations, match orders, collect commissions

## API Endpoints by User Type

### 1. Authentication Endpoints (All Users)

```
POST   /auth/google              # Google OAuth login
POST   /auth/refresh             # Refresh JWT token
POST   /auth/logout              # Logout user
GET    /auth/profile             # Get current user profile
PUT    /auth/profile             # Update user profile
```

### 2. Farmer/Seller Endpoints

#### Profile Management
```
GET    /users/farmers/profile    # Get farmer profile
PUT    /users/farmers/profile    # Update farmer profile
POST   /users/farmers/documents  # Upload farm documents
```

#### Sell Order Management
```
GET    /orders/sell              # List farmer's sell orders
POST   /orders/sell              # Create new sell order
GET    /orders/sell/:id          # Get specific sell order
PUT    /orders/sell/:id          # Update sell order
DELETE /orders/sell/:id          # Cancel sell order
POST   /orders/sell/:id/images   # Upload product images
```

#### Deal Management
```
GET    /deals/seller             # List deals as seller
GET    /deals/:id                # Get deal details
PUT    /deals/:id/approve        # Approve a deal
PUT    /deals/:id/reject         # Reject a deal
POST   /deals/:id/documents      # Upload deal documents
```

#### Analytics
```
GET    /analytics/farmer         # Farmer dashboard analytics
GET    /analytics/farmer/sales   # Sales performance metrics
GET    /analytics/farmer/orders  # Order completion rates
```

### 3. Factory/Buyer Endpoints

#### Profile Management
```
GET    /users/factories/profile  # Get factory profile
PUT    /users/factories/profile  # Update factory profile
POST   /users/factories/documents # Upload factory documents
```

#### Buy Request Management
```
GET    /orders/buy               # List factory's buy requests
POST   /orders/buy               # Create new buy request
GET    /orders/buy/:id           # Get specific buy request
PUT    /orders/buy/:id           # Update buy request
DELETE /orders/buy/:id           # Cancel buy request
```

#### Order Discovery
```
GET    /orders/discover          # Discover available sell orders
POST   /orders/search            # Advanced search for products
GET    /orders/nearby            # Find orders within radius
GET    /orders/recommendations   # Get personalized recommendations
```

#### Deal Management
```
GET    /deals/buyer              # List deals as buyer
PUT    /deals/:id/approve        # Approve a deal
PUT    /deals/:id/reject         # Reject a deal
POST   /deals/:id/payment        # Process payment for deal
```

#### Analytics
```
GET    /analytics/factory        # Factory dashboard analytics
GET    /analytics/factory/purchases # Purchase analytics
GET    /analytics/factory/suppliers # Supplier performance
```

### 4. Transporter Endpoints

#### Profile Management
```
GET    /users/transporters/profile # Get transporter profile
PUT    /users/transporters/profile # Update transporter profile
POST   /users/transporters/vehicles # Add vehicle information
PUT    /users/transporters/vehicles/:id # Update vehicle info
```

#### Transport Job Management
```
GET    /transport/jobs           # List available transport jobs
GET    /transport/jobs/assigned  # List assigned jobs
GET    /transport/jobs/:id       # Get job details
POST   /transport/jobs/:id/bid   # Submit bid for job
PUT    /transport/bids/:id       # Update bid
DELETE /transport/bids/:id       # Withdraw bid
```

#### Delivery Tracking
```
POST   /transport/jobs/:id/start # Start delivery
POST   /transport/jobs/:id/track # Update location/status
POST   /transport/jobs/:id/complete # Mark delivery complete
GET    /transport/jobs/:id/tracking # Get tracking history
```

#### Analytics
```
GET    /analytics/transporter    # Transporter dashboard
GET    /analytics/transporter/jobs # Job completion metrics
GET    /analytics/transporter/earnings # Earnings analytics
```

### 5. Admin/Broker Endpoints

#### User Management
```
GET    /admin/users              # List all users
GET    /admin/users/:id          # Get user details
PUT    /admin/users/:id/status   # Update user status
POST   /admin/users/:id/verify   # Verify user documents
```

#### Order Management
```
GET    /admin/orders             # List all orders
GET    /admin/orders/matching    # Orders ready for matching
POST   /admin/orders/match       # Match buy/sell orders
PUT    /admin/orders/:id/status  # Update order status
```

#### Deal Management
```
GET    /admin/deals              # List all deals
POST   /admin/deals              # Create deal from matched orders
PUT    /admin/deals/:id/approve  # Admin approve deal
GET    /admin/deals/commission   # Commission tracking
```

#### Transport Management
```
GET    /admin/transport/jobs     # List all transport jobs
POST   /admin/transport/jobs     # Create transport job
PUT    /admin/transport/jobs/:id/assign # Assign transporter
```

#### System Management
```
GET    /admin/config             # Get system configuration
PUT    /admin/config             # Update system settings
GET    /admin/audit              # Audit log entries
GET    /admin/analytics          # System-wide analytics
```

### 6. Common Endpoints (All Users)

#### Catalog & Discovery
```
GET    /categories               # List product categories
GET    /categories/:id/products  # Products in category
GET    /products                 # List all products
GET    /products/:id             # Get product details
```

#### Location Services
```
POST   /location/geocode         # Convert address to coordinates
POST   /location/reverse         # Convert coordinates to address
GET    /location/nearby          # Find nearby locations
```

#### Notifications
```
GET    /notifications            # List user notifications
PUT    /notifications/:id/read   # Mark notification as read
PUT    /notifications/read-all   # Mark all as read
DELETE /notifications/:id        # Delete notification
```

#### Reviews & Ratings
```
GET    /reviews/:userId          # Get user reviews
POST   /reviews                  # Create review
PUT    /reviews/:id              # Update review
GET    /reviews/stats/:userId    # User rating statistics
```

#### File Management
```
POST   /files/upload             # Upload file
GET    /files/:id                # Get file
DELETE /files/:id                # Delete file
```

## WebSocket Events

### Real-time Communication
```javascript
// Connection
ws://localhost:3000/ws

// Events
- order:matched         # Order got matched
- deal:created          # New deal created
- deal:approved         # Deal approved by party
- deal:rejected         # Deal rejected
- transport:bid         # New transport bid
- transport:assigned    # Transport job assigned
- delivery:started      # Delivery started
- delivery:completed    # Delivery completed
- payment:received      # Payment processed
- notification:new      # New notification
```

## Request/Response Formats

### Standard Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>
X-API-Version: 1.0
```

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Pagination Format
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Business Flow API Sequences

### 1. Order Matching Flow
```
1. Farmer creates sell order -> POST /orders/sell
2. Factory creates buy request -> POST /orders/buy
3. Admin views matching opportunities -> GET /admin/orders/matching
4. Admin creates deal -> POST /admin/deals
5. Both parties get notifications -> WebSocket events
6. Parties approve deal -> PUT /deals/:id/approve
```

### 2. Transportation Flow
```
1. Deal approved -> Creates transport job automatically
2. Transporters view jobs -> GET /transport/jobs
3. Transporters submit bids -> POST /transport/jobs/:id/bid
4. Admin assigns winner -> PUT /admin/transport/jobs/:id/assign
5. Transport starts -> POST /transport/jobs/:id/start
6. Real-time tracking -> POST /transport/jobs/:id/track
7. Delivery completion -> POST /transport/jobs/:id/complete
```

### 3. Payment Flow
```
1. Delivery confirmed -> Triggers payment process
2. Buyer processes payment -> POST /deals/:id/payment
3. Platform deducts commission (5%)
4. Seller receives payment notification
5. Payment history tracked -> GET /payments/history
```

## Rate Limiting

### Global Limits
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
- 10000 requests per day per organization

### Endpoint-specific Limits
- File uploads: 5 per minute
- Search queries: 50 per minute
- WebSocket connections: 10 per user

## Security Considerations

### Input Validation
- All inputs validated using class-validator
- SQL injection prevention with Prisma ORM
- XSS protection with helmet middleware

### Data Protection
- Sensitive data encrypted at rest
- PII data anonymized in logs
- GDPR compliance for EU users

### Access Control
- Role-based access control (RBAC)
- Resource-level permissions
- API rate limiting per user role

## Error Codes

### Authentication Errors (4001-4099)
- 4001: Invalid credentials
- 4002: Token expired
- 4003: Insufficient permissions
- 4004: Account suspended

### Validation Errors (4100-4199)
- 4100: Invalid input format
- 4101: Required field missing
- 4102: Value out of range
- 4103: Invalid geographic coordinates

### Business Logic Errors (4200-4299)
- 4200: Order already matched
- 4201: Insufficient inventory
- 4202: Deal approval timeout
- 4203: Transport capacity exceeded

### System Errors (5000-5099)
- 5000: Internal server error
- 5001: Database connection error
- 5002: External service unavailable
- 5003: File upload failed

## API Versioning

### Current Version: v1
- Base path: `/api/v1/`
- Backward compatibility maintained
- Deprecation notices provided 6 months in advance

### Version Headers
```
Accept: application/vnd.api+json;version=1
X-API-Version: 1.0
```

## Development & Testing

### Environment URLs
- Development: `http://localhost:3000/api/v1`
- Staging: `https://staging-api.agro-trade.com/api/v1`
- Production: `https://api.agro-trade.com/api/v1`

### API Documentation
- Swagger UI: `/api/docs`
- OpenAPI Spec: `/api/docs/json`
- Postman Collection: Available in repository

This API architecture provides a comprehensive foundation for the Agro-Trade platform, enabling secure, scalable, and efficient agricultural trading operations across all user types.
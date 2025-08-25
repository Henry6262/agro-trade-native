# Archived Comprehensive Agro Trade Schema
**Date Archived:** August 24, 2025  
**Version:** 2.0 (Optimized)

## Overview
This document preserves the comprehensive database schema that was designed for a full-featured agricultural trading platform. It includes advanced features like deal management, transportation bidding, payment processing, and analytics.

## Schema Features
- 22 tables total
- Complete user management with multiple OAuth providers
- Full order-to-deal-to-delivery lifecycle
- Transportation bidding system
- Payment and commission handling
- Review and rating system
- Compliance and KYC management
- Analytics and price tracking
- Audit logging

## Complete Schema Definition

```prisma
// ==================== CONFIGURATION ====================
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch", "views"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  FARMER      // Seller
  FACTORY     // Buyer  
  TRANSPORTER
  ADMIN
  BROKER
  MODERATOR   // For content moderation
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  BANNED
  INACTIVE    // For soft delete
}

enum OrderType {
  SELL        // Farmers create sell orders
  BUY         // Factories create buy requests
}

enum OrderStatus {
  DRAFT       // Incomplete orders
  ACTIVE
  MATCHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  EXPIRED
  ARCHIVED    // Old orders
}

enum DealStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  IN_PROGRESS
  DELIVERED
  COMPLETED
  DISPUTED
  CANCELLED
  REFUNDED
}

enum TransportJobStatus {
  OPEN
  BIDDING
  ASSIGNED
  IN_TRANSIT
  DELIVERED
  COMPLETED
  CANCELLED
  DELAYED
}

enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
  EXPIRED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
  DISPUTED
}

enum NotificationType {
  ORDER_MATCHED
  DEAL_CREATED
  DEAL_APPROVED
  DEAL_REJECTED
  TRANSPORT_BID_RECEIVED
  TRANSPORT_ASSIGNED
  DELIVERY_STARTED
  DELIVERY_COMPLETED
  PAYMENT_RECEIVED
  PAYMENT_FAILED
  SYSTEM_ALERT
  PRICE_ALERT
  ACCOUNT_UPDATE
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum DocumentType {
  BUSINESS_LICENSE
  TAX_CERTIFICATE
  QUALITY_CERTIFICATE
  INSURANCE
  CONTRACT
  INVOICE
  RECEIPT
  OTHER
}
```

## Table Descriptions

### User Management

#### Users Table
Primary user authentication and identity table with support for multiple OAuth providers.
- Google, Apple, Facebook OAuth integration
- KYC verification status
- Soft delete support
- Location coordinates (latitude/longitude)
- Business information fields
- Notification preferences

#### UserProfile Table
Extended profile information based on user role:
- **Farmers**: Farm size, crops grown, certifications, experience
- **Factories/Buyers**: Industry type, processing capacity, required certifications
- **Transporters**: Vehicle types, fleet size, coverage areas, insurance

#### Session Table
JWT session management for secure authentication:
- Access and refresh token storage
- Device tracking
- Expiration management

### Product & Category Management

#### Category Table
Hierarchical product categorization:
- Parent-child relationships
- SEO optimization fields
- Icons and images
- Sort ordering

#### Product Table
Comprehensive product catalog:
- SKU management
- Quality grades and certifications
- Seasonal availability
- Pricing tiers
- Minimum order quantities

### Order Management

#### Order Table
Buy/sell order marketplace:
- SELL orders from farmers
- BUY orders from factories
- Location-based matching
- Quality specifications
- Preferred partner filtering
- View and inquiry tracking

#### OrderInquiry Table
Q&A system for orders:
- Buyer inquiries
- Seller responses
- Answer tracking

### Deal & Transaction Management

#### Deal Table
Matched trades between parties:
- Commission calculation (5% platform fee)
- Multi-party approval workflow
- Contract management
- Quality specifications
- Delivery coordination

#### DealMilestone Table
Progress tracking for deals:
- Customizable milestones
- Due dates
- Completion tracking

#### Dispute Table
Conflict resolution system:
- Evidence submission
- Resolution tracking
- Escalation workflow

### Transportation & Logistics

#### TransportJob Table
Shipping job management:
- Route planning (pickup/delivery)
- Cargo specifications
- Vehicle requirements
- Budget ranges
- Performance tracking

#### TransportBid Table
Competitive bidding system:
- Price proposals
- Vehicle details
- Insurance verification
- Winner selection

#### TrackingUpdate Table
Real-time shipment tracking:
- GPS location updates
- Temperature/humidity monitoring (cold chain)
- Status updates
- Image uploads

### Payment Management

#### Payment Table
Comprehensive payment processing:
- Multiple payment methods (Stripe, bank transfer, PayPal)
- Multi-currency support
- Fee calculation
- Refund handling
- Gateway integration

### Review & Rating System

#### Review Table
User feedback system:
- Multi-criteria ratings (overall, communication, quality, timeliness, packaging)
- Verified reviews
- Public/private options
- Response capability

### Notifications

#### Notification Table
Multi-channel notification system:
- In-app, email, push, SMS
- Priority levels
- Read tracking
- Expiration

### Document Management

#### Document Table
File storage and verification:
- Multiple document types
- Verification workflow
- Expiration tracking
- Entity associations

### System Tables

#### SystemConfig Table
Platform configuration:
- Dynamic settings
- Public/private configs
- Category organization

#### ActivityLog Table
User activity tracking:
- Action logging
- Entity tracking
- Request details

#### AuditLog Table
System audit trail:
- Change tracking
- Before/after values
- User attribution

### Analytics Tables

#### PriceHistory Table
Historical price tracking:
- Product pricing over time
- Location-based pricing
- Source tracking

#### MarketInsight Table
Market analytics:
- Trends and forecasts
- Category analysis
- Validity periods

## Relationships & Business Logic

### Order to Deal Flow
1. Farmers create SELL orders
2. Factories create BUY orders  
3. System matches compatible orders
4. Deal created with PENDING_APPROVAL status
5. Both parties approve
6. Admin approves
7. Deal moves to IN_PROGRESS

### Transportation Flow
1. Deal approved → TransportJob created
2. Job status OPEN for bidding
3. Transporters submit bids
4. Admin/system selects winner
5. Job ASSIGNED to transporter
6. Real-time tracking during delivery
7. Completion and payment

### Payment Flow
1. Deal completed
2. Payment initiated by buyer
3. Platform deducts 5% commission
4. Seller receives net amount
5. Transporter paid separately

## Seed Data

### Categories (6)
- Wheat (with Soft/Durum subcategories)
- Grains (Corn, Barley, Oats)
- Oilseeds (Sunflower, Rapeseed)
- Legumes (Peas)
- Feed & Meal (Soybean meal, Wheat bran, Alfalfa)
- Other

### Products (12)
1. Soft Wheat - Pastry/cake flour grade
2. Durum Wheat - Pasta production grade
3. Corn/Maize - Feed and processing
4. Barley - Malting and feed
5. Oats - Milling and feed
6. Sunflower - High oleic oil production
7. Rapeseed/Canola - Oil and biodiesel
8. Peas - Food and feed grade
9. Soybean Meal - High protein feed
10. Wheat Bran - Animal feed
11. Alfalfa Pellets - Livestock feed
12. Other Cereals & Oilseeds - Various

### Users (7)
- 1 Admin
- 2 Farmers (with detailed profiles)
- 2 Factories/Buyers (with processing capabilities)
- 2 Transporters (with fleet details)

### Sample Data
- 4 active orders (2 SELL, 2 BUY)
- 330 price history records
- 5 system configurations

## Key Features

### Security
- JWT authentication with refresh tokens
- Session management
- Activity logging
- Audit trails
- Role-based access control

### Performance Optimizations
- Indexed fields for fast queries
- Compound indexes for common queries
- Lazy loading of profile data
- Soft deletes for data retention

### Compliance Ready
- KYC/KYB verification system
- Document management
- Audit logging
- EU funding compliance fields

### Analytics Capable
- Price history tracking
- Market insights
- User activity tracking
- Deal performance metrics

## Migration Notes

This schema was designed for a full-featured platform but proved too complex for initial MVP. Key learnings:

1. **Over-engineering**: Too many features for initial launch
2. **Complexity**: 22 tables overwhelming for onboarding focus
3. **Dependencies**: Too many required fields blocking user flow
4. **Performance**: Simpler schema better for rapid iteration

## Reusable Components

When scaling up, these components can be cherry-picked:

1. **Session Management**: Complete JWT implementation
2. **Payment System**: Stripe integration ready
3. **Transportation Bidding**: Complete workflow
4. **Review System**: Multi-criteria ratings
5. **Document Management**: Verification workflow
6. **Audit System**: Complete tracking
7. **Price Analytics**: Historical tracking

## Original Design Goals

1. **Marketplace**: Connect farmers, buyers, transporters
2. **Trust**: Reviews, ratings, verification
3. **Efficiency**: Automated matching, bidding
4. **Compliance**: EU funding requirements
5. **Analytics**: Price trends, market insights
6. **Scale**: Handle thousands of users/transactions

---

**Note**: This schema represents months of planning and optimization. While simplified for MVP, it remains a valuable reference for future platform expansion.
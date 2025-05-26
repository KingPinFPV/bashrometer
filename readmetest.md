# Bashrometer Project Summary

## 1. Problem Statement

The meat market lacks price transparency, making it difficult for consumers to find the best deals across different retailers. Traditional price comparison tools don't capture the nuanced specifications of meat products (kosher levels, cuts, origins, brands) or provide real-time, community-validated pricing data.

**Core Challenge**: How do we create a reliable, community-driven platform that helps consumers make informed purchasing decisions for meat products while ensuring price data accuracy through community validation?

## 2. Solution Overview

Bashrometer is a **community-driven price comparison platform for meat products** that combines crowd-sourced price reporting with community validation mechanisms. Users can submit price reports for specific meat products at various retailers, while the community validates these reports through a like/unlike system to establish trust and accuracy.

**Key Innovation**: Community-based validation system that ensures price data quality while building a comprehensive database of meat prices across retailers.

## 3. MVP Core Features

### User Management
- **User Registration/Login**: JWT-based authentication with role-based access control
- **Role-Based Access**: User, Editor, and Admin roles with appropriate permissions
- **Profile Management**: Basic user profile functionality

### Product Catalog
- **Meat Product Database**: Comprehensive product specifications including brand, cut type, kosher level, origin
- **Product Search**: Find products by various attributes and specifications
- **Product Management**: Admin CRUD operations for maintaining product database

### Retailer Network
- **Retailer Directory**: Database of meat retailers with location, type, and rating information
- **Retailer Management**: Admin tools for maintaining retailer information

### Price Reporting System
- **Price Submission**: Users can report current prices for products at specific retailers
- **Price Validation**: Community like/unlike system for validating price accuracy
- **Price History**: Track price changes over time
- **Price Normalization**: Calculate and compare prices per 100g across different units

### Administrative Interface
- **Admin Dashboard**: Manage products, retailers, and price reports
- **Content Moderation**: Tools for maintaining data quality and community standards

## 4. Key Data Models

### Core Entities

**Users Table**
- `id`, `username`, `email`, `password_hash`, `role`, `created_at`, `updated_at`
- Roles: user, editor, admin

**Products Table**
- `id`, `name`, `brand`, `cut_type`, `kosher_level`, `origin`, `description`, `image_url`
- Comprehensive meat product specifications

**Retailers Table**
- `id`, `name`, `type`, `location`, `address`, `phone`, `website`, `rating`
- Complete retailer information and contact details

**Prices Table**
- `id`, `product_id`, `retailer_id`, `user_id`, `price`, `sale_price`, `unit`, `quantity`
- `valid_from`, `valid_until`, `status`, `likes_count`, `created_at`
- Central price reporting with validation periods

**Price Report Likes Table**
- `id`, `price_id`, `user_id`, `created_at`
- Community validation mechanism

### Relationships
- Users ’ Price Reports (1:many)
- Products ’ Price Reports (1:many)
- Retailers ’ Price Reports (1:many)
- Users ” Price Reports (many:many via likes)

## 5. API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /me` - Get current user information

### Products (`/api/products`)
- `GET /` - List products with filtering and pagination
- `GET /:id` - Get product details with price examples
- `POST /` - Create new product (Admin)
- `PUT /:id` - Update product (Admin)
- `DELETE /:id` - Delete product (Admin)

### Retailers (`/api/retailers`)
- `GET /` - List retailers with filtering
- `GET /:id` - Get retailer details
- `POST /` - Create retailer (Admin)
- `PUT /:id` - Update retailer (Admin)
- `DELETE /:id` - Delete retailer (Admin)

### Prices (`/api/prices`)
- `GET /` - List price reports with filtering
- `POST /` - Submit new price report
- `POST /:id/like` - Like/unlike price reports
- `PUT /:id/status` - Update price report status (Admin)

## 6. Non-Functional Requirements (NFRs)

### Performance
- **Response Time**: API responses < 500ms for 95th percentile
- **Throughput**: Support 1000+ concurrent users
- **Database**: Optimized queries with proper indexing

### Security
- **Authentication**: JWT-based with 2-hour token expiration
- **Authorization**: Role-based access control
- **Data Protection**: Password hashing with bcryptjs
- **Input Validation**: Comprehensive request validation

### Scalability
- **Database**: PostgreSQL with cloud hosting (Neon)
- **Architecture**: Microservices-ready monorepo structure
- **Caching**: Ready for Redis implementation

### Reliability
- **Error Handling**: Comprehensive error responses
- **Testing**: 80%+ test coverage for API endpoints
- **Monitoring**: Structured logging and error tracking

### Usability
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: RTL support and semantic HTML
- **User Experience**: Intuitive navigation and clear feedback

## 7. Success Metrics

### User Engagement
- **Monthly Active Users**: Target 1000+ MAU within 6 months
- **Price Reports Submitted**: 500+ reports per month
- **Community Validation**: 70%+ of reports receive community likes

### Data Quality
- **Price Accuracy**: 90%+ community validation rate
- **Data Completeness**: 95%+ of products have recent price data
- **User Retention**: 40%+ monthly user retention rate

### Business Impact
- **Market Coverage**: 50+ retailers in initial market
- **Product Catalog**: 1000+ unique meat products
- **User Satisfaction**: 4.0+ average user rating

## 8. High-Level Roadmap

### Phase 1: MVP (Current - 3 months)
-  Core CRUD operations for all entities
-  User authentication and role management
-  Basic price reporting and validation
-  Admin interface for content management
- = Enhanced search and filtering capabilities
- = Mobile-responsive UI improvements

### Phase 2: Community Features (3-6 months)
- Advanced user profiles and reputation system
- Enhanced community validation mechanisms
- Price alert notifications
- User reviews and comments on retailers
- Social features (following users, sharing finds)

### Phase 3: Intelligence & Analytics (6-9 months)
- Price trend analysis and predictions
- Automated price scraping from retailer websites
- Personalized recommendations
- Advanced analytics dashboard
- Mobile app development

### Phase 4: Scale & Optimize (9-12 months)
- Multi-region support
- Performance optimization for large datasets
- Integration with retailer APIs
- Advanced search with ML-powered recommendations
- Business intelligence features

## 9. Tech Stack Decisions

### Backend Architecture
**Node.js + Express.js**: Chosen for rapid development, extensive ecosystem, and JavaScript consistency across the stack.

**PostgreSQL**: Selected for ACID compliance, complex relationship handling, and robust query capabilities needed for price comparison analytics.

**JWT Authentication**: Stateless authentication suitable for API-first architecture and future mobile app integration.

### Frontend Architecture
**Next.js 15 with App Router**: Modern React framework providing SSR, optimal performance, and excellent developer experience.

**TypeScript**: Type safety for large-scale application development and better IDE support.

**Tailwind CSS v4**: Utility-first CSS framework for rapid UI development and consistent design system.

### Development & Deployment
**Jest + Supertest**: Comprehensive testing framework for API endpoints and integration testing.

**Docker**: Containerization for consistent development and deployment environments.

**Monorepo Structure**: Organized codebase with separate API and frontend while maintaining shared configurations.

### Rationale for Key Decisions
- **PostgreSQL over NoSQL**: Complex relational data with price comparisons require ACID compliance
- **JWT over Sessions**: Stateless authentication for API scalability and mobile app readiness
- **Next.js over React SPA**: SEO benefits crucial for public price comparison platform
- **Monorepo**: Simplified development workflow while maintaining separation of concerns

## 10. PoC Structure

### Current Implementation Status

**Backend (API) - 90% Complete**
```
api/
   controllers/         # Business logic layer
      authController.js    # User authentication & registration
      productsController.js # Product CRUD operations
      retailersController.js # Retailer management
      pricesController.js   # Price reporting & validation
   routes/             # API endpoint definitions
   middleware/         # Authentication & authorization
   utils/              # Price calculation utilities
   tests/              # Comprehensive test suite (80%+ coverage)
   db.js               # PostgreSQL connection management
   schema.sql          # Complete database schema
```

**Frontend - 70% Complete**
```
frontend/src/
   app/                # Next.js App Router pages
      admin/          # Administrative interface
      products/       # Product browsing & details
      login/register/ # Authentication pages
      report-price/   # Price submission interface
   components/         # Reusable UI components
   contexts/           # React Context (AuthContext)
   globals.css         # Tailwind CSS configuration
```

### Deployment Architecture
- **API**: Containerized Express.js application
- **Frontend**: Next.js static generation with SSR capabilities
- **Database**: PostgreSQL cloud instance (Neon)
- **Environment**: Docker-compose for local development

### Testing Strategy
- **API Testing**: Jest + Supertest with 80%+ coverage
- **Frontend Testing**: Framework ready (Jest configured) but tests pending
- **Integration Testing**: Full user flow testing implemented
- **Database Testing**: In-memory SQLite for fast test execution

### Key PoC Validations
 **User Authentication**: JWT-based auth with role management working
 **Data Models**: Comprehensive schema supporting all core features
 **Price Reporting**: End-to-end price submission and validation
 **Community Features**: Like/unlike system for price validation
 **Admin Interface**: Complete content management system
 **API Design**: RESTful endpoints with proper error handling
= **Frontend Polish**: UI/UX improvements and mobile optimization needed
= **Production Deployment**: Docker and CI/CD pipeline ready for implementation

The PoC successfully demonstrates the core value proposition: a functional price comparison platform with community validation that can scale to support thousands of users and products.
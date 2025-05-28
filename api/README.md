# 🚀 Bashrometer API - Backend Documentation

> **RESTful API עבור פלטפורמת השוואת מחירי בשר - Node.js + Express + PostgreSQL**

[![API Health](https://img.shields.io/badge/API-Healthy-green)](http://localhost:3000/api/health)
[![Tests](https://img.shields.io/badge/Tests-Passing-green)](./tests/)
[![Security](https://img.shields.io/badge/Security-Rate%20Limited-orange)](./middleware/rateLimitMiddleware.js)

## 🏗️ Architecture Overview

```
🚀 Bashrometer API Stack
├── 🛡️ Security Layer
│   ├── Rate Limiting (5 req/15min auth)
│   ├── JWT Authentication
│   ├── Input Validation
│   └── CORS Protection
├── 📊 Logging & Monitoring
│   ├── Winston Logger (Daily Rotation)
│   ├── HTTP Request Logging
│   ├── Security Event Tracking
│   └── Health Check Endpoint
├── 🗄️ Data Layer
│   ├── PostgreSQL Database
│   ├── Connection Pooling
│   ├── Parameterized Queries
│   └── Migration System
└── 🔄 API Layer
    ├── RESTful Endpoints
    ├── Error Handling
    ├── Response Formatting
    └── OpenAPI Documentation
```

## 📁 Project Structure

```
api/
├── 🔧 Infrastructure
│   ├── server.js              # Server Entry Point
│   ├── app.js                 # Express App Configuration
│   ├── db.js                  # Database Connection
│   └── package.json           # Dependencies & Scripts
├── 🛡️ Security & Middleware
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT Authentication
│   │   └── rateLimitMiddleware.js # Rate Limiting System
│   └── utils/
│       ├── logger.js              # Winston Logging System
│       └── priceCalculator.js     # Price Normalization
├── 🎯 Business Logic
│   ├── controllers/
│   │   ├── authController.js      # User Authentication
│   │   ├── productsController.js  # Product Management
│   │   ├── retailersController.js # Retailer Management
│   │   └── pricesController.js    # Price Reporting
│   └── routes/
│       ├── auth.js               # Auth Routes
│       ├── products.js           # Product Routes
│       ├── retailers.js          # Retailer Routes
│       ├── prices.js             # Price Routes
│       └── analytics.js          # Analytics Routes
├── 🗄️ Database
│   ├── schema.sql               # Database Schema
│   └── migrations/              # Database Migrations
├── 🧪 Testing
│   ├── tests/                   # Test Suite
│   ├── jest.config.js           # Jest Configuration
│   └── jest.setup.js            # Test Setup
└── 📊 Monitoring
    ├── logs/                    # Application Logs
    └── openapi.yaml             # API Documentation
```

## 🚀 Quick Start

### Development Setup

```bash
# 1. Install Dependencies
npm install

# 2. Environment Configuration
cp .env.example .env
# Edit .env with your database credentials

# 3. Database Setup
# Make sure PostgreSQL is running
npm run migrate  # Run database migrations

# 4. Start Development Server
npm run dev      # With auto-reload
# or
npm start        # Production mode
```

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bashrometer

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# Logging
LOG_LEVEL=debug
```

### Health Check

```bash
# Check API Health
curl http://localhost:3000/api/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2025-05-28T16:39:28.535Z",
  "service": "bashrometer-api",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 213.78,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": "45ms"
    },
    "memory": {
      "usage": 65,
      "heapUsed": "45MB",
      "heapTotal": "68MB"
    }
  }
}
```

## 🛡️ Security Features

### Rate Limiting
```javascript
// Authentication endpoints: 5 requests per 15 minutes
// Block duration: 30 minutes after limit exceeded
// General API: 100 requests per minute

// Rate limit headers included in responses:
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2025-05-28T17:00:00.000Z
```

### Authentication
```javascript
// JWT Token Format
Authorization: Bearer <jwt-token>

// Token Payload
{
  "userId": 123,
  "email": "user@example.com",
  "role": "admin",
  "name": "User Name",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Input Validation
- All user inputs validated and sanitized
- SQL injection prevention with parameterized queries
- XSS protection with proper escaping
- File upload restrictions (future feature)

## 📊 Logging System

### Log Levels
- **ERROR**: Application errors, uncaught exceptions
- **WARN**: Security events, rate limiting, suspicious activity
- **INFO**: User actions, database operations, business events
- **HTTP**: HTTP requests and responses
- **DEBUG**: Detailed debugging information

### Log Files
```
logs/
├── error-2025-05-28.log      # Error logs only
├── combined-2025-05-28.log   # All logs except debug
├── access-2025-05-28.log     # HTTP access logs
├── exceptions.log            # Uncaught exceptions
└── rejections.log            # Unhandled promise rejections
```

### Log Format
```json
{
  "timestamp": "2025-05-28 16:39:28",
  "level": "INFO",
  "message": "User login successful",
  "userId": 123,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/auth/login"
}
```

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Products
```sql
products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(255),
  unit_of_measure VARCHAR(50),
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### Retailers
```sql
retailers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  chain VARCHAR(255),
  address TEXT,
  type VARCHAR(100),
  geo_lat DECIMAL(10,8),
  geo_lon DECIMAL(11,8),
  is_active BOOLEAN DEFAULT true
)
```

#### Price Reports
```sql
price_reports (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  retailer_id INTEGER REFERENCES retailers(id),
  user_id INTEGER REFERENCES users(id),
  regular_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  is_on_sale BOOLEAN DEFAULT false,
  quantity_for_price DECIMAL(10,2),
  unit_for_price VARCHAR(50),
  submission_date TIMESTAMP DEFAULT NOW()
)
```

## 🔌 API Endpoints

### Authentication Routes

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "name": "User Name",
    "email": "user@example.com",
    "role": "user"
  },
  "token": "jwt.token.here"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": { /* user object */ },
  "token": "jwt.token.here"
}
```

```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 123,
  "name": "User Name",
  "email": "user@example.com",
  "role": "user"
}
```

### Product Management Routes

```http
GET /api/products?limit=20&offset=0&name_like=beef&category=meat

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "Beef Steak",
      "brand": "Quality Meat Co",
      "category": "beef",
      "unit_of_measure": "kg",
      "min_price_per_100g": 45.50,
      "is_active": true
    }
  ],
  "page_info": {
    "total_items": 150,
    "limit": 20,
    "offset": 0,
    "current_page_count": 20
  }
}
```

```http
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Premium Beef",
  "brand": "Quality Meat",
  "category": "beef", 
  "unit_of_measure": "kg",
  "description": "High quality beef cuts"
}

Response: 201 Created
{
  "id": 456,
  "name": "Premium Beef",
  "created_at": "2025-05-28T16:39:28.535Z"
}
```

### Price Reporting Routes

```http
POST /api/prices
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "retailer_id": 5,
  "regular_price": 89.90,
  "sale_price": 79.90,
  "is_on_sale": true,
  "quantity_for_price": 1.0,
  "unit_for_price": "kg",
  "notes": "Fresh premium cut"
}

Response: 201 Created
{
  "id": 789,
  "message": "Price report submitted successfully"
}
```

### Analytics Routes (Admin Only)

```http
GET /api/analytics
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "totalUsers": 1250,
  "totalProducts": 89,
  "totalRetailers": 34,
  "totalPriceReports": 5420,
  "averagePricePerKg": 67.45,
  "topCategories": [
    { "category": "beef", "count": 234 },
    { "category": "chicken", "count": 189 }
  ]
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js

# Run tests in watch mode
npm test -- --watch
```

### Test Structure

```javascript
// Example test structure
describe('Products API Endpoints', () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data  
  });

  it('should create a new product with admin token', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData)
      .expect(201);
      
    expect(response.body.name).toBe(productData.name);
  });
});
```

### Test Coverage
- ✅ Authentication endpoints
- ✅ Product CRUD operations
- ✅ Retailer CRUD operations  
- ✅ Price reporting functionality
- ✅ Authorization middleware
- ✅ Error handling

## 🔄 Development Workflow

### Code Standards
```bash
# Linting (if configured)
npm run lint

# Security audit
npm audit

# Check for vulnerabilities
npm audit fix
```

### Database Migrations
```bash
# Create new migration
node create_migration.js "add_new_column"

# Run migrations
node run_migration.js

# Reset database (development only)
npm run db:reset
```

### Debugging
```bash
# Start with debugging
DEBUG=* npm run dev

# Check logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Monitor health
watch -n 5 'curl -s http://localhost:3000/api/health | jq'
```

## 📈 Performance & Monitoring

### Performance Metrics
- **Response Time**: < 200ms average
- **Memory Usage**: < 512MB in production
- **CPU Usage**: < 50% under normal load
- **Database Connections**: Pooled with max 20 connections

### Monitoring Endpoints
```bash
# Health check
GET /api/health

# System stats (admin only)
GET /api/admin/stats

# Rate limit status
# Check X-RateLimit-* headers in responses
```

### Log Monitoring
```bash
# Watch error logs
tail -f logs/error-*.log

# Monitor security events
grep "SECURITY:" logs/combined-*.log

# Check rate limiting
grep "RATE_LIMIT:" logs/combined-*.log
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Security audit clean
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Monitoring setup

### Production Configuration
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db:5432/bashrometer
JWT_SECRET=production-secret-key-64-characters-minimum
ALLOWED_ORIGINS=https://your-domain.com
LOG_LEVEL=info
```

### Health Monitoring
```bash
# Production health check
curl https://your-domain.com/api/health

# Monitor logs
docker logs bashrometer-api-prod --follow

# Check metrics
curl https://your-domain.com/api/health | jq '.checks'
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-endpoint`
3. Follow existing code patterns
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit pull request

### Code Guidelines
- Use async/await for asynchronous operations
- Follow RESTful conventions
- Add comprehensive error handling
- Include JSDoc comments for functions
- Validate all inputs
- Log important events

### Adding New Endpoints
1. Create controller function
2. Add route definition
3. Add middleware (auth, validation)
4. Write tests
5. Update OpenAPI documentation
6. Add logging

## 📞 Support

### Troubleshooting
1. **Database Connection Issues**: Check DATABASE_URL and PostgreSQL service
2. **Authentication Failures**: Verify JWT_SECRET configuration
3. **Rate Limiting**: Check X-RateLimit headers in responses
4. **CORS Errors**: Verify ALLOWED_ORIGINS setting

### Useful Commands
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Test JWT token
node -e "console.log(require('jsonwebtoken').verify('token', 'secret'))"

# Check rate limit status
curl -I http://localhost:3000/api/auth/login
```

---

**🚀 Production Ready! Backend API is fully operational with enterprise-grade security, monitoring, and documentation.**
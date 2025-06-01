# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Bashrometer v2 is a monorepo containing a community-driven meat price comparison platform with Node.js/Express API and Next.js frontend using TypeScript and PostgreSQL.

## Development Commands

### Root-level Commands
```bash
npm run install:all    # Install dependencies for both API and frontend
npm run dev           # Start both API (port 3000) and frontend (port 3001)
npm run dev:api       # API only with nodemon
npm run dev:frontend  # Frontend only with Next.js turbopack
npm test             # Run API tests with Jest
npm run build        # Build both services
```

### API-specific Commands (in api/ directory)
```bash
npm test             # Jest tests with 30s timeout
npm run dev          # Development with nodemon
npm start           # Production server
```

### Frontend-specific Commands (in frontend/ directory)
```bash
npm run dev          # Next.js development server
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture Patterns

### Backend Structure
- **MVC Pattern**: Routes → Controllers → Database with middleware chain
- **Authentication**: JWT-based with role-based authorization (user/admin/editor)
- **Database**: PostgreSQL with connection pooling, parameterized queries
- **Error Handling**: Centralized error handler with environment-aware responses

### Frontend Structure
- **Next.js App Router**: File-based routing in `src/app/`
- **Context Pattern**: Global auth state via `AuthContext`
- **RTL Support**: Hebrew interface with Tailwind RTL classes

### Database Schema Key Relationships
- `prices` table links users, products, and retailers
- `price_report_likes` enables community validation
- Auto-updating timestamps via database triggers
- Comprehensive indexing for query performance

## Environment Configuration

### API (.env)
```bash
NODE_ENV=development|test|production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=your-strong-secret-key
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Testing Environment
- Uses separate `.env.test` with isolated test database
- Test database is cleaned before/after test runs

## API Design Conventions

### Response Formats
```javascript
// Success with pagination
{ data: [...], page_info: { total_items, limit, offset, current_page } }

// Errors
{ error: "Description", details: "Additional info" }

// Authentication
{ message: "Success", user: {...}, token: "jwt..." }
```

### Authentication Flow
- JWT tokens expire in 2 hours
- Role-based access: user/admin/editor
- Protected routes use `authenticateToken` middleware
- Frontend stores tokens in localStorage

## Testing Strategy

### Current Coverage
- **API**: Comprehensive Jest + Supertest tests for all endpoints
- **Database**: Test isolation with cleanup before/after
- **Frontend**: Framework configured but tests not implemented yet

### Test Patterns
```javascript
// Database cleanup pattern
beforeAll(async () => {
  await pool.query('DELETE FROM price_report_likes');
  await pool.query('DELETE FROM prices');
  await pool.query('DELETE FROM users');
});
```

## Key Features Implementation

### Community Price Reporting
- Price submission via `POST /api/prices`
- Status workflow: pending → approved
- Rich metadata: validity dates, units, sale prices

### Community Validation
- Like/unlike system via `POST /api/prices/:id/like` (toggle)
- Real-time UI updates
- Junction table `price_report_likes`

### Price Normalization
- `calcPricePer100g()` utility in `utils/priceCalculator.js`
- Supports multiple units: 100g, kg, g, unit, package
- Enables cross-package-size comparisons

## Development Patterns

### Adding New API Endpoint
1. Create controller in `controllers/`
2. Add route in `routes/`
3. Write tests in `tests/`
4. Update `openapi.yaml`

### Adding Frontend Page
1. Create `page.tsx` in `src/app/[route]/`
2. Add navigation to `Navbar.tsx`
3. Implement API integration
4. Add auth checks if needed

### Database Changes
1. Update `schema.sql`
2. Modify affected controllers
3. Update tests
4. Consider migration strategy

## Common Issues

### CORS Problems
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check credentials configuration in CORS setup

### Database Connections
- Confirm `DATABASE_URL` SSL settings for production
- Ensure test database isolation
- Check Neon/PostgreSQL connection limits

### Authentication Issues
- Verify JWT secret consistency
- Check 2-hour token expiration
- Ensure Bearer token format

## Important Notes

### Testing Requirements
- Always run `npm test` in API directory after backend changes
- Database tests require PostgreSQL connection
- Frontend tests framework ready but not implemented

### Security Considerations
- Never commit secrets to repository
- Use parameterized queries for all database operations
- JWT tokens have 2-hour expiration for security

### Code Quality
- API has 80%+ test coverage requirement
- Follow existing patterns for error handling
- Use role-based authorization for protected operations
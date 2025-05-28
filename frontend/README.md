# 🎨 Bashrometer Frontend - Client-Side Documentation

> **React + Next.js 15 פלטפורמה עבור השוואת מחירי בשר - עם תמיכה מלאה ב-RTL ועברית**

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)
[![RTL Support](https://img.shields.io/badge/RTL-Hebrew-0078d4)](https://developer.mozilla.org/en-US/docs/Web/CSS/direction)

## 🏗️ Architecture Overview

```
frontend/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── admin/             # Admin panel pages
│   │   ├── login/             # Authentication pages
│   │   ├── products/          # Product browsing
│   │   └── report-price/      # Price reporting
│   ├── components/            # Reusable UI components
│   └── contexts/             # React Context providers
├── public/                    # Static assets
└── Dockerfile                # Container configuration
```

## 🚀 Quick Start

### Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

🌐 **Frontend:** http://localhost:3000

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Key Features

### 🔐 Authentication System
- **JWT-based authentication** with secure token storage
- **Role-based access control** (User/Admin)
- **Protected routes** with automatic redirects
- **Registration & Login** with validation

### 🛍️ Product Management
- **Product browsing** with search and filtering
- **Price comparison** across multiple retailers
- **Community price reporting** system
- **Admin product management** interface

### 🌍 Internationalization
- **Hebrew RTL support** with proper text direction
- **Responsive design** optimized for mobile devices
- **Accessibility features** for better UX
- **Cross-browser compatibility**

### 📱 User Interface
- **Modern React components** with TypeScript
- **Tailwind CSS** for consistent styling
- **Component-based architecture** for maintainability
- **Loading states** and error handling

## 🛠️ Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework | 15.0+ |
| **TypeScript** | Type Safety | 5.0+ |
| **Tailwind CSS** | Styling | Latest |
| **React Context** | State Management | Built-in |
| **JWT** | Authentication | Via API |

## 📁 Project Structure

### Pages (App Router)
- **`/`** - Homepage with product overview
- **`/products`** - Product browsing and search
- **`/products/[id]`** - Individual product details
- **`/report-price`** - Community price reporting
- **`/login`** - User authentication
- **`/register`** - User registration
- **`/admin`** - Admin dashboard (protected)

### Components
- **`Navbar`** - Navigation with auth status
- **`Footer`** - Site footer with links
- **`ProductCard`** - Product display component
- **`AdminPagination`** - Admin interface pagination

### Contexts
- **`AuthContext`** - Authentication state management

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_ENV=development
```

### Next.js Configuration

Key configurations in `next.config.ts`:
```typescript
const nextConfig = {
  // API proxy configuration
  // Asset optimization
  // Build optimization
}
```

## 🎨 Styling Guide

### Tailwind CSS Classes
```css
/* RTL Support */
.rtl-text { direction: rtl; text-align: right; }

/* Color Scheme */
.primary { @apply bg-blue-600 text-white; }
.secondary { @apply bg-gray-200 text-gray-800; }

/* Responsive Design */
.responsive-grid { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3; }
```

### Hebrew Typography
- **Font Family:** System fonts with Hebrew fallbacks
- **Text Direction:** RTL for Hebrew content
- **Spacing:** Adjusted for Hebrew text rendering

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests:** Component testing with Jest
- **Integration Tests:** Page-level testing
- **E2E Tests:** User workflow testing

## 🚢 Deployment

### Docker Deployment
```bash
# Build container
docker build -t bashrometer-frontend .

# Run container
docker run -p 3000:3000 bashrometer-frontend
```

### Production Environment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔒 Security Features

### Client-Side Security
- **XSS Protection:** Input sanitization
- **CSRF Protection:** Token validation
- **Secure Storage:** JWT token management
- **Route Protection:** Authentication guards

### Data Validation
- **Form Validation:** Client-side validation
- **API Response Validation:** Type checking
- **Error Boundaries:** Graceful error handling

## 📊 Performance Optimization

### Next.js Optimizations
- **Image Optimization:** Automatic image optimization
- **Code Splitting:** Automatic route-based splitting
- **Static Generation:** Pre-rendered pages where possible
- **Caching:** API response caching

### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze
```

## 🐛 Troubleshooting

### Common Issues

#### Hydration Errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### API Connection Issues
```bash
# Check API URL in environment
echo $NEXT_PUBLIC_API_URL

# Verify API server is running
curl http://localhost:5000/api/health
```

#### Styling Issues
```bash
# Rebuild Tailwind CSS
npm run dev
```

## 📚 Development Resources

### Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

### Project-Specific
- **API Documentation:** See `../api/README.md`
- **Deployment Guide:** See `../README.md`
- **Architecture Overview:** Main project README

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with TypeScript
3. Add tests for new functionality
4. Run linting and type checking
5. Submit pull request

### Code Standards
- **TypeScript:** Strict mode enabled
- **ESLint:** Airbnb configuration
- **Prettier:** Automatic code formatting
- **Component Structure:** Functional components with hooks

## 📈 Monitoring

### Development Tools
- **React DevTools:** Component inspection
- **Next.js DevTools:** Performance monitoring
- **TypeScript Compiler:** Type checking
- **ESLint:** Code quality

### Production Monitoring
- **Error Tracking:** Integration with logging system
- **Performance Metrics:** Core Web Vitals
- **User Analytics:** Usage tracking
- **API Monitoring:** Response time tracking

---

**📍 Part of:** [Bashrometer Full Stack Application](../README.md)  
**🔗 Related:** [API Documentation](../api/README.md)  
**🐳 Deployment:** [Docker Configuration](./Dockerfile)
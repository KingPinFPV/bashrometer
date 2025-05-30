// server.js
require('dotenv').config();

console.log('🚀 Starting Basarometer API Server...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

const PORT = process.env.PORT || 3001;
console.log('🔌 Requested Port:', PORT);

// Check critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  console.log('ℹ️ Server will start but database operations may fail');
}

const express = require('express');
const cors = require('cors');

console.log('✅ Express loaded');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://basarometer.org',
    'https://www.basarometer.org',
    'https://bashrometer-fullstack.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Pre-flight OPTIONS handler
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('✅ CORS configured for basarometer.org');
console.log('✅ Middleware configured');

// Health check endpoint (simple - no database dependency)
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

console.log('✅ Health endpoint configured');

// CRITICAL: Load and mount routes SYNCHRONOUSLY
console.log('🔄 Loading and mounting routes...');

try {
  // Load route modules
  console.log('📂 Loading route modules...');
  
  const cutsRoutes = require('./routes/cuts');
  console.log('✅ Cuts routes module loaded');
  
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes module loaded');
  
  const pricesRoutes = require('./routes/prices');
  console.log('✅ Prices routes module loaded');
  
  const productsRoutes = require('./routes/products');
  console.log('✅ Products routes module loaded');
  
  const categoriesRoutes = require('./routes/categories');
  console.log('✅ Categories routes module loaded');
  
  console.log('🔗 Mounting routes to Express app...');
  
  // Mount routes to Express app
  app.use('/api/cuts', cutsRoutes);
  console.log('✅ /api/cuts mounted');
  
  app.use('/api/auth', authRoutes);
  console.log('✅ /api/auth mounted');
  
  app.use('/api/prices', pricesRoutes);
  console.log('✅ /api/prices mounted');
  
  app.use('/api/products', productsRoutes);
  console.log('✅ /api/products mounted');
  
  app.use('/api/categories', categoriesRoutes);
  console.log('✅ /api/categories mounted');
  
  console.log('🎯 All routes successfully mounted to Express app');
  
} catch (routeError) {
  console.error('❌ CRITICAL: Failed to load/mount routes:', routeError);
  console.error('📋 Stack:', routeError.stack);
  
  // Add basic fallback routes
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'API partially available',
      error: 'Route loading failed',
      timestamp: new Date().toISOString(),
      routesLoaded: false
    });
  });
}

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Basarometer API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routesLoaded: true,
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug routes endpoint
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  function extractRoutes(stack, basePath = '') {
    stack.forEach(layer => {
      if (layer.route) {
        routes.push({
          method: Object.keys(layer.route.methods)[0].toUpperCase(),
          path: basePath + layer.route.path
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = layer.regexp.source
          .replace(/\\\//g, '/')
          .replace(/\(\?\:/g, '')
          .replace(/\)\?\(\?\=/g, '')
          .replace(/\|\)/g, '')
          .replace(/\$/, '')
          .replace(/\^/, '');
        extractRoutes(layer.handle.stack, routerPath);
      }
    });
  }
  
  if (app._router && app._router.stack) {
    extractRoutes(app._router.stack);
  }
  
  res.json({
    message: 'Registered routes',
    timestamp: new Date().toISOString(),
    routes: routes,
    totalRoutes: routes.length,
    routesLoaded: true
  });
});

console.log('✅ Debug endpoints configured');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler (must be last)
app.use('*', (req, res) => {
  console.log(`❌ 404 for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/health', '/api/status', '/api/debug/routes']
  });
});

console.log('✅ Error handlers configured');

// Database initialization (async after server starts)
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    if (process.env.DATABASE_URL) {
      const { initializeDatabase } = require('./scripts/init-database');
      await initializeDatabase();
      console.log('✅ Database initialized');
    } else {
      console.log('ℹ️ No DATABASE_URL - skipping database initialization');
    }
  } catch (error) {
    console.warn('⚠️ Database initialization warning:', error.message);
  }
}

// Start server
console.log('🔄 Starting server...');

const server = app.listen(PORT, '0.0.0.0', async (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Status: http://0.0.0.0:${PORT}/api/status`);
  console.log(`🔗 Debug routes: http://0.0.0.0:${PORT}/api/debug/routes`);
  console.log(`📦 Products API: http://0.0.0.0:${PORT}/api/products`);
  console.log(`🔪 Cuts API: http://0.0.0.0:${PORT}/api/cuts`);
  console.log(`📂 Categories API: http://0.0.0.0:${PORT}/api/categories`);
  console.log(`🔐 Auth API: http://0.0.0.0:${PORT}/api/auth`);
  console.log('🚀 All API endpoints should be functional!');
  
  // Initialize database after server starts
  setTimeout(initializeDatabase, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM received');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT received');
  server.close(() => {
    console.log('✅ Server closed');  
    process.exit(0);
  });
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🔚 Server setup completed');

module.exports = app;
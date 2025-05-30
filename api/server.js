// server.js
require('dotenv').config();

console.log('🚀 Starting Basarometer API Server...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

const PORT = process.env.PORT || 3001;
console.log('🔌 Requested Port:', PORT);

// בדיקת משתני סביבה קריטיים
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  console.log('ℹ️ Server will start but database operations will fail');
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

// Health check פשוט - בלי תלות במסד נתונים
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

// Critical route loading and mounting
let routesLoaded = false;

async function loadAndMountRoutes() {
  try {
    console.log('🔄 Loading and mounting routes BEFORE server start...');
    
    // Database initialization first
    if (process.env.DATABASE_URL) {
      console.log('🔄 Testing database connection...');
      try {
        const db = require('./db');
        
        const client = await db.pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Database connection successful');
        
        // Initialize database tables
        try {
          const { initializeDatabase } = require('./scripts/init-database');
          await initializeDatabase();
          console.log('✅ Database initialization completed');
        } catch (err) { 
          console.warn('⚠️ Database init warning:', err.message); 
        }
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        console.log('⚠️ Continuing without database-dependent features');
      }
    }
    
    console.log('📂 Loading route modules...');
    
    // Load all route modules
    const cutsRoutes = require('./routes/cuts');
    console.log('✅ Cuts routes module loaded');
    
    const authRoutes = require('./routes/auth');
    console.log('✅ Auth routes module loaded');
    
    const pricesRoutes = require('./routes/prices');
    console.log('✅ Prices routes module loaded');
    
    const productsRoutes = require('./routes/products');
    console.log('✅ Products routes module loaded');

    console.log('🔗 Mounting routes to Express app...');
    
    // CRITICAL: Mount routes to Express app in correct order
    app.use('/api/cuts', cutsRoutes);
    console.log('✅ /api/cuts mounted');
    
    app.use('/api/auth', authRoutes);
    console.log('✅ /api/auth mounted');
    
    app.use('/api/prices', pricesRoutes);
    console.log('✅ /api/prices mounted');
    
    app.use('/api/products', productsRoutes);
    console.log('✅ /api/products mounted');
    
    routesLoaded = true;
    console.log('🎯 All routes successfully mounted to Express app');
    
    return true;
    
  } catch (error) {
    console.error('❌ Critical error in route loading:', error.message);
    console.error('📋 Stack:', error.stack);
    routesLoaded = false;
    return false;
  }
}

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API available',
    routesLoaded: routesLoaded,
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  // Get all routes from Express app
  app._router.stack.forEach((middleware) => {
    if (middleware.route) { // Routes registered directly on the app
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') { // Router middleware
      const routerRoutes = [];
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routerRoutes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path
          });
        }
      });
      routes.push({
        baseUrl: middleware.regexp.source.replace(/\\\//g, '/').replace(/\$|\^/g, '').replace(/\?\?\*/g, ''),
        routes: routerRoutes
      });
    }
  });
  
  res.json({
    message: 'Registered routes',
    timestamp: new Date().toISOString(),
    routes: routes,
    routesLoaded: routesLoaded
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    routesLoaded: routesLoaded,
    availableEndpoints: ['/health', '/api/status']
  });
});

console.log('🔄 Starting Basarometer API with route mounting...');

// **CRITICAL: Load and mount routes BEFORE server starts listening**
loadAndMountRoutes().then(success => {
  if (success) {
    console.log('🎯 Routes mounted successfully - starting server...');
  } else {
    console.warn('⚠️ Some routes failed to mount - starting server with basic functionality...');
  }
  
  // Start the server AFTER routes are mounted
  const server = app.listen(PORT, '0.0.0.0', (err) => {
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
    console.log(`🔐 Auth API: http://0.0.0.0:${PORT}/api/auth`);
    console.log(`🔪 Cuts API: http://0.0.0.0:${PORT}/api/cuts`);
    
    if (success) {
      console.log('🚀 All API endpoints should be functional!');
    } else {
      console.log('⚠️ Some endpoints may not work due to route mounting failures');
    }
  });
  
}).catch(err => {
  console.error('💥 Critical failure in route mounting:', err.message);
  console.error('📋 Stack:', err.stack);
  
  // Start server anyway with basic functionality
  const server = app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    
    console.log(`⚠️ Server running on port ${PORT} (limited functionality)`);
    console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`📊 Status: http://0.0.0.0:${PORT}/api/status`);
  });
});

// Remove timeout fallback since we now wait for routes before starting

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
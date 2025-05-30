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

// טען routes בצורה defensive
let routesLoaded = false;

async function loadRoutes() {
  try {
    console.log('📁 Starting to load routes...');
    
    // בדוק חיבור למסד נתונים ראשית
    if (process.env.DATABASE_URL) {
      console.log('🔄 Testing database connection...');
      try {
        const db = require('./db');
        
        // בדיקה פשוטה
        const client = await db.pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Database connection successful');
        
        // Initialize database tables
        try {
          const { initializeDatabase } = require('./scripts/init-database');
          await initializeDatabase();
        } catch (err) { 
          console.warn('⚠️ Database init warning:', err.message); 
        }
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        console.log('⚠️ Continuing without database-dependent routes');
      }
    }
    
    console.log('📂 Loading route files...');
    
    // נסה לטעון routes אחד אחד
    try {
      const cutsController = require('./controllers/cutsController');
      console.log('✅ Cuts controller loaded');
    } catch (e) {
      console.error('❌ Cuts controller failed:', e.message);
    }
    
    try {
      const cutsRoutes = require('./routes/cuts');
      app.use('/api/cuts', cutsRoutes);
      console.log('✅ Cuts routes loaded');
    } catch (e) {
      console.error('❌ Cuts routes failed:', e.message);
    }
    
    try {
      const authRoutes = require('./routes/auth');
      app.use('/api/auth', authRoutes);
      console.log('✅ Auth routes loaded');
    } catch (e) {
      console.error('❌ Auth routes failed:', e.message);
    }
    
    try {
      const pricesRoutes = require('./routes/prices');
      app.use('/api/prices', pricesRoutes);
      console.log('✅ Prices routes loaded');
    } catch (e) {
      console.error('❌ Prices routes failed:', e.message);
    }
    
    try {
      const productsRoutes = require('./routes/products');
      app.use('/api/products', productsRoutes);
      console.log('✅ Products routes loaded');
    } catch (e) {
      console.error('❌ Products routes failed:', e.message);
    }
    
    console.log('✅ Route loading completed (some may have failed)');
    routesLoaded = true;
    
  } catch (error) {
    console.error('❌ Critical error in route loading:', error.message);
    console.error('📋 Stack:', error.stack);
    
    // הוסף basic endpoints אפילו אם Routes נכשלו
    app.get('/api/status', (req, res) => {
      res.json({ 
        status: 'API partially available',
        error: 'Routes loading failed',
        timestamp: new Date().toISOString(),
        routesLoaded: false
      });
    });
    
    console.log('⚠️ Added fallback endpoints');
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

console.log('🔄 Starting server...');

// **זה החלק הקריטי - שרת חייב להתחיל**
const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Status: http://0.0.0.0:${PORT}/api/status`);
  
  // טען routes לאחר שהשרת עלה
  setTimeout(() => {
    loadRoutes().then(() => {
      console.log('🎯 Routes loading completed');
    }).catch(err => {
      console.error('💥 Routes loading crashed:', err.message);
    });
  }, 1000);
});

// Timeout fallback - אם השרת לא עולה תוך 10 שניות
setTimeout(() => {
  if (!server.listening) {
    console.error('❌ Server startup timeout - forcing exit');
    process.exit(1);
  }
}, 10000);

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
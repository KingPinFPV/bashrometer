// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { logger, httpLogger } = require('./utils/logger');

const db = require('./db'); // וודא שה-path נכון לקובץ db.js

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const retailersRoutes = require('./routes/retailers');
const pricesRoutes = require('./routes/prices');
const autocompleteRoutes = require('./routes/autocomplete');
const requestsRoutes = require('./routes/requests');
const analyticsRoutes = require('./routes/analytics');
const categoriesRoutes = require('./routes/categories');
const cutsRoutes = require('./routes/cuts');
const adminRoutes = require('./routes/admin');
// const normalizeRoutes = require('./routes/normalize');

const app = express();

// 1. CORS Middleware - הגדרה מפורטת ומוקדמת
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002', // Frontend port for development
  'http://localhost:3001', // Alternative frontend port
  // הוסף כאן עוד Origins אם יש לך סביבות נוספות
  // כתובות פרודקשן:
  'https://basarometer.org',
  'https://www.basarometer.org',
  'https://bashrometer-frontend.onrender.com' 
  // 'https://your-codespace-name-random-string.app.github.dev' 
];

// הערה: אם אתה רוצה שה-allowedOrigins יתעדכנו ממשתני סביבה, השתמש בלוגיקה דומה לזו:
// const DYNAMIC_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
// const finalAllowedOrigins = [...new Set([...allowedOrigins, ...DYNAMIC_ALLOWED_ORIGINS])]; // מאחד ומונע כפילויות

const corsOptions = {
  origin: function (origin, callback) {
    // הדפס לוגים לדיבאגינג של CORS
    // console.log("CORS Check - Incoming Origin:", origin);
    // console.log("CORS Check - Allowed Origins:", allowedOrigins);

    // אפשר גישה ללא origin (למשל, Postman, curl) או אם ה-origin ברשימה המותרת
    // אם אתה משתמש ב-finalAllowedOrigins מהדוגמה למעלה, החלף את allowedOrigins כאן:
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // console.log("CORS Check - Origin Allowed:", origin || 'No Origin');
      callback(null, true);
    } else {
      console.warn(`CORS: Origin not allowed: ${origin}`); // לוג לניפוי בעיות CORS
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // ודא ש-OPTIONS כלול
  allowedHeaders: "Content-Type,Authorization,X-Requested-With", // הוספתי X-Requested-With, לפעמים נדרש
  credentials: true,
  optionsSuccessStatus: 204
};

// חשוב מאוד: טפל בבקשות OPTIONS (preflight) לפני כל ה-middleware האחרים ולפני app.use(cors(corsOptions)) הכללי.
// זה מבטיח שבקשות preflight יקבלו תגובה מהירה עם ה-headers הנכונים.
app.options('*', cors(corsOptions)); 

// לאחר מכן, הפעל את CORS עבור כל שאר הבקשות.
app.use(cors(corsOptions));


// 2. HTTP Request Logging - אחרי CORS
if (process.env.NODE_ENV !== 'test') {
  app.use(httpLogger);
}

// 3. Body Parsers - אחרי CORS ו-Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint (no DB dependency)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 'unknown',
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// Health check endpoint for Render (must match /healthz in Render dashboard)
app.get('/healthz', async (req, res) => {
  try {
    // בדיקת חיבור לבסיס נתונים
    const dbResult = await db.query('SELECT 1 as test');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbResult.rows.length > 0 ? 'connected' : 'disconnected',
      port: process.env.PORT || 10000,
      environment: process.env.NODE_ENV || 'production',
      version: '2.0.0',
      uptime: process.uptime()
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected',
      port: process.env.PORT || 'unknown'
    });
  }
});

// Simple ping endpoint for basic connectivity test
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

// Enhanced logging for production debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 3. API Routes - אחרי CORS ו-Body Parsers
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/retailers', retailersRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/autocomplete', autocompleteRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoriesRoutes);
console.log('✅ /api/categories mounted');
app.use('/api/cuts', cutsRoutes);
console.log('✅ /api/cuts mounted');
app.use('/api/admin', adminRoutes);
console.log('✅ /api/admin mounted');
// app.use('/api/normalize', normalizeRoutes);

// ========== ROOT & HEALTH ROUTES ==========
// Root route - חשוב להוסיף לפני כל הroutes האחרים
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Basarometer API Server is running! 🥩',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthz: '/healthz',
      products: '/api/products',
      categories: '/api/categories',
      cuts: '/api/cuts',
      auth: '/api/auth',
      prices: '/api/prices',
      retailers: '/api/retailers',
      autocomplete: '/api/autocomplete',
      requests: '/api/requests',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint for CI/CD and monitoring
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    
    // Check database connection
    let dbStatus = 'unknown';
    let dbLatency = null;
    
    if (db.pool) {
      const start = Date.now();
      try {
        await db.pool.query('SELECT 1');
        dbLatency = Date.now() - start;
        dbStatus = 'healthy';
      } catch (error) {
        console.error('Health check DB error:', error);
        dbStatus = 'unhealthy';
      }
    }

    const healthData = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'bashrometer-api',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency ? `${dbLatency}ms` : null
        },
        memory: {
          usage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        }
      }
    };

    // Set appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'bashrometer-api',
      error: 'Health check failed'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  // Use Winston logger instead of console.error
  logger.error("Global Error Handler Caught:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
  
  if (err.code && typeof err.code === 'string' && (err.code.startsWith('22') || err.code.startsWith('23'))) {
    console.error("PostgreSQL Data Error:", err.detail || err.message);
    return res.status(400).json({ error: 'Invalid data or constraint violation.', details: err.detail || err.message });
  }

  res.status(err.statusCode || 500).json({ 
    error: err.customMessage || 'Something broke on the server!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

module.exports = app;

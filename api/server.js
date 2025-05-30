// server.js
require('dotenv').config();

// הוספת לוגים מפורטים
console.log('🚀 Starting Basarometer API Server...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Requested Port:', process.env.PORT || 'not set');

const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;
console.log('🎯 Final Port:', PORT);

// Start server with error handling
const startServer = async () => {
  try {
    console.log('🔄 Initializing server...');
    
    // Import and verify critical modules
    console.log('📁 Loading app module...');
    if (!app) {
      throw new Error('App module failed to load');
    }
    console.log('✅ App module loaded successfully');
    
    // Start server with explicit host binding for Render
    const server = app.listen(PORT, '0.0.0.0', (err) => {
      if (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
      }
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      
      // Log all environment variables for debugging (be careful with secrets)
      console.log('🔍 Environment variables:');
      console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
      console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
      console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
    });
    
    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`📤 ${signal} received, shutting down gracefully`);
      server.close(() => {
        console.log('✅ Server closed');
        if (db.pool) {
          db.pool.end(() => {
            console.log('✅ Database connection pool closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Check DB connection after server starts (non-blocking)
    if (db.checkConnection) {
      setTimeout(async () => {
        try {
          console.log('🔄 Testing database connection...');
          await db.checkConnection();
          console.log('✅ Database connection verified');
        } catch (error) {
          console.error('⚠️ Database connection check failed:', error.message);
          console.error('   Server will continue running but DB operations may fail');
        }
      }, 2000);
    } else {
      console.log('ℹ️ No database connection check function available');
    }
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      console.error('Stack:', reason?.stack);
      process.exit(1);
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Critical error during server startup:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('💥 Fatal error starting server:', error);
  process.exit(1);
});
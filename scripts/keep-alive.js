#!/usr/bin/env node

const https = require('https');

const API_URL = 'https://bashrometer-api.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 דקות

async function pingServer() {
  return new Promise((resolve) => {
    const req = https.request(`${API_URL}/healthz`, { timeout: 30000 }, (res) => {
      console.log(`✅ Ping successful: ${res.statusCode} at ${new Date().toISOString()}`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.error(`❌ Ping failed at ${new Date().toISOString()}:`, error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error(`⏰ Ping timeout at ${new Date().toISOString()}`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

console.log(`🚀 Keep-alive service started for ${API_URL}`);
console.log(`⏰ Pinging every ${PING_INTERVAL / 1000 / 60} minutes`);

// Ping מיידי
pingServer();

// Ping כל 10 דקות
setInterval(pingServer, PING_INTERVAL);
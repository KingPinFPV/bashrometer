// routes/cuts.js
const express = require('express');
const router = express.Router();

console.log('🔄 Loading cuts routes...');

let cutsController;
try {
  cutsController = require('../controllers/cutsController');
  console.log('✅ Cuts controller loaded successfully');
  
  // Verify controller functions
  const functions = Object.keys(cutsController);
  console.log('🔍 Available controller functions:', functions);
  
  functions.forEach(funcName => {
    const func = cutsController[funcName];
    console.log(`🔍 ${funcName}: ${typeof func}`);
    
    if (typeof func !== 'function') {
      console.error(`❌ ${funcName} is not a function!`, func);
    }
  });
  
} catch (error) {
  console.error('❌ Error loading cuts controller:', error.message);
  console.error('📋 Stack trace:', error.stack);
}

// Always available health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Cuts routes OK',
    timestamp: new Date().toISOString(),
    controllerLoaded: !!cutsController,
    functions: cutsController ? Object.keys(cutsController) : []
  });
});

// Basic test routes that don't depend on complex dependencies
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Cuts test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Only register complex routes if controller loaded successfully
if (cutsController) {
  console.log('🔗 Registering cuts routes...');
  
  // Safely register routes with function checks
  if (typeof cutsController.getAllNormalizedCuts === 'function') {
    router.get('/', cutsController.getAllNormalizedCuts);
    console.log('✅ GET / route registered');
  }
  
  if (typeof cutsController.getStats === 'function') {
    router.get('/stats', cutsController.getStats);
    console.log('✅ GET /stats route registered');
  }
  
  if (typeof cutsController.getSuggestions === 'function') {
    router.get('/suggest/:query', cutsController.getSuggestions);
    console.log('✅ GET /suggest/:query route registered');
  }
  
  if (typeof cutsController.getAllVariations === 'function') {
    router.get('/variations', cutsController.getAllVariations);
    console.log('✅ GET /variations route registered');
  }
  
  if (typeof cutsController.getNormalizedCutById === 'function') {
    router.get('/:id', cutsController.getNormalizedCutById);
    console.log('✅ GET /:id route registered');
  }
  
  if (typeof cutsController.analyzeNewCut === 'function') {
    router.post('/analyze', cutsController.analyzeNewCut);
    console.log('✅ POST /analyze route registered');
  }
  
  // Simple test-mapping route without complex dependencies
  router.get('/test-mapping', (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({ error: 'Name parameter required' });
      }
      
      res.json({
        input: name,
        message: 'Test mapping endpoint working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in test-mapping:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Simple mapping stats
  router.get('/mapping-stats', (req, res) => {
    try {
      res.json({
        message: 'Mapping stats endpoint working',
        timestamp: new Date().toISOString(),
        status: 'OK'
      });
    } catch (error) {
      console.error('Error in mapping-stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  console.log('✅ Cuts routes registration completed');
  
} else {
  console.log('⚠️ Controller not loaded, adding fallback routes');
  
  // Fallback routes when controller fails to load
  router.get('/', (req, res) => {
    res.status(503).json({ 
      error: 'Cuts service temporarily unavailable',
      message: 'Controller failed to load'
    });
  });
  
  router.get('/stats', (req, res) => {
    res.status(503).json({ 
      error: 'Stats service temporarily unavailable',
      message: 'Controller failed to load'
    });
  });
}

// הוסף enhanced test-mapping route
router.get('/test-mapping', (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Name parameter required' });
    }
    
    // Try to use normalization service if available
    try {
      const cutNormalizer = require('../utils/cutNormalizer');
      if (cutNormalizer && cutNormalizer.cleanHebrewText) {
        const cleaned = cutNormalizer.cleanHebrewText(name);
        return res.json({
          input: name,
          cleaned: cleaned,
          message: 'Cut normalizer working',
          timestamp: new Date().toISOString()
        });
      }
    } catch (normErr) {
      console.log('ℹ️ Normalizer not available, using basic response');
    }
    
    res.json({
      input: name,
      message: 'Basic test mapping endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test-mapping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// הוסף enhanced mapping-stats route
router.get('/mapping-stats', (req, res) => {
  try {
    let totalMappings = 0;
    let mappingFileLoaded = false;
    
    // Try to get real mapping stats if available
    try {
      const cutNormalizer = require('../utils/cutNormalizer');
      if (cutNormalizer && cutNormalizer.meatNamesMapping) {
        totalMappings = Object.keys(cutNormalizer.meatNamesMapping).length;
        mappingFileLoaded = totalMappings > 0;
      }
    } catch (normErr) {
      console.log('ℹ️ Normalizer not available, using basic stats');
    }
    
    res.json({
      totalMappings: totalMappings,
      mappingFileLoaded: mappingFileLoaded,
      message: 'Mapping stats endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in mapping-stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('✅ Cuts routes module loaded');
module.exports = router;
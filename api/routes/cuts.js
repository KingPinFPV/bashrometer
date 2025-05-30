// routes/cuts.js
const express = require('express');
const router = express.Router();
const {
  getAllNormalizedCuts,
  getNormalizedCutById,
  createNormalizedCut,
  updateNormalizedCut,
  deleteNormalizedCut,
  getAllVariations,
  createVariation,
  updateVariation,
  deleteVariation,
  normalizeNewCut,
  getSuggestions,
  getStats,
  analyzeNewCut
} = require('../controllers/cutsController');

const authenticateToken = require('../middleware/authMiddleware');

// Public routes (no authentication required)

/**
 * @route GET /api/cuts
 * @desc Get all normalized cuts with filtering and pagination
 * @access Public
 * @query {string} [category] - Filter by meat category
 * @query {string} [cutType] - Filter by cut type
 * @query {boolean} [isPremium] - Filter by premium status
 * @query {string} [search] - Search in name and description
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Items per page
 * @query {string} [sortBy=name] - Sort by field
 * @query {string} [sortOrder=asc] - Sort order (asc/desc)
 */
router.get('/', getAllNormalizedCuts);

/**
 * @route GET /api/cuts/stats
 * @desc Get normalization statistics
 * @access Public
 */
router.get('/stats', getStats);

/**
 * @route GET /api/cuts/suggest/:query
 * @desc Get cut name suggestions based on query
 * @access Public
 * @param {string} query - Search query
 * @query {number} [minConfidence=0.3] - Minimum confidence threshold
 * @query {number} [limit=5] - Maximum number of suggestions
 */
router.get('/suggest/:query', getSuggestions);

/**
 * @route GET /api/cuts/variations
 * @desc Get all variations with filtering and pagination
 * @access Public
 * @query {number} [normalizedCutId] - Filter by normalized cut ID
 * @query {boolean} [verified] - Filter by verification status
 * @query {number} [minConfidence] - Minimum confidence score
 * @query {string} [source] - Filter by source (manual, automatic, csv_import)
 * @query {string} [search] - Search in original name
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Items per page
 * @query {string} [sortBy=confidence_score] - Sort by field
 * @query {string} [sortOrder=desc] - Sort order (asc/desc)
 */
router.get('/variations', getAllVariations);

/**
 * @route GET /api/cuts/:id
 * @desc Get a single normalized cut by ID with its variations
 * @access Public
 * @param {number} id - Normalized cut ID
 */
router.get('/:id', getNormalizedCutById);

/**
 * @route POST /api/cuts/analyze
 * @desc Analyze a cut name without creating database records
 * @access Public
 * @body {string} cutName - Cut name to analyze
 */
router.post('/analyze', analyzeNewCut);

/**
 * @route GET /api/cuts/test-mapping
 * @desc Test meat name mapping functionality
 * @access Public
 * @query {string} name - Name to test mapping for
 */
router.get('/test-mapping', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Name parameter required' });
    }
    
    const { normalizeMeatNameWithMapping, cleanHebrewText } = require('../utils/cutNormalizer');
    
    const mappingResult = normalizeMeatNameWithMapping(name);
    const cleanedName = cleanHebrewText(name);
    
    res.json({
      input: name,
      cleanedInput: cleanedName,
      mappingResult,
      usedMapping: !!mappingResult,
      mappingSource: mappingResult ? mappingResult.source : null,
      confidence: mappingResult ? mappingResult.confidence : 0
    });
  } catch (error) {
    console.error('Error testing mapping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/cuts/mapping-stats
 * @desc Get statistics about mapping usage
 * @access Public
 */
router.get('/mapping-stats', async (req, res) => {
  try {
    const { meatNamesMapping, reverseMeatNamesMapping } = require('../utils/cutNormalizer');
    const pool = require('../db');
    
    // Count how many cuts used mapping vs other sources
    const sourceStatsQuery = `
      SELECT 
        source,
        COUNT(*) as count
      FROM cut_variations
      WHERE source IN ('mapping', 'mapping_fuzzy', 'manual', 'automatic')
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const sourceStats = await pool.query(sourceStatsQuery);
    
    // Total cuts and variations
    const totalQuery = `
      SELECT 
        (SELECT COUNT(*) FROM normalized_cuts) as total_cuts,
        (SELECT COUNT(*) FROM cut_variations) as total_variations,
        (SELECT COUNT(*) FROM cut_variations WHERE source LIKE 'mapping%') as mapping_variations
    `;
    
    const totals = await pool.query(totalQuery);
    const { total_cuts, total_variations, mapping_variations } = totals.rows[0];
    
    const mappingCoverage = total_variations > 0 ? 
      Math.round((parseInt(mapping_variations) / parseInt(total_variations)) * 100) : 0;
    
    res.json({
      totalMappingEntries: Object.keys(meatNamesMapping).length,
      totalMappingVariations: Object.keys(reverseMeatNamesMapping).length,
      databaseStats: {
        totalCuts: parseInt(total_cuts),
        totalVariations: parseInt(total_variations),
        mappingVariations: parseInt(mapping_variations),
        mappingCoverage
      },
      sourceBreakdown: sourceStats.rows
    });
  } catch (error) {
    console.error('Error getting mapping stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes requiring authentication

/**
 * @route POST /api/cuts
 * @desc Create a new normalized cut
 * @access Private (requires authentication)
 * @body {string} name - Cut name
 * @body {string} category - Meat category
 * @body {string} [cutType] - Cut type
 * @body {string} [subcategory] - Subcategory
 * @body {string} [description] - Description
 * @body {boolean} [isPremium] - Premium status
 * @body {string} [typicalWeightRange] - Weight range
 * @body {string[]} [cookingMethods] - Cooking methods
 */
router.post('/', authenticateToken, createNormalizedCut);

/**
 * @route PUT /api/cuts/:id
 * @desc Update a normalized cut
 * @access Private (requires authentication)
 * @param {number} id - Normalized cut ID
 * @body Updates for the normalized cut
 */
router.put('/:id', authenticateToken, updateNormalizedCut);

/**
 * @route DELETE /api/cuts/:id
 * @desc Delete a normalized cut (only if no variations exist)
 * @access Private (requires authentication)
 * @param {number} id - Normalized cut ID
 */
router.delete('/:id', authenticateToken, deleteNormalizedCut);

/**
 * @route POST /api/cuts/variations
 * @desc Create a new variation mapping
 * @access Private (requires authentication)
 * @body {string} originalName - Original cut name
 * @body {number} normalizedCutId - Normalized cut ID
 * @body {number} [confidenceScore] - Confidence score (0.0-1.0)
 * @body {string} [source] - Source of the mapping
 * @body {boolean} [verified] - Verification status
 */
router.post('/variations', authenticateToken, createVariation);

/**
 * @route PUT /api/cuts/variations/:id
 * @desc Update a variation mapping
 * @access Private (requires authentication)
 * @param {number} id - Variation ID
 * @body Updates for the variation
 */
router.put('/variations/:id', authenticateToken, updateVariation);

/**
 * @route DELETE /api/cuts/variations/:id
 * @desc Delete a variation mapping
 * @access Private (requires authentication)
 * @param {number} id - Variation ID
 */
router.delete('/variations/:id', authenticateToken, deleteVariation);

/**
 * @route POST /api/cuts/normalize
 * @desc Normalize a cut name (create normalized cut and/or variation)
 * @access Private (requires authentication)
 * @body {string} cutName - Cut name to normalize
 * @body {boolean} [forceCreate] - Force creation of new normalized cut
 * @body {string} [category] - Override detected category
 * @body {string} [cutType] - Override detected cut type
 */
router.post('/normalize', authenticateToken, normalizeNewCut);

// Admin-only routes (requires admin role)
// These could be added later with additional middleware:

/*
router.post('/bulk-import', authenticateToken, requireRole('admin'), bulkImportCuts);
router.post('/merge/:sourceId/:targetId', authenticateToken, requireRole('admin'), mergeCuts);
router.delete('/variations/bulk', authenticateToken, requireRole('admin'), bulkDeleteVariations);
*/

module.exports = router;
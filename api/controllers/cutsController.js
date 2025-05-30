// controllers/cutsController.js
const pool = require('../db');
const { 
  analyzeCut, 
  normalizeCut, 
  findBestMatch,
  getNormalizationStats,
  cleanHebrewText,
  calculateSimilarity
} = require('../utils/cutNormalizer');

/**
 * Get all normalized cuts with optional filtering and pagination
 * GET /api/cuts
 */
const getAllNormalizedCuts = async (req, res, next) => {
  try {
    const {
      category,
      cutType,
      isPremium,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let queryParams = [];
    let whereClauses = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (category) {
      if (Array.isArray(category)) {
        whereClauses.push(`category = ANY($${paramIndex++})`);
        queryParams.push(category);
      } else {
        whereClauses.push(`category = $${paramIndex++}`);
        queryParams.push(category);
      }
    }

    if (cutType) {
      whereClauses.push(`cut_type = $${paramIndex++}`);
      queryParams.push(cutType);
    }

    if (isPremium !== undefined) {
      whereClauses.push(`is_premium = $${paramIndex++}`);
      queryParams.push(isPremium === 'true');
    }

    if (search && search.trim() !== '') {
      whereClauses.push(`(
        LOWER(name) ILIKE $${paramIndex} OR 
        LOWER(description) ILIKE $${paramIndex} OR
        similarity(name, $${paramIndex + 1}) > 0.3
      )`);
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      queryParams.push(search.trim());
      paramIndex += 2;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total records
    const countQuery = `SELECT COUNT(*) FROM normalized_cuts ${whereString}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count, 10);

    // Main query with pagination
    const validSortColumns = {
      'name': 'name',
      'category': 'category',
      'cutType': 'cut_type',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };

    const sortColumn = validSortColumns[sortBy] || 'name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const mainQuery = `
      SELECT 
        id, name, category, cut_type, subcategory, description,
        is_premium, typical_weight_range, cooking_methods,
        created_at, updated_at,
        (SELECT COUNT(*) FROM cut_variations cv WHERE cv.normalized_cut_id = nc.id) as variations_count
      FROM normalized_cuts nc
      ${whereString}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(mainQuery, queryParams);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error getting normalized cuts:', error);
    next(error);
  }
};

/**
 * Get a single normalized cut by ID
 * GET /api/cuts/:id
 */
const getNormalizedCutById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid cut ID format' });
    }

    const query = `
      SELECT 
        nc.*,
        array_agg(
          json_build_object(
            'id', cv.id,
            'originalName', cv.original_name,
            'confidenceScore', cv.confidence_score,
            'source', cv.source,
            'verified', cv.verified,
            'createdAt', cv.created_at
          )
        ) FILTER (WHERE cv.id IS NOT NULL) as variations
      FROM normalized_cuts nc
      LEFT JOIN cut_variations cv ON nc.id = cv.normalized_cut_id
      WHERE nc.id = $1
      GROUP BY nc.id
    `;

    const result = await pool.query(query, [numericId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized cut not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error getting normalized cut by ID:', error);
    next(error);
  }
};

/**
 * Create a new normalized cut
 * POST /api/cuts
 */
const createNormalizedCut = async (req, res, next) => {
  try {
    const {
      name,
      category,
      cutType,
      subcategory,
      description,
      isPremium = false,
      typicalWeightRange,
      cookingMethods = []
    } = req.body;

    // Validation
    if (!name || !category) {
      return res.status(400).json({ 
        error: 'Name and category are required' 
      });
    }

    // Check if cut already exists
    const existingQuery = 'SELECT id FROM normalized_cuts WHERE LOWER(name) = LOWER($1)';
    const existingResult = await pool.query(existingQuery, [name]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: 'A normalized cut with this name already exists',
        existingId: existingResult.rows[0].id
      });
    }

    const insertQuery = `
      INSERT INTO normalized_cuts (
        name, category, cut_type, subcategory, description,
        is_premium, typical_weight_range, cooking_methods
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      name.trim(),
      category,
      cutType || null,
      subcategory || null,
      description || null,
      isPremium,
      typicalWeightRange || null,
      cookingMethods
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Normalized cut created successfully',
      cut: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating normalized cut:', error);
    next(error);
  }
};

/**
 * Update a normalized cut
 * PUT /api/cuts/:id
 */
const updateNormalizedCut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid cut ID format' });
    }

    const {
      name,
      category,
      cutType,
      subcategory,
      description,
      isPremium,
      typicalWeightRange,
      cookingMethods
    } = req.body;

    // Check if cut exists
    const existingQuery = 'SELECT * FROM normalized_cuts WHERE id = $1';
    const existingResult = await pool.query(existingQuery, [numericId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized cut not found' });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) { 
      fields.push(`name = $${paramCount++}`); 
      values.push(name.trim()); 
    }
    if (category !== undefined) { 
      fields.push(`category = $${paramCount++}`); 
      values.push(category); 
    }
    if (cutType !== undefined) { 
      fields.push(`cut_type = $${paramCount++}`); 
      values.push(cutType); 
    }
    if (subcategory !== undefined) { 
      fields.push(`subcategory = $${paramCount++}`); 
      values.push(subcategory); 
    }
    if (description !== undefined) { 
      fields.push(`description = $${paramCount++}`); 
      values.push(description); 
    }
    if (isPremium !== undefined) { 
      fields.push(`is_premium = $${paramCount++}`); 
      values.push(isPremium); 
    }
    if (typicalWeightRange !== undefined) { 
      fields.push(`typical_weight_range = $${paramCount++}`); 
      values.push(typicalWeightRange); 
    }
    if (cookingMethods !== undefined) { 
      fields.push(`cooking_methods = $${paramCount++}`); 
      values.push(cookingMethods); 
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(numericId);

    const updateQuery = `
      UPDATE normalized_cuts 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Normalized cut updated successfully',
      cut: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating normalized cut:', error);
    next(error);
  }
};

/**
 * Delete a normalized cut
 * DELETE /api/cuts/:id
 */
const deleteNormalizedCut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid cut ID format' });
    }

    // Check if cut exists and has variations
    const checkQuery = `
      SELECT 
        nc.*,
        COUNT(cv.id) as variations_count
      FROM normalized_cuts nc
      LEFT JOIN cut_variations cv ON nc.id = cv.normalized_cut_id
      WHERE nc.id = $1
      GROUP BY nc.id
    `;

    const checkResult = await pool.query(checkQuery, [numericId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized cut not found' });
    }

    const cut = checkResult.rows[0];
    
    if (parseInt(cut.variations_count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete cut with existing variations',
        variationsCount: cut.variations_count
      });
    }

    await pool.query('DELETE FROM normalized_cuts WHERE id = $1', [numericId]);

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting normalized cut:', error);
    next(error);
  }
};

/**
 * Get all variations with optional filtering
 * GET /api/cuts/variations
 */
const getAllVariations = async (req, res, next) => {
  try {
    const {
      normalizedCutId,
      verified,
      minConfidence,
      source,
      search,
      page = 1,
      limit = 20,
      sortBy = 'confidence_score',
      sortOrder = 'desc'
    } = req.query;

    let queryParams = [];
    let whereClauses = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (normalizedCutId) {
      whereClauses.push(`cv.normalized_cut_id = $${paramIndex++}`);
      queryParams.push(parseInt(normalizedCutId));
    }

    if (verified !== undefined) {
      whereClauses.push(`cv.verified = $${paramIndex++}`);
      queryParams.push(verified === 'true');
    }

    if (minConfidence) {
      whereClauses.push(`cv.confidence_score >= $${paramIndex++}`);
      queryParams.push(parseFloat(minConfidence));
    }

    if (source) {
      whereClauses.push(`cv.source = $${paramIndex++}`);
      queryParams.push(source);
    }

    if (search && search.trim() !== '') {
      whereClauses.push(`(
        LOWER(cv.original_name) ILIKE $${paramIndex} OR 
        LOWER(nc.name) ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total records
    const countQuery = `
      SELECT COUNT(*) 
      FROM cut_variations cv
      JOIN normalized_cuts nc ON cv.normalized_cut_id = nc.id
      ${whereString}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count, 10);

    // Main query with pagination
    const validSortColumns = {
      'originalName': 'cv.original_name',
      'confidenceScore': 'cv.confidence_score',
      'source': 'cv.source',
      'verified': 'cv.verified',
      'createdAt': 'cv.created_at',
      'normalizedName': 'nc.name'
    };

    const sortColumn = validSortColumns[sortBy] || 'cv.confidence_score';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const mainQuery = `
      SELECT 
        cv.*,
        nc.name as normalized_name,
        nc.category,
        nc.cut_type,
        u.name as created_by_name
      FROM cut_variations cv
      JOIN normalized_cuts nc ON cv.normalized_cut_id = nc.id
      LEFT JOIN users u ON cv.created_by = u.id
      ${whereString}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(mainQuery, queryParams);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error getting variations:', error);
    next(error);
  }
};

/**
 * Create a new variation
 * POST /api/cuts/variations
 */
const createVariation = async (req, res, next) => {
  try {
    const {
      originalName,
      normalizedCutId,
      confidenceScore = 1.0,
      source = 'manual',
      verified = false
    } = req.body;

    // Validation
    if (!originalName || !normalizedCutId) {
      return res.status(400).json({
        error: 'Original name and normalized cut ID are required'
      });
    }

    // Check if normalized cut exists
    const cutCheck = await pool.query(
      'SELECT id FROM normalized_cuts WHERE id = $1',
      [normalizedCutId]
    );

    if (cutCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized cut not found' });
    }

    const insertQuery = `
      INSERT INTO cut_variations (
        original_name, normalized_cut_id, confidence_score,
        source, verified, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (original_name, normalized_cut_id) DO UPDATE SET
        confidence_score = EXCLUDED.confidence_score,
        source = EXCLUDED.source,
        verified = EXCLUDED.verified,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      originalName.trim(),
      normalizedCutId,
      confidenceScore,
      source,
      verified,
      req.user ? req.user.id : null
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Variation created successfully',
      variation: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating variation:', error);
    next(error);
  }
};

/**
 * Update a variation
 * PUT /api/cuts/variations/:id
 */
const updateVariation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid variation ID format' });
    }

    const {
      originalName,
      normalizedCutId,
      confidenceScore,
      source,
      verified
    } = req.body;

    // Check if variation exists
    const existingQuery = 'SELECT * FROM cut_variations WHERE id = $1';
    const existingResult = await pool.query(existingQuery, [numericId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Variation not found' });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (originalName !== undefined) {
      fields.push(`original_name = $${paramCount++}`);
      values.push(originalName.trim());
    }
    if (normalizedCutId !== undefined) {
      fields.push(`normalized_cut_id = $${paramCount++}`);
      values.push(normalizedCutId);
    }
    if (confidenceScore !== undefined) {
      fields.push(`confidence_score = $${paramCount++}`);
      values.push(confidenceScore);
    }
    if (source !== undefined) {
      fields.push(`source = $${paramCount++}`);
      values.push(source);
    }
    if (verified !== undefined) {
      fields.push(`verified = $${paramCount++}`);
      values.push(verified);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(numericId);

    const updateQuery = `
      UPDATE cut_variations 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Variation updated successfully',
      variation: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating variation:', error);
    next(error);
  }
};

/**
 * Delete a variation
 * DELETE /api/cuts/variations/:id
 */
const deleteVariation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid variation ID format' });
    }

    const result = await pool.query(
      'DELETE FROM cut_variations WHERE id = $1 RETURNING id',
      [numericId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variation not found' });
    }

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting variation:', error);
    next(error);
  }
};

/**
 * Normalize a cut name (analyze and suggest or create)
 * POST /api/cuts/normalize
 */
const normalizeNewCut = async (req, res, next) => {
  try {
    const {
      cutName,
      forceCreate = false,
      category = null,
      cutType = null
    } = req.body;

    if (!cutName || typeof cutName !== 'string' || cutName.trim() === '') {
      return res.status(400).json({
        error: 'Cut name is required and must be a non-empty string'
      });
    }

    const result = await normalizeCut(cutName.trim(), {
      forceCreate,
      category,
      cutType,
      userId: req.user ? req.user.id : null,
      source: 'api'
    });

    res.json({
      success: result.success,
      normalizedCut: result.normalizedCut,
      variation: result.variation,
      isNewCut: result.isNewCut,
      confidence: result.confidence,
      alternatives: result.analysis.possibleMatches.slice(1, 4) // Return up to 3 alternatives
    });

  } catch (error) {
    console.error('Error normalizing cut:', error);
    next(error);
  }
};

/**
 * Get suggestions for a cut name
 * GET /api/cuts/suggest/:query
 */
const getSuggestions = async (req, res, next) => {
  try {
    const { query } = req.params;
    const { minConfidence = 0.3, limit = 5 } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const matches = await findBestMatch(query, {
      minConfidence: parseFloat(minConfidence),
      includeVariations: true
    });

    const suggestions = matches.slice(0, parseInt(limit)).map(match => ({
      cut: {
        id: match.id,
        name: match.normalizedName,
        category: match.category,
        cutType: match.cutType
      },
      confidence: match.confidence,
      matchType: match.matchType === 'database' ? 
        (match.isVariation ? 'variation' : 'exact') : 'mapping'
    }));

    res.json({
      query,
      suggestions,
      hasExactMatch: suggestions.length > 0 && suggestions[0].confidence > 0.9
    });

  } catch (error) {
    console.error('Error getting suggestions:', error);
    next(error);
  }
};

/**
 * Get normalization statistics
 * GET /api/cuts/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await getNormalizationStats();
    res.json(stats);

  } catch (error) {
    console.error('Error getting normalization stats:', error);
    next(error);
  }
};

/**
 * Analyze a cut name (without creating records)
 * POST /api/cuts/analyze
 */
const analyzeNewCut = async (req, res, next) => {
  try {
    const { cutName } = req.body;

    if (!cutName || typeof cutName !== 'string' || cutName.trim() === '') {
      return res.status(400).json({
        error: 'Cut name is required and must be a non-empty string'
      });
    }

    const analysis = await analyzeCut(cutName.trim());
    res.json(analysis);

  } catch (error) {
    console.error('Error analyzing cut:', error);
    next(error);
  }
};

module.exports = {
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
};
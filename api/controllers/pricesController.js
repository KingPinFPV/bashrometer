// controllers/pricesController.js
const pool = require('../db'); 
const { calcPricePer1kg } = require('../utils/priceCalculator');
const { sendSuccess, sendError, sendPaginatedData } = require('../utils/responseWrapper');
const { validatePriceData, validateInteger, validatePagination } = require('../utils/validation'); 

// אם אתה משתמש במחלקות שגיאה מותאמות אישית, ודא שהן מיובאות כראוי
// const { NotFoundError, BadRequestError, ApplicationError } = require('../utils/errors');

// Helper function to fetch a single price entry with all necessary details
const getFullPriceDetails = async (priceId, currentUserId = null) => {
  let query = `
    SELECT 
      pr.id, pr.product_id, p.name as product_name, 
      pr.retailer_id, r.name as retailer_name,
      pr.user_id, u.name as user_name, 
      pr.price_submission_date, pr.price_valid_from, pr.price_valid_to,
      pr.unit_for_price, pr.quantity_for_price, 
      pr.regular_price, pr.sale_price, pr.is_on_sale,
      pr.source, pr.report_type, pr.status, pr.notes,
      pr.created_at, pr.updated_at,
      p.default_weight_per_unit_grams,
      (SELECT COUNT(*) FROM price_report_likes prl WHERE prl.price_id = pr.id) as likes_count
  `;
  const queryParamsHelper = []; 

  if (currentUserId) {
    query += `,
      EXISTS (SELECT 1 FROM price_report_likes prl_user 
              WHERE prl_user.price_id = pr.id AND prl_user.user_id = $${queryParamsHelper.length + 2}) as current_user_liked
    `; 
    queryParamsHelper.push(currentUserId); 
  } else {
    query += `, FALSE as current_user_liked`;
  }
  
  query += `
    FROM prices pr
    JOIN products p ON pr.product_id = p.id
    JOIN retailers r ON pr.retailer_id = r.id
    LEFT JOIN users u ON pr.user_id = u.id
    WHERE pr.id = $1
  `;
  
  const finalQueryParams = [priceId, ...queryParamsHelper];

  // שגיאות שייזרקו מכאן ייתפסו על ידי ה-catch block של הפונקציה הקוראת
  const result = await pool.query(query, finalQueryParams);
  if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
          ...row,
          likes_count: parseInt(row.likes_count, 10) || 0,
      };
  }
  return null;
};

const getAllPrices = async (req, res, next) => {
  const {
    product_id, retailer_id, user_id: userIdQuery,
    status: statusQuery, 
    limit = 10, offset = 0,
    sort_by = 'pr.price_submission_date', order = 'DESC',
    search // פרמטר חיפוש חדש
  } = req.query;

  const currentRequestingUser = req.user; 
  let queryParams = [];
  let paramIndex = 1;
  let whereClauses = []; 

  if (currentRequestingUser && currentRequestingUser.role === 'admin') {
    if (statusQuery && statusQuery.toLowerCase() !== 'all') { 
      whereClauses.push(`pr.status = $${paramIndex++}`);
      queryParams.push(statusQuery);
    }
  } else {
    whereClauses.push(`pr.status = 'approved'`);
  }

  if (product_id) { whereClauses.push(`pr.product_id = $${paramIndex++}`); queryParams.push(parseInt(product_id)); }
  if (retailer_id) { whereClauses.push(`pr.retailer_id = $${paramIndex++}`); queryParams.push(parseInt(retailer_id)); }
  if (userIdQuery) { whereClauses.push(`pr.user_id = $${paramIndex++}`); queryParams.push(parseInt(userIdQuery)); }
  if (req.query.on_sale !== undefined) { whereClauses.push(`pr.is_on_sale = $${paramIndex++}`); queryParams.push(req.query.on_sale === 'true'); }
  if (req.query.date_from) { whereClauses.push(`pr.price_submission_date >= $${paramIndex++}`); queryParams.push(req.query.date_from); }
  if (req.query.date_to) { whereClauses.push(`pr.price_submission_date <= $${paramIndex++}`); queryParams.push(req.query.date_to); }
  
  if (search && search.trim() !== '') {
    // הוספת תנאי ל-WHERE clause, יש לשים לב שהפרמטר של search הוא האחרון במערך queryParams עד כה
    whereClauses.push(`(
      LOWER(p.name) ILIKE $${paramIndex} OR 
      LOWER(r.name) ILIKE $${paramIndex} OR 
      LOWER(u.name) ILIKE $${paramIndex} OR
      LOWER(u.email) ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search.trim().toLowerCase()}%`); // המר ל-lowercase גם כאן
    paramIndex++; // קדם את האינדקס לאחר הוספת הפרמטר
  }
      
  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  const totalCountQuery = `
    SELECT COUNT(DISTINCT pr.id) 
    FROM prices pr
    JOIN products p ON pr.product_id = p.id
    JOIN retailers r ON pr.retailer_id = r.id
    LEFT JOIN users u ON pr.user_id = u.id
    ${whereString}
  `;
  
  let mainQuerySelect = `
    SELECT 
      pr.id, pr.product_id, p.name as product_name, p.category as product_category,
      pr.retailer_id, r.name as retailer_name, r.location as retailer_location,
      pr.user_id, u.name as reporting_user_name, u.email as reporting_user_email, 
      pr.price_submission_date, pr.price_valid_from, pr.price_valid_to,
      pr.unit_for_price, pr.quantity_for_price, 
      pr.regular_price, pr.sale_price, pr.is_on_sale,
      pr.source, pr.report_type, pr.status, pr.notes,
      pr.created_at, pr.updated_at,
      p.default_weight_per_unit_grams,
      (SELECT COUNT(*) FROM price_report_likes prl WHERE prl.price_id = pr.id) as likes_count
  `;
  
  const queryParamsForMainQuery = [...queryParams]; 
  let currentParamIndexForMain = queryParams.length + 1; // התחל את האינדקס לפרמטרים של SELECT אחרי פרמטרי ה-WHERE

  if (currentRequestingUser && currentRequestingUser.userId) {
    mainQuerySelect += `, 
      EXISTS (SELECT 1 FROM price_report_likes prl_user 
              WHERE prl_user.price_id = pr.id AND prl_user.user_id = $${currentParamIndexForMain++}) as current_user_liked
    `;
    queryParamsForMainQuery.push(currentRequestingUser.userId);
  } else {
    mainQuerySelect += `, FALSE as current_user_liked`;
  }
  
  let mainQuery = `
    ${mainQuerySelect}
    FROM prices pr
    JOIN products p ON pr.product_id = p.id
    JOIN retailers r ON pr.retailer_id = r.id
    LEFT JOIN users u ON pr.user_id = u.id
    ${whereString}
  `;

  const validSortColumns = { 
    'price_submission_date': 'pr.price_submission_date', 
    'created_at': 'pr.created_at',
    'regular_price': 'pr.regular_price', 
  };
  const sortColumn = validSortColumns[sort_by] || 'pr.price_submission_date';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  mainQuery += ` ORDER BY ${sortColumn} ${sortOrder}`;

  mainQuery += ` LIMIT $${currentParamIndexForMain++} OFFSET $${currentParamIndexForMain++}`;
  queryParamsForMainQuery.push(parseInt(limit));
  queryParamsForMainQuery.push(parseInt(offset));
  
  try {
    const totalCountResult = await pool.query(totalCountQuery, queryParams); // שאילתת הספירה משתמשת בפרמטרי ה-WHERE המקוריים
    const totalItems = parseInt(totalCountResult.rows[0].count, 10);
    const result = await pool.query(mainQuery, queryParamsForMainQuery);

    const pricesWithCalc = result.rows.map(row => {
      const calculatedPrice = calcPricePer1kg({
        regular_price: row.regular_price,
        sale_price: row.sale_price,
        unit_for_price: row.unit_for_price,
        quantity_for_price: row.quantity_for_price,
        default_weight_per_unit_grams: row.default_weight_per_unit_grams
      });
      
      return {
        ...row,
        calculated_price_per_1kg: calculatedPrice,
        likes_count: parseInt(row.likes_count, 10) || 0
      };
    });
    
    res.json({ 
        data: pricesWithCalc, 
        page_info: { 
            total_items: totalItems,
            limit: parseInt(limit),
            offset: parseInt(offset),
            current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            total_pages: Math.ceil(totalItems / parseInt(limit))
        } 
    });
  } catch (err) {
    console.error("Error in getAllPrices:", err);
    next(err); 
  }
};

// --- שאר הפונקציות נשארות כפי ששלחת, עם הוספת next וקריאה ל-next(err) ---

const getPriceById = async (req, res, next) => {
  const { id } = req.params;
  const numericPriceId = parseInt(id, 10);
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  try {
    const priceDetails = await getFullPriceDetails(numericPriceId, req.user ? req.user.id : null);
    if (!priceDetails) {
      return res.status(404).json({ error: 'Price report not found.' });
    }
    res.json(priceDetails);
  } catch (err) {
    console.error(`Error fetching price by ID ${id}:`, err.message);
    next(err);
  }
};

const createPriceReport = async (req, res, next) => {
  const {
    // New format (from frontend)
    product_name, retailer_name, price, sale_price, is_on_sale,
    unit, quantity, notes,
    // Legacy format (backward compatibility)
    product_id, retailer_id, regular_price,
    unit_for_price, quantity_for_price,
    // Optional fields
    source = 'user_report', report_type = 'community', 
    price_valid_from, price_valid_to
  } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'User authentication required to submit price reports.' });
  }

  try {
    let finalProductId, finalRetailerId;
    let finalRegularPrice, finalUnit, finalQuantity;

    // Handle new format (product_name + retailer_name)
    if (product_name && retailer_name) {
      // Find or create product
      let productResult = await pool.query(
        'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND is_active = TRUE', 
        [product_name.trim()]
      );
      
      if (productResult.rows.length === 0) {
        // Create new product
        const createProductResult = await pool.query(
          'INSERT INTO products (name, is_active) VALUES ($1, TRUE) RETURNING id',
          [product_name.trim()]
        );
        finalProductId = createProductResult.rows[0].id;
      } else {
        finalProductId = productResult.rows[0].id;
      }

      // Find or create retailer
      let retailerResult = await pool.query(
        'SELECT id FROM retailers WHERE LOWER(name) = LOWER($1) AND is_active = TRUE', 
        [retailer_name.trim()]
      );
      
      if (retailerResult.rows.length === 0) {
        // Create new retailer
        const createRetailerResult = await pool.query(
          'INSERT INTO retailers (name, is_active) VALUES ($1, TRUE) RETURNING id',
          [retailer_name.trim()]
        );
        finalRetailerId = createRetailerResult.rows[0].id;
      } else {
        finalRetailerId = retailerResult.rows[0].id;
      }

      // Use new format values with defaults
      finalRegularPrice = price || regular_price;
      finalUnit = unit || 'kg'; // Default unit
      finalQuantity = quantity || 1; // Default quantity

    } else if (product_id && retailer_id) {
      // Handle legacy format
      finalProductId = product_id;
      finalRetailerId = retailer_id;
      finalRegularPrice = regular_price;
      finalUnit = unit_for_price;
      finalQuantity = quantity_for_price;

      // Verify product exists
      const productCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND is_active = TRUE', [product_id]);
      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found or inactive.' });
      }

      // Verify retailer exists
      const retailerCheck = await pool.query('SELECT id FROM retailers WHERE id = $1 AND is_active = TRUE', [retailer_id]);
      if (retailerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Retailer not found or inactive.' });
      }
    } else {
      return res.status(400).json({
        error: 'Missing required fields. Provide either (product_name, retailer_name, price) or (product_id, retailer_id, regular_price, unit_for_price, quantity_for_price)'
      });
    }

    // Validation
    if (!finalRegularPrice || !finalUnit || !finalQuantity) {
      return res.status(400).json({
        error: 'Missing required price information'
      });
    }

    // User role-based status logic
    const userRole = req.user.role || 'user';
    const initialStatus = userRole === 'admin' ? 'approved' : 'pending_approval';

    // Handle sale prices - use standardized field names only
    const { is_on_sale, price_valid_to, sale_price } = req.body;
    
    // Create price report
    const insertQuery = `
      INSERT INTO prices (
        product_id, retailer_id, user_id, regular_price, sale_price, is_on_sale,
        unit_for_price, quantity_for_price, notes, source, report_type,
        price_valid_from, price_valid_to, price_submission_date, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE, $14
      ) RETURNING id
    `;

    const values = [
      finalProductId, finalRetailerId, req.user.id, finalRegularPrice, 
      is_on_sale && sale_price ? sale_price : null, 
      is_on_sale || false,
      finalUnit, finalQuantity, notes || null, 
      source, report_type,
      price_valid_from || null, 
      price_valid_to || null,
      initialStatus
    ];

    const result = await pool.query(insertQuery, values);
    const newPriceId = result.rows[0].id;

    // Fetch complete price details to return
    const createdPrice = await getFullPriceDetails(newPriceId, req.user.id);
    
    res.status(201).json({
      id: newPriceId,
      status: createdPrice.status,
      message: 'Price report created successfully',
      price: createdPrice
    });

  } catch (err) {
    console.error('Error creating price report:', err.message);
    next(err);
  }
};

const updatePrice = async (req, res, next) => {
  const { id } = req.params;
  const numericPriceId = parseInt(id, 10);
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  const {
    regular_price, sale_price, is_on_sale, unit_for_price, 
    quantity_for_price, notes, price_valid_to
  } = req.body;

  try {
    // Check if price exists and user has permission
    const existingPrice = await pool.query(
      'SELECT user_id FROM prices WHERE id = $1', 
      [numericPriceId]
    );
    
    if (existingPrice.rows.length === 0) {
      return res.status(404).json({ error: 'Price report not found.' });
    }

    // Allow update if user is owner or admin
    const isOwner = existingPrice.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied to update this price report.' });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (regular_price !== undefined) { fields.push(`regular_price = $${paramCount++}`); values.push(regular_price); }
    if (sale_price !== undefined) { fields.push(`sale_price = $${paramCount++}`); values.push(sale_price); }
    if (is_on_sale !== undefined) { fields.push(`is_on_sale = $${paramCount++}`); values.push(is_on_sale); }
    if (unit_for_price !== undefined) { fields.push(`unit_for_price = $${paramCount++}`); values.push(unit_for_price); }
    if (quantity_for_price !== undefined) { fields.push(`quantity_for_price = $${paramCount++}`); values.push(quantity_for_price); }
    if (notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(notes); }
    if (price_valid_to !== undefined) { fields.push(`price_valid_to = $${paramCount++}`); values.push(price_valid_to); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(numericPriceId);

    const updateQuery = `UPDATE prices SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`;
    await pool.query(updateQuery, values);

    const updatedPrice = await getFullPriceDetails(numericPriceId, req.user.id);
    res.json(updatedPrice);

  } catch (err) {
    console.error(`Error updating price ${id}:`, err.message);
    next(err);
  }
};

const deletePrice = async (req, res, next) => {
  const { id } = req.params;
  const numericPriceId = parseInt(id, 10);
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  try {
    // Check if price exists and user has permission
    const existingPrice = await pool.query(
      'SELECT user_id FROM prices WHERE id = $1', 
      [numericPriceId]
    );
    
    if (existingPrice.rows.length === 0) {
      return res.status(404).json({ error: 'Price report not found.' });
    }

    const isOwner = existingPrice.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied to delete this price report.' });
    }

    await pool.query('DELETE FROM prices WHERE id = $1', [numericPriceId]);
    res.status(204).send();

  } catch (err) {
    console.error(`Error deleting price ${id}:`, err.message);
    next(err);
  }
};

const likePriceReport = async (req, res, next) => {
  const { priceId } = req.params;
  const numericPriceId = parseInt(priceId, 10);
  
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    // Check if price exists
    const priceCheck = await pool.query('SELECT id FROM prices WHERE id = $1', [numericPriceId]);
    if (priceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Price report not found.' });
    }

    // Add like (ignore if already exists)
    await pool.query(
      'INSERT INTO price_report_likes (price_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [numericPriceId, req.user.id]
    );

    const updatedPrice = await getFullPriceDetails(numericPriceId, req.user.id);
    res.json({
      message: 'Price report liked successfully',
      priceId: numericPriceId,
      userId: req.user.id,
      userLiked: updatedPrice.current_user_liked,
      likesCount: updatedPrice.likes_count,
      ...updatedPrice
    });

  } catch (err) {
    console.error(`Error liking price report ${priceId}:`, err.message);
    next(err);
  }
};

const unlikePriceReport = async (req, res, next) => {
  const { priceId } = req.params;
  const numericPriceId = parseInt(priceId, 10);
  
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    await pool.query(
      'DELETE FROM price_report_likes WHERE price_id = $1 AND user_id = $2',
      [numericPriceId, req.user.id]
    );

    const updatedPrice = await getFullPriceDetails(numericPriceId, req.user.id);
    res.json({
      message: 'Price report unliked successfully',
      priceId: numericPriceId,
      userId: req.user.id,
      userLiked: updatedPrice.current_user_liked,
      likesCount: updatedPrice.likes_count,
      ...updatedPrice
    });

  } catch (err) {
    console.error(`Error unliking price report ${priceId}:`, err.message);
    next(err);
  }
};

// --- פונקציה חדשה לעדכון סטטוס ---
const updatePriceReportStatus = async (req, res, next) => {
  const { priceId: priceIdParam } = req.params;
  const { status } = req.body;

  const numericPriceId = parseInt(priceIdParam, 10);
  if (isNaN(numericPriceId)) {
    return res.status(400).json({ error: 'Invalid price ID format.' });
  }

  const allowedStatuses = ['pending_approval', 'approved', 'rejected', 'expired', 'edited'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status provided. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'UPDATE prices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, numericPriceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Price report not found for status update.' });
    }
    
    const updatedReport = await getFullPriceDetails(numericPriceId, req.user ? req.user.id : null);
    res.status(200).json(updatedReport || result.rows[0]);

  } catch (err) {
    console.error(`Error updating status for price report ${priceIdParam}:`, err.message);
    next(err);
  }
};

// Get current prices for a product with sale calculations
const getCurrentPrices = async (req, res, next) => {
  const { product_id } = req.params;
  
  // Enhanced validation for product_id
  if (!product_id || product_id === 'undefined' || product_id === 'null') {
    console.error('getCurrentPrices: Invalid product_id received:', product_id);
    return res.status(400).json({ 
      success: false,
      error: 'מזהה מוצר לא תקין', 
      received: product_id,
      details: 'Product ID is required and cannot be undefined or null'
    });
  }
  
  const numericProductId = parseInt(product_id, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    console.error('getCurrentPrices: Product ID is not a valid positive integer:', product_id);
    return res.status(400).json({ 
      success: false,
      error: 'מזהה מוצר חייב להיות מספר חיובי',
      received: product_id 
    });
  }
  
  try {
    console.log(`📊 Getting current prices for product: ${numericProductId}`);
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.product_id,
        p.retailer_id,
        p.regular_price,
        p.sale_price,
        p.is_on_sale,
        p.is_sale,
        p.sale_end_date,
        p.original_price,
        p.price_valid_to,
        p.created_at,
        p.updated_at,
        p.status,
        p.unit_for_price,
        p.quantity_for_price,
        r.name as retailer_name,
        pr.name as product_name,
        
        -- חישוב המחיר הנוכחי (תמיכה בשני המבנים)
        CASE 
          -- מבנה חדש עם is_sale
          WHEN p.is_sale = true 
          AND (p.sale_end_date IS NULL OR p.sale_end_date >= NOW())
          THEN COALESCE(p.sale_price, p.regular_price)
          
          -- מבנה ישן עם is_on_sale
          WHEN p.is_on_sale = true 
          AND (p.price_valid_to IS NULL OR p.price_valid_to >= CURRENT_DATE)
          THEN COALESCE(p.sale_price, p.regular_price)
          
          -- מחיר רגיל
          ELSE p.regular_price
        END as current_price,
        
        -- בדיקה אם זה מבצע פעיל
        CASE 
          WHEN (p.is_sale = true AND (p.sale_end_date IS NULL OR p.sale_end_date >= NOW()))
          OR (p.is_on_sale = true AND (p.price_valid_to IS NULL OR p.price_valid_to >= CURRENT_DATE))
          THEN true
          ELSE false
        END as is_currently_on_sale,
        
        -- מחיר מקורי לתצוגה
        COALESCE(p.original_price, p.regular_price) as display_original_price,
        
        -- חישוב חיסכון
        CASE 
          WHEN (p.is_sale = true AND (p.sale_end_date IS NULL OR p.sale_end_date >= NOW()))
          OR (p.is_on_sale = true AND (p.price_valid_to IS NULL OR p.price_valid_to >= CURRENT_DATE))
          THEN COALESCE(p.original_price, p.regular_price) - COALESCE(p.sale_price, p.regular_price)
          ELSE 0
        END as savings_amount,
        
        (SELECT COUNT(*) FROM price_report_likes prl WHERE prl.price_id = p.id) as likes_count
        
      FROM prices p
      JOIN retailers r ON p.retailer_id = r.id
      JOIN products pr ON p.product_id = pr.id
      WHERE p.product_id = $1 AND p.status = 'approved'
    `, [numericProductId]);
    
    const prices = result.rows.map(row => {
      const calculatedPrice = calcPricePer1kg({
        regular_price: parseFloat(row.current_price), // המחיר האפקטיבי (כולל מבצע)
        sale_price: null, // לא נחוץ כיוון שכבר יש לנו את המחיר האפקטיבי
        unit_for_price: row.unit_for_price,
        quantity_for_price: row.quantity_for_price,
        default_weight_per_unit_grams: null // Will be handled by the function
      });
      
      return {
        ...row,
        calculated_price_per_1kg: calculatedPrice,
        likes_count: parseInt(row.likes_count, 10) || 0
      };
    }).sort((a, b) => {
      // מיון לפי המחיר המנורמל ל-1kg (כולל מבצעים)
      return (a.calculated_price_per_1kg || 0) - (b.calculated_price_per_1kg || 0);
    });
    
    console.log(`✅ Found ${prices.length} current prices`);
    
    res.json({
      success: true,
      prices: prices,
      total_items: prices.length,
      product_id: numericProductId
    });
    
  } catch (error) {
    console.error('❌ Error fetching current prices:', error);
    next(error);
  }
};

module.exports = { 
  getAllPrices, 
  getPriceById, 
  createPriceReport, 
  updatePrice, 
  deletePrice, 
  likePriceReport, 
  unlikePriceReport,
  updatePriceReportStatus,
  getCurrentPrices
};
// controllers/productsController.js
const pool = require('../db');
const { calcPricePer1kg } = require('../utils/priceCalculator');
// אם תחליט להשתמש במחלקות שגיאה מותאמות, תצטרך לייבא אותן:
// const { NotFoundError, BadRequestError, ApplicationError } = require('../utils/errors');

const getAllProducts = async (req, res, next) => {
  const { 
    limit = 10, offset = 0, category, brand, kosher_level, 
    animal_type, name_like, sort_by = 'p.name', order = 'ASC'
  } = req.query;
  
  const queryParams = [];
  let paramIndex = 1; 
  let whereClauses = " WHERE p.is_active = TRUE "; 

  if (category) { whereClauses += ` AND LOWER(p.category) LIKE LOWER($${paramIndex++})`; queryParams.push(`%${category}%`); }
  if (brand) { whereClauses += ` AND LOWER(p.brand) LIKE LOWER($${paramIndex++})`; queryParams.push(`%${brand}%`); }
  if (kosher_level) { whereClauses += ` AND p.kosher_level = $${paramIndex++}`; queryParams.push(kosher_level); }
  if (animal_type) { whereClauses += ` AND LOWER(p.animal_type) LIKE LOWER($${paramIndex++})`; queryParams.push(`%${animal_type}%`); }
  if (name_like) { whereClauses += ` AND LOWER(p.name) LIKE LOWER($${paramIndex++})`; queryParams.push(`%${name_like}%`); }

  const countQueryParams = [...queryParams]; 
  const countQuery = `SELECT COUNT(DISTINCT p.id) FROM products p LEFT JOIN cuts c ON p.cut_id = c.id ${whereClauses.replace(/\$\d+/g, (match, i) => `$${countQueryParams.indexOf(queryParams[parseInt(match.substring(1))-1]) + 1}`)}`;
  
  let mainQuery = `
    SELECT 
      p.id, p.name, p.brand, p.short_description, p.image_url, p.category, 
      p.unit_of_measure, p.is_active, p.origin_country, p.kosher_level, p.animal_type,
      p.cut_type, p.description, p.default_weight_per_unit_grams, p.cut_id,
      c.hebrew_name as cut_hebrew_name,
      c.name as cut_english_name,
      c.category as cut_category,
      (
        SELECT ROUND(MIN(
            CASE 
                WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
                WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
                WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
                WHEN pr.unit_for_price IN ('unit', 'package') AND p.default_weight_per_unit_grams > 0 AND p.default_weight_per_unit_grams IS NOT NULL THEN 
                     (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p.default_weight_per_unit_grams / 1000))
                ELSE NULL 
            END
        ), 2)
        FROM prices pr 
        WHERE pr.product_id = p.id 
          AND pr.status = 'approved' 
          AND (pr.price_valid_to IS NULL OR pr.price_valid_to >= CURRENT_DATE)
      ) as min_price_per_1kg
    FROM products p
    LEFT JOIN cuts c ON p.cut_id = c.id
    ${whereClauses}
  `;

  const validSortColumns = {
    'name': 'p.name', 'brand': 'p.brand', 'category': 'p.category',
  };
  const sortColumn = validSortColumns[sort_by] || 'p.name';
  const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  mainQuery += ` ORDER BY ${sortColumn} ${sortOrder}`;

  const finalQueryParamsForData = [...queryParams]; 
  mainQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  finalQueryParamsForData.push(parseInt(limit));
  finalQueryParamsForData.push(parseInt(offset));

  try {
    const countResult = await pool.query(countQuery, countQueryParams); 
    const totalItems = parseInt(countResult.rows[0].count, 10);
    
    const result = await pool.query(mainQuery, finalQueryParamsForData);

    // Frontend-compatible response format
    const products = result.rows.map(p => ({...p, min_price_per_1kg: p.min_price_per_1kg ? parseFloat(p.min_price_per_1kg) : null }));
    
    res.json({
      data: products,
      page_info: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_items: totalItems,
        current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        total_pages: Math.ceil(totalItems / parseInt(limit)),
        has_next: (parseInt(offset) + parseInt(limit)) < totalItems,
        has_previous: parseInt(offset) > 0
      }
    });
  } catch (err) {
    console.error('Error in getAllProducts:', err.message);
    next(err); 
  }
};

const getProductById = async (req, res, next) => { 
  const { id } = req.params;
  
  // Enhanced validation for product ID
  if (!id || id === 'undefined' || id === 'null') {
    console.error('getProductById: Invalid product ID received:', id);
    return res.status(400).json({ 
      error: 'Invalid product ID', 
      received: id,
      details: 'Product ID is required and cannot be undefined or null'
    });
  }
  
  const numericProductId = parseInt(id, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    console.error('getProductById: Product ID is not a valid positive integer:', id);
    return res.status(400).json({ 
      error: 'Invalid product ID format. Must be a positive integer.',
      received: id 
    });
  }
  const currentUserId = req.user ? req.user.id : null;
  try {
    const productQuery = `
      SELECT 
        p.id, p.name, p.brand, p.origin_country, p.kosher_level, p.animal_type, 
        p.cut_type, p.description, p.category, p.unit_of_measure, 
        p.default_weight_per_unit_grams, p.image_url, p.short_description, p.is_active, p.cut_id,
        c.hebrew_name as cut_hebrew_name,
        c.name as cut_english_name,
        c.category as cut_category
      FROM products p
      LEFT JOIN cuts c ON p.cut_id = c.id
      WHERE p.id = $1 -- Removed AND p.is_active = TRUE to allow admin to see inactive products by ID
    `;
    const productResult = await pool.query(productQuery, [numericProductId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productResult.rows[0];
    const pricesQuery = `
      SELECT 
        r.id as retailer_id, r.name as retailer_name, 
        pr.id as price_id, pr.regular_price, pr.sale_price, pr.unit_for_price, 
        pr.quantity_for_price, pr.is_on_sale, pr.price_submission_date,
        pr.price_valid_to, pr.notes as price_notes,
        (SELECT COUNT(*) FROM price_report_likes prl WHERE prl.price_id = pr.id) as likes_count,
        EXISTS (SELECT 1 FROM price_report_likes prl_user 
                WHERE prl_user.price_id = pr.id AND prl_user.user_id = $2) as current_user_liked
      FROM prices pr
      JOIN retailers r ON pr.retailer_id = r.id
      JOIN products p_for_prices ON pr.product_id = p_for_prices.id
      WHERE pr.product_id = $1 AND pr.status = 'approved' AND r.is_active = TRUE
      ORDER BY (
          CASE 
              WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
              WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
              WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
              WHEN pr.unit_for_price IN ('unit', 'package') AND p_for_prices.default_weight_per_unit_grams > 0 AND p_for_prices.default_weight_per_unit_grams IS NOT NULL
                   THEN (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p_for_prices.default_weight_per_unit_grams / 1000))
              ELSE NULL 
          END
      ) ASC, 
      pr.price_submission_date DESC
      LIMIT 10; 
    `;
    const pricesResult = await pool.query(pricesQuery, [numericProductId, currentUserId]);
    const price_examples = pricesResult.rows.map(priceEntry => {
      const calculated_price_per_1kg_raw = calcPricePer1kg({
        regular_price: parseFloat(priceEntry.regular_price),
        sale_price: priceEntry.sale_price ? parseFloat(priceEntry.sale_price) : null,
        unit_for_price: priceEntry.unit_for_price,
        quantity_for_price: parseFloat(priceEntry.quantity_for_price),
        default_weight_per_unit_grams: product.default_weight_per_unit_grams ? parseFloat(product.default_weight_per_unit_grams) : null
      });
      return {
        price_id: priceEntry.price_id, retailer_id: priceEntry.retailer_id, retailer: priceEntry.retailer_name,
        regular_price: parseFloat(priceEntry.regular_price), sale_price: priceEntry.sale_price ? parseFloat(priceEntry.sale_price) : null,
        is_on_sale: priceEntry.is_on_sale, unit_for_price: priceEntry.unit_for_price,
        quantity_for_price: parseFloat(priceEntry.quantity_for_price), submission_date: priceEntry.price_submission_date,
        valid_to: priceEntry.price_valid_to, notes: priceEntry.price_notes,
        likes_count: parseInt(priceEntry.likes_count, 10) || 0, current_user_liked: priceEntry.current_user_liked,
        calculated_price_per_1kg: calculated_price_per_1kg_raw !== null ? parseFloat(calculated_price_per_1kg_raw.toFixed(2)) : null
      };
    });
    const response = {
      ...product,
      default_weight_per_unit_grams: product.default_weight_per_unit_grams ? parseFloat(product.default_weight_per_unit_grams) : null,
      price_examples: price_examples
    };
    res.json(response);
  } catch (err) {
    console.error(`Error in getProductById (id: ${id}):`, err.message);
    next(err); 
  }
};

// --- CRUD Functions for Products (Admin Only) ---

const createProduct = async (req, res, next) => {
  // הרשאות אדמין ייבדקו על ידי middleware ב-router
  const { 
    name, brand, origin_country, kosher_level, animal_type, cut_type, 
    description, category, unit_of_measure = 'kg', // ברירת מחדל אם לא נשלח
    default_weight_per_unit_grams, image_url, short_description, is_active = true,
    cut_id, product_subtype_id, processing_state, has_bone, quality_grade // Support for new fields
  } = req.body;

  if (!name || !unit_of_measure) {
    return res.status(400).json({ error: 'Product name and unit_of_measure are required.' });
  }

  try {
    console.log('Creating new product:', { name, brand, cut_id, short_description });
    
    const newProduct = await pool.query(
      `INSERT INTO products 
        (name, brand, origin_country, kosher_level, animal_type, cut_type, 
         description, category, unit_of_measure, default_weight_per_unit_grams, 
         image_url, short_description, is_active, cut_id, product_subtype_id,
         processing_state, has_bone, quality_grade) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
       RETURNING *`,
      [
        name, brand, origin_country, kosher_level, animal_type, cut_type, 
        description, category, unit_of_measure, default_weight_per_unit_grams, 
        image_url, short_description, is_active, cut_id || null, product_subtype_id || null,
        processing_state || null, has_bone || null, quality_grade || null
      ]
    );
    
    console.log('Product created successfully:', newProduct.rows[0]);
    
    res.status(201).json({
      success: true,
      data: newProduct.rows[0]
    });
  } catch (err) {
    console.error('Error in createProduct:', err.message);
    
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ 
        success: false, 
        error: 'מוצר עם השם הזה כבר קיים' 
      });
    }
    
    if (err.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ 
        success: false, 
        error: 'מזהה הנתח שצוין אינו תקין' 
      });
    }
    
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const numericProductId = parseInt(id, 10);
  if (isNaN(numericProductId)) {
    return res.status(400).json({ error: 'Invalid product ID format.' });
  }

  const { 
    name, brand, origin_country, kosher_level, animal_type, cut_type, 
    description, category, unit_of_measure, default_weight_per_unit_grams, 
    image_url, short_description, is_active, cut_id, product_subtype_id,
    processing_state, has_bone, quality_grade 
  } = req.body;

  // הרכב שאילתת עדכון דינמית כדי לעדכן רק שדות שנשלחו
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(name); }
  if (brand !== undefined) { fields.push(`brand = $${paramCount++}`); values.push(brand); }
  if (origin_country !== undefined) { fields.push(`origin_country = $${paramCount++}`); values.push(origin_country); }
  if (kosher_level !== undefined) { fields.push(`kosher_level = $${paramCount++}`); values.push(kosher_level); }
  if (animal_type !== undefined) { fields.push(`animal_type = $${paramCount++}`); values.push(animal_type); }
  if (cut_type !== undefined) { fields.push(`cut_type = $${paramCount++}`); values.push(cut_type); }
  if (description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(description); }
  if (category !== undefined) { fields.push(`category = $${paramCount++}`); values.push(category); }
  if (unit_of_measure !== undefined) { fields.push(`unit_of_measure = $${paramCount++}`); values.push(unit_of_measure); }
  if (default_weight_per_unit_grams !== undefined) { fields.push(`default_weight_per_unit_grams = $${paramCount++}`); values.push(default_weight_per_unit_grams); }
  if (image_url !== undefined) { fields.push(`image_url = $${paramCount++}`); values.push(image_url); }
  if (short_description !== undefined) { fields.push(`short_description = $${paramCount++}`); values.push(short_description); }
  if (is_active !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(is_active); }
  if (cut_id !== undefined) { fields.push(`cut_id = $${paramCount++}`); values.push(cut_id); }
  if (product_subtype_id !== undefined) { fields.push(`product_subtype_id = $${paramCount++}`); values.push(product_subtype_id); }
  if (processing_state !== undefined) { fields.push(`processing_state = $${paramCount++}`); values.push(processing_state); }
  if (has_bone !== undefined) { fields.push(`has_bone = $${paramCount++}`); values.push(has_bone); }
  if (quality_grade !== undefined) { fields.push(`quality_grade = $${paramCount++}`); values.push(quality_grade); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update.' });
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`); // עדכן תמיד את updated_at
  values.push(numericProductId); // ה-ID של המוצר לעדכון הוא הפרמטר האחרון

  const updateQuery = `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  try {
    const updatedProduct = await pool.query(updateQuery, values);
    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found for update.' });
    }
    res.status(200).json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(`Error in updateProduct for id ${id}:`, err.message);
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  const numericProductId = parseInt(id, 10);
  if (isNaN(numericProductId)) {
    return res.status(400).json({ error: 'Invalid product ID format.' });
  }

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [numericProductId]);
    if (result.rowCount === 0) { // rowCount יראה אם משהו נמחק
      return res.status(404).json({ error: 'Product not found for deletion.' });
    }
    res.status(204).send(); // No Content, מחיקה מוצלחת
  } catch (err) {
    // בדוק אם השגיאה היא בגלל FOREIGN KEY constraint (למשל, אם יש דיווחי מחירים המקושרים למוצר זה)
    if (err.code === '23503') { // קוד שגיאה של PostgreSQL להפרת מפתח זר
        console.error(`Error in deleteProduct (FK violation) for id ${id}:`, err.message);
        return res.status(409).json({ 
            error: 'Cannot delete product as it is referenced by other records (e.g., price reports).',
            details: err.message 
        });
    }
    console.error(`Error in deleteProduct for id ${id}:`, err.message);
    next(err);
  }
};

// Advanced search function with filtering, sorting, and pagination
const searchProducts = async (req, res, next) => {
  const { 
    search, category, cut_id, subtype_id, price_min, price_max,
    sort_by = 'name', order = 'ASC', page = 1, limit = 20,
    kosher_level, processing_state, has_bone, quality_grade
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const queryParams = [];
  let paramIndex = 1;
  let whereClauses = " WHERE p.is_active = TRUE ";
  
  // Text search across multiple fields
  if (search) {
    whereClauses += ` AND (
      LOWER(p.name) LIKE LOWER($${paramIndex}) OR 
      LOWER(p.brand) LIKE LOWER($${paramIndex}) OR
      LOWER(p.description) LIKE LOWER($${paramIndex}) OR
      LOWER(c.hebrew_name) LIKE LOWER($${paramIndex}) OR
      LOWER(ps.hebrew_description) LIKE LOWER($${paramIndex})
    )`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  // Category filter
  if (category) {
    whereClauses += ` AND c.category = $${paramIndex}`;
    queryParams.push(category);
    paramIndex++;
  }
  
  // Cut filter
  if (cut_id) {
    whereClauses += ` AND p.cut_id = $${paramIndex}`;
    queryParams.push(parseInt(cut_id));
    paramIndex++;
  }
  
  // Subtype filter
  if (subtype_id) {
    whereClauses += ` AND p.product_subtype_id = $${paramIndex}`;
    queryParams.push(parseInt(subtype_id));
    paramIndex++;
  }
  
  // Additional filters
  if (kosher_level) {
    whereClauses += ` AND p.kosher_level = $${paramIndex}`;
    queryParams.push(kosher_level);
    paramIndex++;
  }
  
  if (processing_state) {
    whereClauses += ` AND p.processing_state = $${paramIndex}`;
    queryParams.push(processing_state);
    paramIndex++;
  }
  
  if (has_bone !== undefined) {
    whereClauses += ` AND p.has_bone = $${paramIndex}`;
    queryParams.push(has_bone === 'true');
    paramIndex++;
  }
  
  if (quality_grade) {
    whereClauses += ` AND p.quality_grade = $${paramIndex}`;
    queryParams.push(quality_grade);
    paramIndex++;
  }
  
  // Build main query with joins
  let mainQuery = `
    SELECT 
      p.id, p.name, p.brand, p.short_description, p.image_url, 
      p.category, p.unit_of_measure, p.processing_state, p.has_bone, p.quality_grade,
      c.hebrew_name as cut_name, c.category as cut_category,
      ps.hebrew_description as subtype_name,
      (
        SELECT ROUND(AVG(
          CASE 
            WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
            WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
            WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
            WHEN pr.unit_for_price IN ('unit', 'package') AND p.default_weight_per_unit_grams > 0 
              THEN (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p.default_weight_per_unit_grams / 1000))
            ELSE NULL 
          END
        ), 2)
        FROM prices pr 
        WHERE pr.product_id = p.id 
          AND pr.status = 'approved' 
          AND (pr.price_valid_to IS NULL OR pr.price_valid_to >= CURRENT_DATE)
      ) as avg_price_per_1kg,
      (
        SELECT MIN(
          CASE 
            WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
            WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
            WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
            WHEN pr.unit_for_price IN ('unit', 'package') AND p.default_weight_per_unit_grams > 0 
              THEN (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p.default_weight_per_unit_grams / 1000))
            ELSE NULL 
          END
        )
        FROM prices pr 
        WHERE pr.product_id = p.id 
          AND pr.status = 'approved' 
          AND (pr.price_valid_to IS NULL OR pr.price_valid_to >= CURRENT_DATE)
      ) as min_price_per_1kg
    FROM products p
    LEFT JOIN cuts c ON p.cut_id = c.id
    LEFT JOIN product_subtypes ps ON p.product_subtype_id = ps.id
    ${whereClauses}
  `;
  
  // Price range filters (applied after calculating normalized prices)
  if (price_min || price_max) {
    const havingClauses = [];
    if (price_min) {
      havingClauses.push(`min_price_per_1kg >= ${parseFloat(price_min)}`);
    }
    if (price_max) {
      havingClauses.push(`min_price_per_1kg <= ${parseFloat(price_max)}`);
    }
    mainQuery = `SELECT * FROM (${mainQuery}) filtered_products WHERE ${havingClauses.join(' AND ')}`;
  }
  
  // Sorting
  const validSortColumns = {
    'name': 'name', 'brand': 'brand', 'category': 'cut_category',
    'price': 'min_price_per_1kg', 'avg_price': 'avg_price_per_1kg'
  };
  const sortColumn = validSortColumns[sort_by] || 'name';
  const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  // Handle NULL values in price sorting
  if (sortColumn.includes('price')) {
    mainQuery += ` ORDER BY ${sortColumn} ${sortOrder} NULLS LAST`;
  } else {
    mainQuery += ` ORDER BY ${sortColumn} ${sortOrder}`;
  }
  
  // Count query for pagination
  const countQuery = `SELECT COUNT(*) FROM (${mainQuery.split('ORDER BY')[0]}) as count_query`;
  
  // Add pagination
  mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(parseInt(limit), offset);
  
  try {
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].count, 10);
    
    const result = await pool.query(mainQuery, queryParams);
    
    const products = result.rows.map(p => ({
      ...p,
      avg_price_per_1kg: p.avg_price_per_1kg ? parseFloat(p.avg_price_per_1kg) : null,
      min_price_per_1kg: p.min_price_per_1kg ? parseFloat(p.min_price_per_1kg) : null
    }));
    
    res.json({
      data: products,
      page_info: {
        total_items: totalItems,
        limit: parseInt(limit),
        offset: offset,
        current_page: parseInt(page),
        total_pages: Math.ceil(totalItems / parseInt(limit)),
        has_next: offset + parseInt(limit) < totalItems,
        has_previous: offset > 0
      }
    });
  } catch (err) {
    console.error('Error in searchProducts:', err.message);
    next(err);
  }
};

// Get subtypes for a specific cut
const getSubtypesByCut = async (req, res, next) => {
  const { cutId } = req.params;
  const numericCutId = parseInt(cutId, 10);
  
  if (isNaN(numericCutId)) {
    return res.status(400).json({ error: 'Invalid cut ID format' });
  }
  
  try {
    const query = `
      SELECT id, name, hebrew_description, purpose, price_range, is_active
      FROM product_subtypes 
      WHERE cut_id = $1 AND is_active = TRUE
      ORDER BY hebrew_description ASC
    `;
    
    const result = await pool.query(query, [numericCutId]);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error in getSubtypesByCut:', err.message);
    next(err);
  }
};

// Get all cuts grouped by category
const getAllCuts = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        id, name, hebrew_name, category, description,
        (SELECT COUNT(*) FROM product_subtypes ps WHERE ps.cut_id = c.id AND ps.is_active = TRUE) as subtypes_count,
        (SELECT COUNT(*) FROM products p WHERE p.cut_id = c.id AND p.is_active = TRUE) as products_count
      FROM cuts c 
      ORDER BY category ASC, hebrew_name ASC
    `;
    
    const result = await pool.query(query);
    
    // Group by category
    const cutsByCategory = {};
    result.rows.forEach(cut => {
      if (!cutsByCategory[cut.category]) {
        cutsByCategory[cut.category] = [];
      }
      cutsByCategory[cut.category].push({
        ...cut,
        subtypes_count: parseInt(cut.subtypes_count),
        products_count: parseInt(cut.products_count)
      });
    });
    
    res.json({ data: cutsByCategory });
  } catch (err) {
    console.error('Error in getAllCuts:', err.message);
    next(err);
  }
};

// Get filter options for dropdowns
const getFilterOptions = async (req, res, next) => {
  try {
    const queries = await Promise.all([
      pool.query('SELECT DISTINCT category FROM cuts WHERE category IS NOT NULL ORDER BY category'),
      pool.query('SELECT DISTINCT kosher_level FROM products WHERE kosher_level IS NOT NULL ORDER BY kosher_level'),
      pool.query('SELECT DISTINCT processing_state FROM products WHERE processing_state IS NOT NULL ORDER BY processing_state'),
      pool.query('SELECT DISTINCT quality_grade FROM products WHERE quality_grade IS NOT NULL ORDER BY quality_grade'),
      pool.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand LIMIT 50')
    ]);
    
    res.json({
      categories: queries[0].rows.map(r => r.category),
      kosher_levels: queries[1].rows.map(r => r.kosher_level),
      processing_states: queries[2].rows.map(r => r.processing_state),
      quality_grades: queries[3].rows.map(r => r.quality_grade),
      brands: queries[4].rows.map(r => r.brand)
    });
  } catch (err) {
    console.error('Error in getFilterOptions:', err.message);
    next(err);
  }
};

// יצירת מוצר על ידי משתמש רגיל
const createProductByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, category, cut_id, product_subtype_id,
      brand, quality_grade, processing_state,
      has_bone, kosher_level, origin_country, description
    } = req.body;

    // וולידציה
    if (!name || !category || !cut_id) {
      return res.status(400).json({
        success: false,
        error: 'שם מוצר, קטגוריה ונתח הם שדות חובה'
      });
    }

    const query = `
      INSERT INTO products (
        name, category, cut_id, product_subtype_id,
        brand, quality_grade, processing_state, has_bone,
        kosher_level, origin_country, description,
        status, created_by_user_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, true)
      RETURNING *
    `;

    const values = [
      name, category, cut_id, product_subtype_id,
      brand, quality_grade, processing_state, has_bone,
      kosher_level, origin_country, description, userId
    ];

    const result = await pool.query(query, values);

    // לוג פעולה
    await logAdminAction(userId, 'create_product_request', 'product', result.rows[0].id, {
      product_name: name,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'המוצר נשלח לאישור מנהל המערכת',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating product by user:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת המוצר'
    });
  }
};

// קבלת מוצרים ממתינים לאישור
const getPendingProducts = async (req, res, next) => {
  try {
    console.log('📋 Getting pending products...');
    
    const { limit = 10, offset = 0 } = req.query;
    
    // ודא שהפרמטרים הם מספרים תקינים
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    
    // בדוק שהמשתמש הוא אדמין
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'הרשאות אדמין נדרשות לצפייה במוצרים ממתינים'
      });
    }
    
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM products p
      WHERE p.status = 'pending'
    `;
    
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].total_count) || 0;
    
    const query = `
      SELECT 
        p.*,
        c.hebrew_name as cut_name,
        c.category as cut_category,
        ps.name as subtype_name,
        ps.hebrew_description,
        u.name as created_by_name,
        u.email as created_by_email
      FROM products p
      LEFT JOIN cuts c ON p.cut_id = c.id
      LEFT JOIN product_subtypes ps ON p.product_subtype_id = ps.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limitNum, offsetNum]);
    
    console.log(`✅ Found ${result.rows.length} pending products (total: ${totalCount})`);

    res.json({
      success: true,
      products: result.rows, // Changed from pendingProducts to products for consistency
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        current_page: Math.floor(offsetNum / limitNum) + 1,
        total_pages: Math.ceil(totalCount / limitNum),
        hasMore: (offsetNum + limitNum) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pending products:', error);
    next(error);
  }
};

// אישור מוצר
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { notes } = req.body;

    const query = `
      UPDATE products 
      SET status = 'approved', 
          approved_by_user_id = $1, 
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await pool.query(query, [adminId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'מוצר לא נמצא או כבר אושר'
      });
    }

    // לוג פעולה
    await logAdminAction(adminId, 'approve_product', 'product', id, {
      product_name: result.rows[0].name,
      notes
    });

    res.json({
      success: true,
      message: 'המוצר אושר בהצלחה',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה באישור המוצר'
    });
  }
};

// דחיית מוצר
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'נדרשת סיבה לדחיית המוצר'
      });
    }

    const query = `
      UPDATE products 
      SET status = 'rejected', 
          rejection_reason = $1,
          approved_by_user_id = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status = 'pending'
      RETURNING *
    `;

    const result = await pool.query(query, [reason, adminId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'מוצר לא נמצא'
      });
    }

    // לוג פעולה
    await logAdminAction(adminId, 'reject_product', 'product', id, {
      product_name: result.rows[0].name,
      reason
    });

    res.json({
      success: true,
      message: 'המוצר נדחה',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בדחיית המוצר'
    });
  }
};

// סטטיסטיקות מתקדמות למוצר
const getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const queries = await Promise.all([
      // סטטיסטיקות מחיר
      pool.query(`
        SELECT 
          COUNT(*) as total_reports,
          AVG(regular_price) as avg_price,
          MIN(regular_price) as min_price,
          MAX(regular_price) as max_price,
          COUNT(DISTINCT retailer_id) as unique_retailers,
          COUNT(CASE WHEN is_sale = true THEN 1 END) as sale_reports
        FROM prices 
        WHERE product_id = $1 AND is_active = true AND status = 'approved'
      `, [id]),

      // מגמות מחיר (30 ימים אחרונים)
      pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          AVG(regular_price) as avg_price,
          COUNT(*) as reports_count
        FROM prices 
        WHERE product_id = $1 
          AND is_active = true 
          AND status = 'approved'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `, [id]),

      // מחירים לפי חנות
      pool.query(`
        SELECT DISTINCT ON (r.id)
          r.id,
          r.name as retailer_name,
          r.location,
          p.regular_price,
          p.sale_price,
          p.is_sale,
          p.created_at
        FROM prices p
        JOIN retailers r ON p.retailer_id = r.id
        WHERE p.product_id = $1 
          AND p.is_active = true 
          AND p.status = 'approved'
        ORDER BY r.id, p.created_at DESC
      `, [id])
    ]);

    res.json({
      success: true,
      analytics: {
        overview: queries[0].rows[0],
        priceTrends: queries[1].rows,
        pricesByRetailer: queries[2].rows
      }
    });

  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת אנליטיקה'
    });
  }
};

// עדכון מוצר (אדמין)
const updateProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const updates = req.body;

    // בניית שאילתת עדכון דינמית
    const allowedFields = [
      'name', 'category', 'cut_id', 'product_subtype_id',
      'brand', 'quality_grade', 'processing_state', 'has_bone',
      'kosher_level', 'origin_country', 'description', 'is_active'
    ];

    const updateFields = Object.keys(updates).filter(field => 
      allowedFields.includes(field)
    );

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'לא נמצאו שדות תקינים לעדכון'
      });
    }

    const setClause = updateFields.map((field, index) => 
      `${field} = $${index + 2}`
    ).join(', ');

    const query = `
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...updateFields.map(field => updates[field])];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'מוצר לא נמצא'
      });
    }

    // לוג פעולה
    await logAdminAction(adminId, 'update_product', 'product', id, {
      updated_fields: updateFields,
      changes: updates
    });

    res.json({
      success: true,
      message: 'המוצר עודכן בהצלחה',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בעדכון המוצר'
    });
  }
};

// Smart search using name variants mapping
const smartProductSearch = async (req, res, next) => {
  try {
    const { search, ...otherFilters } = req.query;

    if (!search) {
      // אם אין חיפוש, השתמש בחיפוש הרגיל
      return searchProducts(req, res, next);
    }

    // חיפוש בשמות מנורמלים ווריאנטים
    const variantQuery = `
      SELECT DISTINCT pnv.normalized_name, pnv.confidence_score
      FROM product_name_variants pnv
      WHERE pnv.variant_name ILIKE $1 
         OR pnv.normalized_name ILIKE $1
      ORDER BY pnv.confidence_score DESC
      LIMIT 10
    `;

    const variantResult = await pool.query(variantQuery, [`%${search}%`]);
    
    if (variantResult.rows.length === 0) {
      // אם לא נמצא, חזור לחיפוש רגיל
      return searchProducts(req, res, next);
    }

    // חפש מוצרים לפי השמות המנורמלים שנמצאו
    const normalizedNames = variantResult.rows.map(row => row.normalized_name);
    
    const { 
      category, cut_id, subtype_id, price_min, price_max,
      sort_by = 'match_confidence', order = 'DESC', page = 1, limit = 20,
      kosher_level, processing_state, has_bone, quality_grade
    } = otherFilters;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryParams = [normalizedNames, `%${search}%`];
    let paramIndex = 3;
    let whereClauses = " WHERE p.is_active = TRUE ";
    
    // הוסף תנאי חיפוש חכם
    whereClauses += ` AND (
      p.name = ANY($1) OR
      p.name ILIKE $2 OR
      EXISTS (
        SELECT 1 FROM product_name_variants pnv 
        WHERE pnv.normalized_name = ANY($1) 
        AND (p.name ILIKE '%' || pnv.normalized_name || '%' OR p.name ILIKE '%' || pnv.variant_name || '%')
      )
    )`;

    // Apply additional filters
    if (category) {
      whereClauses += ` AND c.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (cut_id) {
      whereClauses += ` AND p.cut_id = $${paramIndex}`;
      queryParams.push(parseInt(cut_id));
      paramIndex++;
    }
    
    if (subtype_id) {
      whereClauses += ` AND p.product_subtype_id = $${paramIndex}`;
      queryParams.push(parseInt(subtype_id));
      paramIndex++;
    }
    
    if (kosher_level) {
      whereClauses += ` AND p.kosher_level = $${paramIndex}`;
      queryParams.push(kosher_level);
      paramIndex++;
    }
    
    if (processing_state) {
      whereClauses += ` AND p.processing_state = $${paramIndex}`;
      queryParams.push(processing_state);
      paramIndex++;
    }
    
    if (has_bone !== undefined) {
      whereClauses += ` AND p.has_bone = $${paramIndex}`;
      queryParams.push(has_bone === 'true');
      paramIndex++;
    }
    
    if (quality_grade) {
      whereClauses += ` AND p.quality_grade = $${paramIndex}`;
      queryParams.push(quality_grade);
      paramIndex++;
    }

    let mainQuery = `
      SELECT DISTINCT
        p.id, p.name, p.brand, p.short_description, p.image_url, 
        p.category, p.unit_of_measure, p.processing_state, p.has_bone, p.quality_grade,
        c.hebrew_name as cut_name, c.category as cut_category,
        ps.hebrew_description as subtype_name,
        (
          SELECT ROUND(AVG(
            CASE 
              WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
              WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
              WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
              WHEN pr.unit_for_price IN ('unit', 'package') AND p.default_weight_per_unit_grams > 0 
                THEN (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p.default_weight_per_unit_grams / 1000))
              ELSE NULL 
            END
          ), 2)
          FROM prices pr 
          WHERE pr.product_id = p.id 
            AND pr.status = 'approved' 
            AND (pr.price_valid_to IS NULL OR pr.price_valid_to >= CURRENT_DATE)
        ) as avg_price_per_1kg,
        (
          SELECT MIN(
            CASE 
              WHEN pr.unit_for_price = 'kg' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price)
              WHEN pr.unit_for_price = '100g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 10
              WHEN pr.unit_for_price = 'g' THEN (COALESCE(pr.sale_price, pr.regular_price) / pr.quantity_for_price) * 1000
              WHEN pr.unit_for_price IN ('unit', 'package') AND p.default_weight_per_unit_grams > 0 
                THEN (COALESCE(pr.sale_price, pr.regular_price) / (pr.quantity_for_price * p.default_weight_per_unit_grams / 1000))
              ELSE NULL 
            END
          )
          FROM prices pr 
          WHERE pr.product_id = p.id 
            AND pr.status = 'approved' 
            AND (pr.price_valid_to IS NULL OR pr.price_valid_to >= CURRENT_DATE)
        ) as min_price_per_1kg,
        COALESCE(
          (SELECT MAX(pnv.confidence_score) 
           FROM product_name_variants pnv 
           WHERE pnv.normalized_name = ANY($1) 
           AND (p.name ILIKE '%' || pnv.normalized_name || '%' OR p.name ILIKE '%' || pnv.variant_name || '%')),
          CASE 
            WHEN p.name ILIKE $2 THEN 0.9
            ELSE 0.5
          END
        ) as match_confidence
      FROM products p
      LEFT JOIN cuts c ON p.cut_id = c.id
      LEFT JOIN product_subtypes ps ON p.product_subtype_id = ps.id
      ${whereClauses}
    `;

    // Price range filters
    if (price_min || price_max) {
      const havingClauses = [];
      if (price_min) {
        havingClauses.push(`min_price_per_1kg >= ${parseFloat(price_min)}`);
      }
      if (price_max) {
        havingClauses.push(`min_price_per_1kg <= ${parseFloat(price_max)}`);
      }
      mainQuery = `SELECT * FROM (${mainQuery}) filtered_products WHERE ${havingClauses.join(' AND ')}`;
    }

    // Sorting
    const validSortColumns = {
      'name': 'name', 'brand': 'brand', 'category': 'cut_category',
      'price': 'min_price_per_1kg', 'avg_price': 'avg_price_per_1kg', 'match_confidence': 'match_confidence'
    };
    const sortColumn = validSortColumns[sort_by] || 'match_confidence';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    if (sortColumn.includes('price')) {
      mainQuery += ` ORDER BY ${sortColumn} ${sortOrder} NULLS LAST`;
    } else {
      mainQuery += ` ORDER BY ${sortColumn} ${sortOrder}`;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) FROM (${mainQuery.split('ORDER BY')[0]}) as count_query`;
    
    // Add pagination
    mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].count, 10);
    
    const result = await pool.query(mainQuery, queryParams);

    const products = result.rows.map(p => ({
      ...p,
      avg_price_per_1kg: p.avg_price_per_1kg ? parseFloat(p.avg_price_per_1kg) : null,
      min_price_per_1kg: p.min_price_per_1kg ? parseFloat(p.min_price_per_1kg) : null,
      match_confidence: p.match_confidence ? parseFloat(p.match_confidence) : null
    }));

    res.json({
      success: true,
      products: products,
      searchSuggestions: variantResult.rows,
      searchTerm: search,
      matchType: 'smart_search',
      data: products,
      page_info: {
        total_items: totalItems,
        limit: parseInt(limit),
        offset: offset,
        current_page: parseInt(page),
        total_pages: Math.ceil(totalItems / parseInt(limit)),
        has_next: offset + parseInt(limit) < totalItems,
        has_previous: offset > 0
      }
    });

  } catch (error) {
    console.error('Error in smart product search:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בחיפוש חכם'
    });
  }
};

// Autocomplete suggestions endpoint
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const query = `
      SELECT DISTINCT 
        pnv.variant_name as suggestion,
        pnv.normalized_name,
        pnv.confidence_score,
        COUNT(p.id) as product_count
      FROM product_name_variants pnv
      LEFT JOIN products p ON p.name ILIKE '%' || pnv.normalized_name || '%'
      WHERE (pnv.variant_name ILIKE $1 OR pnv.normalized_name ILIKE $1) AND p.is_active = TRUE
      GROUP BY pnv.variant_name, pnv.normalized_name, pnv.confidence_score
      HAVING COUNT(p.id) > 0
      ORDER BY pnv.confidence_score DESC, COUNT(p.id) DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [`%${q}%`]);

    res.json({
      success: true,
      suggestions: result.rows
    });

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בהצעות חיפוש'
    });
  }
};

// פונקציית עזר לרישום פעולות אדמין
const logAdminAction = async (adminId, actionType, targetType, targetId, details = {}) => {
  try {
    await pool.query(`
      INSERT INTO admin_actions (admin_user_id, action_type, target_type, target_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [adminId, actionType, targetType, targetId, JSON.stringify(details)]);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,       // Standard search
  smartProductSearch,   // Smart search with name variants
  getSearchSuggestions, // Autocomplete suggestions
  getSubtypesByCut,    // New
  getAllCuts,          // New
  getFilterOptions,     // New
  createProductByUser,  // New admin functions
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getProductAnalytics,
  updateProductAdmin,
  logAdminAction
};
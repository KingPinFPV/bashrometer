const pool = require('../db');

// Create a new product request
const createProductRequest = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      category,
      animal_type,
      cut_type,
      description,
      unit_of_measure = 'kg',
      kosher_level,
      origin_country
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'שם המוצר חובה' });
    }

    // Check if product already exists
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND LOWER(COALESCE(brand, \'\')) = LOWER(COALESCE($2, \'\'))',
      [name.trim(), brand?.trim() || '']
    );

    if (existingProduct.rows.length > 0) {
      return res.status(400).json({ error: 'מוצר זה כבר קיים במאגר' });
    }

    // Check if request already exists
    const existingRequest = await pool.query(
      'SELECT id FROM product_requests WHERE LOWER(name) = LOWER($1) AND LOWER(COALESCE(brand, \'\')) = LOWER(COALESCE($2, \'\')) AND status = \'pending\'',
      [name.trim(), brand?.trim() || '']
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'בקשה למוצר זה כבר קיימת ומחכה לאישור' });
    }

    const result = await pool.query(
      `INSERT INTO product_requests (
        name, brand, category, animal_type, cut_type, description, 
        unit_of_measure, kosher_level, origin_country, requested_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        name.trim(),
        brand?.trim() || null,
        category?.trim() || null,
        animal_type?.trim() || null,
        cut_type?.trim() || null,
        description?.trim() || null,
        unit_of_measure,
        kosher_level?.trim() || null,
        origin_country?.trim() || null,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'בקשה למוצר חדש נשלחה בהצלחה! היא תיבדק על ידי מנהל המערכת.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product request:', error);
    next(error);
  }
};

// Create a new retailer request
const createRetailerRequest = async (req, res, next) => {
  try {
    const {
      name,
      type,
      chain,
      address,
      website,
      phone
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'שם הקמעונאי חובה' });
    }

    if (!type || !type.trim()) {
      return res.status(400).json({ error: 'סוג הקמעונאי חובה' });
    }

    // Check if retailer already exists
    const existingRetailer = await pool.query(
      'SELECT id FROM retailers WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingRetailer.rows.length > 0) {
      return res.status(400).json({ error: 'קמעונאי זה כבר קיים במאגר' });
    }

    // Check if request already exists
    const existingRequest = await pool.query(
      'SELECT id FROM retailer_requests WHERE LOWER(name) = LOWER($1) AND status = \'pending\'',
      [name.trim()]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'בקשה לקמעונאי זה כבר קיימת ומחכה לאישור' });
    }

    const result = await pool.query(
      `INSERT INTO retailer_requests (
        name, type, chain, address, website, phone, requested_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        name.trim(),
        type.trim(),
        chain?.trim() || null,
        address?.trim() || null,
        website?.trim() || null,
        phone?.trim() || null,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'בקשה לקמעונאי חדש נשלחה בהצלחה! היא תיבדק על ידי מנהל המערכת.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating retailer request:', error);
    next(error);
  }
};

// Get pending requests for admin
const getPendingProductRequests = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        pr.*,
        u.username as requested_by_username
      FROM product_requests pr
      JOIN users u ON pr.requested_by = u.id
      WHERE pr.status = 'pending'
      ORDER BY pr.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM product_requests WHERE status = \'pending\''
    );

    res.json({
      data: result.rows,
      page_info: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_items: parseInt(countResult.rows[0].count),
        current_page_count: result.rows.length,
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching pending product requests:', error);
    next(error);
  }
};

const getPendingRetailerRequests = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        rr.*,
        u.username as requested_by_username
      FROM retailer_requests rr
      JOIN users u ON rr.requested_by = u.id
      WHERE rr.status = 'pending'
      ORDER BY rr.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM retailer_requests WHERE status = \'pending\''
    );

    res.json({
      data: result.rows,
      page_info: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_items: parseInt(countResult.rows[0].count),
        current_page_count: result.rows.length,
        total_pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching pending retailer requests:', error);
    next(error);
  }
};

// Approve/reject product request
const processProductRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'פעולה לא תקינה' });
    }

    // Get the request
    const requestResult = await pool.query(
      'SELECT * FROM product_requests WHERE id = $1 AND status = \'pending\'',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'בקשה לא נמצאה או כבר עובדה' });
    }

    const request = requestResult.rows[0];

    if (action === 'approve') {
      // Create the product
      await pool.query(
        `INSERT INTO products (
          name, brand, category, animal_type, cut_type, description, 
          unit_of_measure, kosher_level, origin_country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          request.name,
          request.brand,
          request.category,
          request.animal_type,
          request.cut_type,
          request.description,
          request.unit_of_measure,
          request.kosher_level,
          request.origin_country
        ]
      );
    }

    // Update request status
    await pool.query(
      `UPDATE product_requests 
      SET status = $1, admin_notes = $2, processed_by = $3, processed_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [action === 'approve' ? 'approved' : 'rejected', admin_notes || null, req.user.id, id]
    );

    res.json({
      message: action === 'approve' ? 'המוצר אושר ונוסף למאגר' : 'הבקשה נדחתה',
      action
    });
  } catch (error) {
    console.error('Error processing product request:', error);
    next(error);
  }
};

// Approve/reject retailer request
const processRetailerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'פעולה לא תקינה' });
    }

    // Get the request
    const requestResult = await pool.query(
      'SELECT * FROM retailer_requests WHERE id = $1 AND status = \'pending\'',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'בקשה לא נמצאה או כבר עובדה' });
    }

    const request = requestResult.rows[0];

    if (action === 'approve') {
      // Create the retailer
      await pool.query(
        `INSERT INTO retailers (
          name, type, chain, address, website, phone
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          request.name,
          request.type,
          request.chain,
          request.address,
          request.website,
          request.phone
        ]
      );
    }

    // Update request status
    await pool.query(
      `UPDATE retailer_requests 
      SET status = $1, admin_notes = $2, processed_by = $3, processed_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [action === 'approve' ? 'approved' : 'rejected', admin_notes || null, req.user.id, id]
    );

    res.json({
      message: action === 'approve' ? 'הקמעונאי אושר ונוסף למאגר' : 'הבקשה נדחתה',
      action
    });
  } catch (error) {
    console.error('Error processing retailer request:', error);
    next(error);
  }
};

module.exports = {
  createProductRequest,
  createRetailerRequest,
  getPendingProductRequests,
  getPendingRetailerRequests,
  processProductRequest,
  processRetailerRequest
};
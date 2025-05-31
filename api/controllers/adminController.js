const { pool } = require('../db');

// דשבורד מנהל - סטטיסטיקות כלליות
const getDashboardStats = async (req, res) => {
  try {
    const queries = await Promise.all([
      // סטטיסטיקות מוצרים
      pool.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM products 
        GROUP BY status
      `),

      // סטטיסטיקות דיווחי מחיר
      pool.query(`
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as reports_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as reports_today
        FROM prices 
        WHERE is_active = true
      `),

      // סטטיסטיקות משתמשים
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
        FROM users
      `),

      // פעילות אחרונה
      pool.query(`
        SELECT 
          aa.*,
          u.name as admin_name,
          u.email as admin_email
        FROM admin_actions aa
        JOIN users u ON aa.admin_user_id = u.id
        ORDER BY aa.created_at DESC
        LIMIT 10
      `)
    ]);

    const productStats = {};
    queries[0].rows.forEach(row => {
      productStats[row.status] = parseInt(row.count);
    });

    res.json({
      success: true,
      dashboard: {
        products: productStats,
        reports: queries[1].rows[0],
        users: queries[2].rows[0],
        recentActivity: queries[3].rows
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת נתוני דשבורד'
    });
  }
};

// ניהול תת-סוגים
const getSubtypesManagement = async (req, res) => {
  try {
    const query = `
      SELECT 
        ps.*,
        c.hebrew_name as cut_name,
        c.category as cut_category,
        COUNT(p.id) as products_count
      FROM product_subtypes ps
      JOIN cuts c ON ps.cut_id = c.id
      LEFT JOIN products p ON p.product_subtype_id = ps.id AND p.is_active = true
      GROUP BY ps.id, c.id, c.hebrew_name, c.category
      ORDER BY c.category, c.hebrew_name, ps.name
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      subtypes: result.rows
    });

  } catch (error) {
    console.error('Error fetching subtypes management:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת ניהול תת-סוגים'
    });
  }
};

// יצירת תת-סוג חדש
const createSubtype = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      cut_id, name, hebrew_description, purpose,
      typical_price_range_min, typical_price_range_max
    } = req.body;

    if (!cut_id || !name || !hebrew_description) {
      return res.status(400).json({
        success: false,
        error: 'נתח, שם ותיאור הם שדות חובה'
      });
    }

    const query = `
      INSERT INTO product_subtypes (
        cut_id, name, hebrew_description, purpose,
        typical_price_range_min, typical_price_range_max
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      cut_id, name, hebrew_description, purpose,
      typical_price_range_min, typical_price_range_max
    ]);

    // לוג פעולה
    await logAdminAction(adminId, 'create_subtype', 'subtype', result.rows[0].id, {
      subtype_name: name,
      cut_id
    });

    res.status(201).json({
      success: true,
      message: 'תת-סוג נוצר בהצלחה',
      subtype: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating subtype:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת תת-סוג'
    });
  }
};

// עדכון תת-סוג
const updateSubtype = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const updates = req.body;

    const allowedFields = [
      'name', 'hebrew_description', 'purpose',
      'typical_price_range_min', 'typical_price_range_max', 'is_active'
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
      UPDATE product_subtypes 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...updateFields.map(field => updates[field])];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'תת-סוג לא נמצא'
      });
    }

    // לוג פעולה
    await logAdminAction(adminId, 'update_subtype', 'subtype', id, {
      updated_fields: updateFields,
      changes: updates
    });

    res.json({
      success: true,
      message: 'תת-סוג עודכן בהצלחה',
      subtype: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating subtype:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בעדכון תת-סוג'
    });
  }
};

// ניהול משתמשים
const getUsersManagement = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    const query = `
      SELECT 
        u.*,
        COUNT(p.id) as products_created,
        COUNT(pr.id) as prices_reported,
        MAX(pr.created_at) as last_activity
      FROM users u
      LEFT JOIN products p ON u.id = p.created_by_user_id
      LEFT JOIN prices pr ON u.id = pr.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM users ${whereClause}`, params.slice(0, -2))
    ]);

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users management:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת ניהול משתמשים'
    });
  }
};

// עדכון תפקיד משתמש
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    if (!['user', 'admin', 'editor'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'תפקיד לא תקין'
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
    }

    // לוג פעולה
    await logAdminAction(adminId, 'update_user_role', 'user', id, {
      new_role: role,
      user_email: result.rows[0].email
    });

    res.json({
      success: true,
      message: 'תפקיד המשתמש עודכן בהצלחה',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בעדכון תפקיד המשתמש'
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
  getDashboardStats,
  getSubtypesManagement,
  createSubtype,
  updateSubtype,
  getUsersManagement,
  updateUserRole,
  logAdminAction
};
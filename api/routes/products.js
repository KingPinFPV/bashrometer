// routes/products.js (או productsRoutes.js, התאם לשם הקובץ שלך)
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productsController');

// ייבא את ה-middlewares שלך. ודא שהנתיבים והשמות נכונים.
// אני מניח שהקובץ authMiddleware.js מייצא את שתי הפונקציות.
// אם הפונקציה לאימות טוקן נקראת אחרת (למשל, רק authMiddleware), שנה בהתאם.
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); 

// === נתיבים קיימים (לקריאה בלבד, לרוב פתוחים או דורשים רק אימות בסיסי) ===

// GET /api/products - שליפת כל המוצרים (עם פילטור, מיון, עימוד)
router.get('/', productController.getAllProducts);

// GET /api/products/search - חיפוש מתקדם עם פילטרים (חייב להיות לפני /:id)
router.get('/search', productController.searchProducts);

// GET /api/products/smart-search - חיפוש חכם עם מיפוי שמות
router.get('/smart-search', productController.smartProductSearch);

// GET /api/products/search-suggestions - הצעות השלמה אוטומטית
router.get('/search-suggestions', productController.getSearchSuggestions);

// GET /api/products/cuts - שליפת כל הנתחים מקובצים לפי קטגוריה
router.get('/cuts', productController.getAllCuts);

// GET /api/products/filter-options - שליפת אפשרויות לסינון (קטגוריות, כשרות וכו')
router.get('/filter-options', productController.getFilterOptions);

// GET /api/products/subtypes/:cutId - שליפת תת-סוגים לפי נתח
router.get('/subtypes/:cutId', productController.getSubtypesByCut);

// GET /api/products/:id - שליפת מוצר יחיד לפי ID (חייב להיות אחרון)
router.get('/:id', productController.getProductById);


// === נתיבי CRUD חדשים למוצרים (דורשים הרשאות אדמין) ===

// POST /api/products - יצירת מוצר חדש (אדמין בלבד)
router.post(
    '/', 
    authenticateToken, // ודא שהמשתמש מחובר
    authorizeRole(['admin']), // ודא שהמשתמש הוא אדמין
    productController.createProduct 
);

// PUT /api/products/:id - עדכון מוצר קיים (אדמין בלבד)
router.put(
    '/:id', 
    authenticateToken, 
    authorizeRole(['admin']), 
    productController.updateProduct
);

// DELETE /api/products/:id - מחיקת מוצר קיים (אדמין בלבד)
router.delete(
    '/:id', 
    authenticateToken, 
    authorizeRole(['admin']), 
    productController.deleteProduct
);

// === נתיבים חדשים למערכת ניהול מוצרים ===

// POST /api/products/create-by-user - יצירת מוצר על ידי משתמש רגיל (דורש אישור)
router.post('/create-by-user', authenticateToken, productController.createProductByUser);

// GET /api/products/pending - קבלת מוצרים ממתינים לאישור (אדמין בלבד)
router.get('/pending', authenticateToken, authorizeRole(['admin']), productController.getPendingProducts);

// PATCH /api/products/:id/approve - אישור מוצר (אדמין בלבד)
router.patch('/:id/approve', authenticateToken, authorizeRole(['admin']), productController.approveProduct);

// PATCH /api/products/:id/reject - דחיית מוצר (אדמין בלבד)
router.patch('/:id/reject', authenticateToken, authorizeRole(['admin']), productController.rejectProduct);

// GET /api/products/:id/analytics - קבלת אנליטיקה למוצר (אדמין בלבד)
router.get('/:id/analytics', authenticateToken, authorizeRole(['admin']), productController.getProductAnalytics);

// PUT /api/products/:id/admin - עדכון מוצר עם הרשאות מלאות (אדמין בלבד)
router.put('/:id/admin', authenticateToken, authorizeRole(['admin']), productController.updateProductAdmin);

module.exports = router;
// routes/prices.js 
const express = require('express'); 
const router = express.Router(); 
const pricesController = require('../controllers/pricesController'); 
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); 

router.get('/', authenticateToken, pricesController.getAllPrices); 
router.post('/', authenticateToken, pricesController.createPriceReport); 
router.get('/:id', authenticateToken, pricesController.getPriceById); 
router.put('/:id', authenticateToken, pricesController.updatePrice); 
router.delete('/:id', authenticateToken, pricesController.deletePrice); 
router.post('/:priceId/like', authenticateToken, pricesController.likePriceReport); 
router.delete('/:priceId/like', authenticateToken, pricesController.unlikePriceReport); 
router.put( 
    '/:priceId/status', 
    authenticateToken, 
    authorizeRole(['admin']), 
    pricesController.updatePriceReportStatus 
); 

// Normalized product price comparison endpoints
router.get('/compare/:normalizedProductId', pricesController.compareNormalizedProductPrices);
router.get('/normalized/:normalizedProductId', pricesController.getPricesForNormalizedProduct);

module.exports = router;
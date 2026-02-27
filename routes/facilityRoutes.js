// routes/facilityRoutes.js
const express = require('express');
const router  = express.Router();
const FacilityController = require('../controllers/facilityController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// Public reads (needed for booking modal to load facilities without auth)
router.get('/',    FacilityController.getAllFacilities);
router.get('/:id', FacilityController.getFacilityById);

// Admin-only writes
router.post('/',    requireLogin, requireAdmin, FacilityController.createFacility);
router.put('/:id',  requireLogin, requireAdmin, FacilityController.updateFacility);
router.delete('/:id', requireLogin, requireAdmin, FacilityController.deleteFacility);

module.exports = router;

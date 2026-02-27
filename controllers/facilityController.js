// controllers/facilityController.js
const FacilityModel = require('../models/facilityModel');

const FacilityController = {

  async getAllFacilities(req, res) {
    try {
      const facilities = await FacilityModel.getAll();
      return res.status(200).json({ success: true, count: facilities.length, data: facilities });
    } catch (err) {
      console.error('getAllFacilities error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getFacilityById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid facility ID' });
      const facility = await FacilityModel.getById(id);
      if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
      return res.status(200).json({ success: true, data: facility });
    } catch (err) {
      console.error('getFacilityById error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async createFacility(req, res) {
    try {
      const { name, location, capacity } = req.body;
      if (!name || !location || capacity === undefined)
        return res.status(400).json({ success: false, error: 'name, location, and capacity are required' });
      const cap = parseInt(capacity, 10);
      if (isNaN(cap) || cap < 1)
        return res.status(400).json({ success: false, error: 'capacity must be a positive integer' });
      const facility = await FacilityModel.create({ name, location, capacity: cap });
      return res.status(201).json({ success: true, data: facility });
    } catch (err) {
      console.error('createFacility error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async updateFacility(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid facility ID' });
      const { name, location, capacity } = req.body;
      if (capacity !== undefined) {
        const cap = parseInt(capacity, 10);
        if (isNaN(cap) || cap < 1)
          return res.status(400).json({ success: false, error: 'capacity must be a positive integer' });
      }
      const facility = await FacilityModel.update(id, { name, location, capacity: capacity ? parseInt(capacity,10) : undefined });
      if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
      return res.status(200).json({ success: true, data: facility });
    } catch (err) {
      console.error('updateFacility error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async deleteFacility(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid facility ID' });
      const facility = await FacilityModel.delete(id);
      if (!facility) return res.status(404).json({ success: false, error: 'Facility not found' });
      return res.status(200).json({ success: true, message: `Facility "${facility.name}" deleted successfully` });
    } catch (err) {
      console.error('deleteFacility error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },
};

module.exports = FacilityController;

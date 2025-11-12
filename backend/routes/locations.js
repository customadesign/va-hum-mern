const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// @route   GET /api/locations
// @desc    Get all locations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { country, search } = req.query;

    const query = {};
    if (country) query.country = country;
    if (search) {
      query.$or = [
        { city: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ];
    }

    const locations = await Location.find(query)
      .sort('country city');

    res.json({
      success: true,
      data: locations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/locations/countries
// @desc    Get unique countries
// @access  Public
router.get('/countries', async (req, res) => {
  try {
    const countries = await Location.distinct('country');
    
    const countriesWithCodes = await Location.aggregate([
      {
        $group: {
          _id: '$country',
          countryCode: { $first: '$countryCode' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: countriesWithCodes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/locations/geocode
// @desc    Geocode an address
// @access  Public
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an address'
      });
    }

    // In a real implementation, you would use a geocoding service
    // For now, return a mock response
    const mockLocation = {
      city: 'Manila',
      state: 'Metro Manila',
      country: 'Philippines',
      countryCode: 'PH',
      latitude: 14.5995,
      longitude: 120.9842,
      timeZone: 'Asia/Manila',
      utcOffset: 8
    };

    res.json({
      success: true,
      data: mockLocation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/locations
// @desc    Create a new location
// @access  Public (for testing)
router.post('/', async (req, res) => {
  try {
    const { city, state, country, countryCode, timeZone, utcOffset, latitude, longitude } = req.body;

    if (!city || !country || !countryCode || !timeZone || utcOffset === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide city, country, countryCode, timeZone, and utcOffset'
      });
    }

    const location = await Location.create({
      city,
      state,
      country,
      countryCode,
      timeZone,
      utcOffset,
      latitude,
      longitude
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
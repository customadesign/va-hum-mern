const express = require('express');
const router = express.Router();

// Simple in-memory storage for webinar registrations (consider using database in production)
const registrations = [];

/**
 * @route   POST /api/webinar/register
 * @desc    Register for webinar
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      experience,
      messenger,
      consent,
      webinarStartISO,
      submittedAt,
      tz,
      utm
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !country || !experience || consent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check for duplicate registration (in-memory check)
    const existingRegistration = registrations.find(
      reg => reg.email.toLowerCase() === email.toLowerCase()
    );

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered for the webinar'
      });
    }

    // Create registration object
    const registration = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      country,
      experience,
      messenger: messenger || '',
      consent,
      webinarStartISO,
      submittedAt: submittedAt || new Date().toISOString(),
      timezone: tz || 'UTC',
      utm: utm || {},
      createdAt: new Date().toISOString()
    };

    // Store registration (in production, save to database)
    registrations.push(registration);

    // Log registration for debugging
    console.log('New webinar registration:', {
      email: registration.email,
      name: `${registration.firstName} ${registration.lastName}`,
      country: registration.country,
      experience: registration.experience
    });

    // In production, you might want to:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Add to email marketing list
    // 4. Send to CRM

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Successfully registered for the webinar',
      data: {
        registrationId: registration.id,
        email: registration.email,
        webinarDate: webinarStartISO
      }
    });

  } catch (error) {
    console.error('Webinar registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/webinar/registrations
 * @desc    Get all webinar registrations (admin only)
 * @access  Private/Admin
 */
router.get('/registrations', async (req, res) => {
  try {
    // In production, add authentication middleware here
    // For now, returning count only for security
    res.json({
      success: true,
      data: {
        totalRegistrations: registrations.length,
        message: 'Full list requires admin authentication'
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching registrations'
    });
  }
});

/**
 * @route   GET /api/webinar/check-registration/:email
 * @desc    Check if email is already registered
 * @access  Public
 */
router.get('/check-registration/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const isRegistered = registrations.some(
      reg => reg.email.toLowerCase() === email.toLowerCase()
    );

    res.json({
      success: true,
      data: {
        isRegistered
      }
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while checking registration'
    });
  }
});

module.exports = router;
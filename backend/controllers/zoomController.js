const axios = require('axios');
const jwt = require('jsonwebtoken');

// Zoom API credentials - move to environment variables in production
const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;
const ZOOM_SDK_KEY = process.env.ZOOM_SDK_KEY;
const ZOOM_SDK_SECRET = process.env.ZOOM_SDK_SECRET;

// Generate Zoom JWT for API calls
const generateZoomJWT = () => {
  const payload = {
    iss: ZOOM_API_KEY,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  return jwt.sign(payload, ZOOM_API_SECRET);
};

// Generate SDK JWT for Meeting SDK
const generateSDKJWT = (meetingNumber, role = 0) => {
  const payload = {
    iss: ZOOM_SDK_KEY,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2 hours expiration
    iat: Math.floor(Date.now() / 1000) - 30,
    aud: 'zoom',
    appKey: ZOOM_SDK_KEY,
    tokenExp: Math.floor(Date.now() / 1000) + (60 * 60 * 2),
    alg: 'HS256'
  };

  // Add meeting-specific claims if meetingNumber is provided
  if (meetingNumber) {
    payload.mn = meetingNumber;
    payload.role = role;
  }

  return jwt.sign(payload, ZOOM_SDK_SECRET);
};

// Create a webinar
exports.createWebinar = async (req, res) => {
  try {
    const { topic, start_time, duration, agenda, password } = req.body;

    const webinarData = {
      topic: topic || 'Live VA Training Session',
      type: 5, // Webinar
      start_time: start_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      duration: duration || 60, // Default 1 hour
      timezone: 'UTC',
      password: password || Math.random().toString(36).substring(2, 8),
      agenda: agenda || 'Interactive training session for Virtual Assistants',
      settings: {
        host_video: true,
        panelists_video: false,
        practice_session: false,
        hd_video: true,
        approval_type: 0, // Automatically approve
        registration_type: 1, // Attendees register once and can attend any occurrence
        audio: 'both',
        auto_recording: 'none',
        enforce_login: false,
        enforce_login_domains: '',
        alternative_hosts: '',
        close_registration: false,
        show_share_button: true,
        allow_multiple_devices: true,
        on_demand: false,
        global_dial_in_countries: ['US'],
        registrants_confirmation_email: true,
        registrants_email_notification: true,
        meeting_authentication: false,
        add_watermark: false,
        add_audio_watermark: false
      }
    };

    const token = generateZoomJWT();
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/webinars',
      webinarData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const webinar = response.data;
    
    // Generate SDK signature for joining
    const signature = generateSDKJWT(webinar.id, 0);

    res.json({
      success: true,
      webinar: {
        id: webinar.id,
        topic: webinar.topic,
        join_url: webinar.join_url,
        start_url: webinar.start_url,
        password: webinar.password,
        start_time: webinar.start_time,
        duration: webinar.duration,
        registration_url: webinar.registration_url
      },
      sdk: {
        signature,
        sdkKey: ZOOM_SDK_KEY,
        meetingNumber: webinar.id,
        password: webinar.password
      }
    });

  } catch (error) {
    console.error('Error creating webinar:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create webinar',
      details: error.response?.data || error.message
    });
  }
};

// Get webinar details
exports.getWebinar = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const token = generateZoomJWT();

    const response = await axios.get(
      `https://api.zoom.us/v2/webinars/${webinarId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const webinar = response.data;
    const signature = generateSDKJWT(webinar.id, 0);

    res.json({
      success: true,
      webinar: {
        id: webinar.id,
        topic: webinar.topic,
        join_url: webinar.join_url,
        start_time: webinar.start_time,
        duration: webinar.duration,
        password: webinar.password,
        status: webinar.status
      },
      sdk: {
        signature,
        sdkKey: ZOOM_SDK_KEY,
        meetingNumber: webinar.id,
        password: webinar.password
      }
    });

  } catch (error) {
    console.error('Error fetching webinar:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webinar details',
      details: error.response?.data || error.message
    });
  }
};

// Generate SDK signature for existing meeting
exports.generateSignature = async (req, res) => {
  try {
    const { meetingNumber, role = 0 } = req.body;

    if (!meetingNumber) {
      return res.status(400).json({
        success: false,
        error: 'Meeting number is required'
      });
    }

    const signature = generateSDKJWT(meetingNumber, role);

    res.json({
      success: true,
      signature,
      sdkKey: ZOOM_SDK_KEY
    });

  } catch (error) {
    console.error('Error generating signature:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate signature',
      details: error.message
    });
  }
};

// List user's webinars
exports.listWebinars = async (req, res) => {
  try {
    const token = generateZoomJWT();
    const response = await axios.get(
      'https://api.zoom.us/v2/users/me/webinars',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page_size: 30,
          type: 'scheduled'
        }
      }
    );

    res.json({
      success: true,
      webinars: response.data.webinars.map(webinar => ({
        id: webinar.id,
        topic: webinar.topic,
        start_time: webinar.start_time,
        duration: webinar.duration,
        join_url: webinar.join_url,
        registration_url: webinar.registration_url,
        status: webinar.status
      }))
    });

  } catch (error) {
    console.error('Error listing webinars:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to list webinars',
      details: error.response?.data || error.message
    });
  }
};

// Update webinar
exports.updateWebinar = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const updateData = req.body;
    const token = generateZoomJWT();

    const response = await axios.patch(
      `https://api.zoom.us/v2/webinars/${webinarId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Webinar updated successfully'
    });

  } catch (error) {
    console.error('Error updating webinar:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update webinar',
      details: error.response?.data || error.message
    });
  }
};

// Delete webinar
exports.deleteWebinar = async (req, res) => {
  try {
    const { webinarId } = req.params;
    const token = generateZoomJWT();

    await axios.delete(
      `https://api.zoom.us/v2/webinars/${webinarId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({
      success: true,
      message: 'Webinar deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting webinar:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webinar',
      details: error.response?.data || error.message
    });
  }
};
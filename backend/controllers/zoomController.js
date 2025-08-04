const axios = require('axios');
const jwt = require('jsonwebtoken');

// VideoSDK API credentials - move to environment variables in production
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

// Generate VideoSDK JWT token
const generateVideoSDKToken = () => {
  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: ['allow_join', 'allow_mod'], // Allow join and moderate permissions
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
  };
  return jwt.sign(payload, VIDEOSDK_SECRET_KEY, { algorithm: 'HS256' });
};

// Create a new meeting room
exports.createMeeting = async (req, res) => {
  try {
    const { topic } = req.body;

    const token = generateVideoSDKToken();
    
    // Create room using VideoSDK API
    const response = await axios.post(
      'https://api.videosdk.live/v2/rooms',
      {},
      {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      }
    );

    const meeting = response.data;

    res.json({
      success: true,
      meeting: {
        id: meeting.roomId,
        topic: topic || 'Live VA Training Session',
        roomId: meeting.roomId,
        created_at: new Date().toISOString()
      },
      token: token, // VideoSDK token for joining
      config: {
        roomId: meeting.roomId,
        token: token
      }
    });

  } catch (error) {
    console.error('Error creating meeting:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting',
      details: error.response?.data || error.message
    });
  }
};

// Get meeting details
exports.getMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const token = generateVideoSDKToken();

    res.json({
      success: true,
      meeting: {
        id: roomId,
        roomId: roomId,
        topic: 'Live VA Training Session',
        status: 'active'
      },
      token: token,
      config: {
        roomId: roomId,
        token: token
      }
    });

  } catch (error) {
    console.error('Error fetching meeting:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting details',
      details: error.message
    });
  }
};

// Generate token for existing meeting
exports.generateToken = async (req, res) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
    }

    const token = generateVideoSDKToken();

    res.json({
      success: true,
      token: token,
      config: {
        roomId: roomId,
        token: token
      }
    });

  } catch (error) {
    console.error('Error generating token:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      details: error.message
    });
  }
};

// List user's meetings (VideoSDK doesn't have a list API, so we'll return a simple response)
exports.listMeetings = async (req, res) => {
  try {
    // VideoSDK doesn't maintain a list of rooms per user
    // You would typically store this in your own database
    res.json({
      success: true,
      meetings: [], // Would come from your database
      message: 'Meetings list would be maintained in your application database'
    });

  } catch (error) {
    console.error('Error listing meetings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to list meetings',
      details: error.message
    });
  }
};

// VideoSDK doesn't have update/delete functionality for rooms
// Rooms are temporary and expire automatically
exports.validateApiKey = async (req, res) => {
  try {
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        error: 'VideoSDK API credentials not configured'
      });
    }

    // Test token generation
    const token = generateVideoSDKToken();
    
    res.json({
      success: true,
      message: 'VideoSDK API credentials are valid',
      hasCredentials: true
    });

  } catch (error) {
    console.error('Error validating API key:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API credentials',
      details: error.message
    });
  }
};
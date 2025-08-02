const axios = require('axios');
const jwt = require('jsonwebtoken');

// VideoSDK Configuration
const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY || '56566ba5-1557-4699-8fd2-ba7edfe6ad0d';
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY || 'ddfbfc0007d1b5bb4765adf200733ace3dd05318b99c1d5f1622945ddf3b5e10';
const VIDEOSDK_API_ENDPOINT = 'https://api.videosdk.live/v2';

class VideoSDKClient {
  constructor() {
    this.apiKey = VIDEOSDK_API_KEY;
    this.secretKey = VIDEOSDK_SECRET_KEY;
    this.apiEndpoint = VIDEOSDK_API_ENDPOINT;
  }

  /**
   * Generate JWT token for VideoSDK authentication
   * @param {Object} options - Token options
   * @returns {String} JWT token
   */
  generateToken(options = {}) {
    const {
      permissions = ['allow_join', 'allow_mod'],
      expiresIn = '7d',
      roomId = null,
      participantId = null
    } = options;

    const payload = {
      apikey: this.apiKey,
      permissions,
      version: 2
    };

    if (roomId) payload.roomId = roomId;
    if (participantId) payload.participantId = participantId;

    return jwt.sign(payload, this.secretKey, {
      algorithm: 'HS256',
      expiresIn
    });
  }

  /**
   * Create a new meeting room
   * @param {Object} options - Room options
   * @returns {Promise<Object>} Room details
   */
  async createRoom(options = {}) {
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiEndpoint}/rooms`,
        {
          region: options.region || 'sg001',
          customRoomId: options.customRoomId,
          webhook: options.webhook,
          autoCloseConfig: options.autoCloseConfig || {
            type: 'session-end-and-deactivate',
            duration: 10 // minutes
          }
        },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating VideoSDK room:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Validate room exists and is active
   * @param {String} roomId - Room ID to validate
   * @returns {Promise<Boolean>} Is room valid
   */
  async validateRoom(roomId) {
    try {
      const token = this.generateToken();
      
      const response = await axios.get(
        `${this.apiEndpoint}/rooms/validate/${roomId}`,
        {
          headers: {
            'Authorization': token
          }
        }
      );

      return response.data.roomId === roomId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recording details
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Recording details
   */
  async getRecordings(sessionId) {
    try {
      const token = this.generateToken();
      
      const response = await axios.get(
        `${this.apiEndpoint}/sessions/${sessionId}/recordings`,
        {
          headers: {
            'Authorization': token
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recordings:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Start recording for a session
   * @param {String} roomId - Room ID
   * @param {Object} config - Recording configuration
   * @returns {Promise<Object>} Recording details
   */
  async startRecording(roomId, config = {}) {
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiEndpoint}/recordings/start`,
        {
          roomId,
          config: {
            layout: config.layout || {
              type: 'GRID',
              priority: 'SPEAKER',
              gridSize: 4
            },
            theme: config.theme || 'DARK',
            mode: config.mode || 'video-and-audio',
            quality: config.quality || 'high',
            orientation: config.orientation || 'landscape'
          }
        },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error starting recording:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Stop recording for a session
   * @param {String} roomId - Room ID
   * @param {String} recordingId - Recording ID
   * @returns {Promise<Object>} Recording details
   */
  async stopRecording(roomId, recordingId) {
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiEndpoint}/recordings/stop`,
        {
          roomId,
          recordingId
        },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error stopping recording:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Start live streaming
   * @param {String} roomId - Room ID
   * @param {Array} outputs - Streaming outputs (RTMP URLs)
   * @returns {Promise<Object>} Stream details
   */
  async startLiveStream(roomId, outputs) {
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiEndpoint}/livestreams/start`,
        {
          roomId,
          outputs: outputs.map(url => ({ url }))
        },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error starting live stream:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Stop live streaming
   * @param {String} roomId - Room ID
   * @param {String} streamId - Stream ID
   * @returns {Promise<Object>} Stream details
   */
  async stopLiveStream(roomId, streamId) {
    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiEndpoint}/livestreams/stop`,
        {
          roomId,
          streamId
        },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error stopping live stream:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get participant details for a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Participant details
   */
  async getParticipants(sessionId) {
    try {
      const token = this.generateToken();
      
      const response = await axios.get(
        `${this.apiEndpoint}/sessions/${sessionId}/participants`,
        {
          headers: {
            'Authorization': token
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching participants:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload video to VideoSDK storage
   * @param {Buffer} videoBuffer - Video file buffer
   * @param {String} fileName - File name
   * @returns {Promise<Object>} Upload details
   */
  async uploadVideo(videoBuffer, fileName) {
    try {
      const token = this.generateToken();
      const formData = new FormData();
      formData.append('video', videoBuffer, fileName);
      
      const response = await axios.post(
        `${this.apiEndpoint}/videos/upload`,
        formData,
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate token for participant
   * @param {String} roomId - Room ID
   * @param {String} participantId - Participant ID
   * @param {String} role - Participant role (host/guest)
   * @returns {String} Participant token
   */
  generateParticipantToken(roomId, participantId, role = 'guest') {
    const permissions = role === 'host' 
      ? ['allow_join', 'allow_mod', 'ask_join', 'allow_stream']
      : ['allow_join'];

    return this.generateToken({
      roomId,
      participantId,
      permissions,
      expiresIn: '24h'
    });
  }

  /**
   * Create a room for course lesson
   * @param {Object} lesson - Lesson details
   * @returns {Promise<Object>} Room details with token
   */
  async createLessonRoom(lesson) {
    try {
      const room = await this.createRoom({
        customRoomId: `lesson-${lesson._id}-${Date.now()}`,
        webhook: {
          endPoint: `${process.env.BACKEND_URL}/api/webhooks/videosdk`,
          events: ['session-started', 'session-ended', 'recording-started', 'recording-stopped']
        },
        autoCloseConfig: {
          type: 'session-end-and-deactivate',
          duration: 30 // 30 minutes after session ends
        }
      });

      return {
        roomId: room.roomId,
        hostToken: this.generateParticipantToken(room.roomId, 'host', 'host'),
        guestToken: this.generateParticipantToken(room.roomId, 'guest', 'guest')
      };
    } catch (error) {
      console.error('Error creating lesson room:', error);
      throw error;
    }
  }
}

// Create singleton instance
const videoSDKClient = new VideoSDKClient();

module.exports = {
  videoSDKClient,
  VideoSDKClient
};
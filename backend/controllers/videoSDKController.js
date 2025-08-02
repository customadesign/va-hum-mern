const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { videoSDKClient } = require('../utils/videosdk');

// @desc    Create meeting room for live lesson
// @route   POST /api/videosdk/rooms
// @access  Private (VA instructor)
exports.createRoom = async (req, res, next) => {
  try {
    const { lessonId, customRoomId } = req.body;

    // If lessonId provided, validate instructor owns the lesson
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId)
        .populate('course', 'instructor');
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: 'Lesson not found'
        });
      }

      if (lesson.course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to create room for this lesson'
        });
      }

      // Create room specifically for this lesson
      const roomData = await videoSDKClient.createLessonRoom(lesson);
      
      // Update lesson with room details
      lesson.content.liveSessionDetails = {
        ...lesson.content.liveSessionDetails,
        roomId: roomData.roomId,
        meetingId: roomData.roomId
      };
      await lesson.save();

      return res.status(201).json({
        success: true,
        data: {
          roomId: roomData.roomId,
          hostToken: roomData.hostToken
        }
      });
    }

    // Create general room
    const room = await videoSDKClient.createRoom({
      customRoomId,
      webhook: {
        endPoint: `${process.env.BACKEND_URL}/api/webhooks/videosdk`,
        events: ['session-started', 'session-ended', 'recording-started', 'recording-stopped']
      }
    });

    const hostToken = videoSDKClient.generateParticipantToken(room.roomId, req.user._id, 'host');

    res.status(201).json({
      success: true,
      data: {
        roomId: room.roomId,
        hostToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get meeting token for participant
// @route   POST /api/videosdk/token
// @access  Private
exports.getToken = async (req, res, next) => {
  try {
    const { roomId, lessonId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
    }

    let role = 'guest';
    let permissions = ['allow_join'];

    // If lessonId provided, check if user is instructor or enrolled
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId)
        .populate('course', 'instructor');
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: 'Lesson not found'
        });
      }

      // Check if user is instructor
      if (req.va && lesson.course.instructor.toString() === req.va._id.toString()) {
        role = 'host';
        permissions = ['allow_join', 'allow_mod', 'ask_join', 'allow_stream'];
      } else {
        // Check if user is enrolled
        const isEnrolled = await Enrollment.isUserEnrolled(req.user._id, lesson.course._id);
        if (!isEnrolled) {
          return res.status(403).json({
            success: false,
            error: 'You must be enrolled to join this live session'
          });
        }
      }
    }

    const token = videoSDKClient.generateParticipantToken(roomId, req.user._id, role);

    res.status(200).json({
      success: true,
      data: {
        token,
        roomId,
        role,
        permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Start recording
// @route   POST /api/videosdk/recording/start
// @access  Private (host only)
exports.startRecording = async (req, res, next) => {
  try {
    const { roomId, lessonId, config } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
    }

    // Verify user is authorized to record
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId)
        .populate('course', 'instructor');
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: 'Lesson not found'
        });
      }

      if (lesson.course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to record this session'
        });
      }
    }

    const recording = await videoSDKClient.startRecording(roomId, config);

    res.status(200).json({
      success: true,
      data: recording
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Stop recording
// @route   POST /api/videosdk/recording/stop
// @access  Private (host only)
exports.stopRecording = async (req, res, next) => {
  try {
    const { roomId, recordingId } = req.body;

    if (!roomId || !recordingId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and Recording ID are required'
      });
    }

    const recording = await videoSDKClient.stopRecording(roomId, recordingId);

    res.status(200).json({
      success: true,
      data: recording
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get recordings for a session
// @route   GET /api/videosdk/recordings/:sessionId
// @access  Private (instructor or enrolled)
exports.getRecordings = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const recordings = await videoSDKClient.getRecordings(sessionId);

    res.status(200).json({
      success: true,
      data: recordings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Start live stream
// @route   POST /api/videosdk/livestream/start
// @access  Private (host only)
exports.startLiveStream = async (req, res, next) => {
  try {
    const { roomId, outputs } = req.body;

    if (!roomId || !outputs || !Array.isArray(outputs)) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and outputs array are required'
      });
    }

    const stream = await videoSDKClient.startLiveStream(roomId, outputs);

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Stop live stream
// @route   POST /api/videosdk/livestream/stop
// @access  Private (host only)
exports.stopLiveStream = async (req, res, next) => {
  try {
    const { roomId, streamId } = req.body;

    if (!roomId || !streamId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and Stream ID are required'
      });
    }

    const stream = await videoSDKClient.stopLiveStream(roomId, streamId);

    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Handle VideoSDK webhooks
// @route   POST /api/webhooks/videosdk
// @access  Public (but verified by signature)
exports.handleWebhook = async (req, res, next) => {
  try {
    const { webhookType, data } = req.body;

    console.log('VideoSDK Webhook:', webhookType, data);

    switch (webhookType) {
      case 'session-started':
        // Log session start
        break;
      
      case 'session-ended':
        // Update lesson if it was a live session
        if (data.customRoomId && data.customRoomId.startsWith('lesson-')) {
          const lessonId = data.customRoomId.split('-')[1];
          const lesson = await Lesson.findById(lessonId);
          if (lesson) {
            lesson.content.liveSessionDetails.lastSessionEndedAt = new Date();
            await lesson.save();
          }
        }
        break;
      
      case 'recording-started':
        // Update lesson with recording status
        break;
      
      case 'recording-stopped':
        // Update lesson with recording URL when available
        if (data.recordingUrl && data.customRoomId && data.customRoomId.startsWith('lesson-')) {
          const lessonId = data.customRoomId.split('-')[1];
          const lesson = await Lesson.findById(lessonId);
          if (lesson) {
            lesson.content.liveSessionDetails.recordingUrl = data.recordingUrl;
            lesson.content.liveSessionDetails.isRecorded = true;
            
            // Also update as video lesson if it was live
            if (lesson.type === 'live') {
              lesson.content.videoUrl = data.recordingUrl;
              lesson.content.videoId = data.recordingId;
            }
            
            await lesson.save();
          }
        }
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  }
};

// @desc    Upload video file
// @route   POST /api/videosdk/upload
// @access  Private (VA instructor)
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only MP4, WebM, OGG, and MOV files are allowed'
      });
    }

    // Upload to VideoSDK storage
    const uploadResult = await videoSDKClient.uploadVideo(req.file.buffer, req.file.originalname);

    res.status(200).json({
      success: true,
      data: uploadResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Validate room
// @route   GET /api/videosdk/rooms/:roomId/validate
// @access  Private
exports.validateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const isValid = await videoSDKClient.validateRoom(roomId);

    res.status(200).json({
      success: true,
      data: {
        roomId,
        isValid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get participant analytics
// @route   GET /api/videosdk/sessions/:sessionId/participants
// @access  Private (instructor)
exports.getParticipants = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const participants = await videoSDKClient.getParticipants(sessionId);

    res.status(200).json({
      success: true,
      data: participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
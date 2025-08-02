# Video Course Feature Deployment Checklist

## Environment Variables for Render

The following environment variables need to be added to the Render deployment:

### VideoSDK Configuration
```
VIDEOSDK_API_KEY=56566ba5-1557-4699-8fd2-ba7edfe6ad0d
VIDEOSDK_SECRET_KEY=ddfbfc0007d1b5bb4765adf200733ace3dd05318b99c1d5f1622945ddf3b5e10
BACKEND_URL=https://linkage-va-hub.onrender.com
```

### Existing Environment Variables (ensure these are set)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - SendGrid from email
- `SUPABASE_URL` - Supabase URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `FRONTEND_URL` - Frontend URL
- `NODE_ENV=production` - Node environment
- `PORT` - Server port (usually auto-set by Render)

## Post-Deployment Steps

1. **Add Environment Variables in Render Dashboard**
   - Go to your Render service dashboard
   - Navigate to Environment → Environment Variables
   - Add the VideoSDK variables listed above
   - Save changes (this will trigger a redeploy)

2. **Run Seed Script**
   After deployment is complete, run the seed script to populate demo courses:
   ```bash
   npm run seed:courses
   ```
   
   This can be done via:
   - Render Shell (if available)
   - Or by creating a one-time job in Render
   - Or by running locally with production MongoDB URI

3. **Verify Deployment**
   - Check `/api/courses` endpoint returns courses
   - Test VideoSDK integration at `/api/courses/videosdk/token`
   - Verify course enrollment works

## API Endpoints Added

### Course Management
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (VA only)
- `PUT /api/courses/:id` - Update course (instructor/admin)
- `DELETE /api/courses/:id` - Delete course (instructor/admin)

### Course Enrollment
- `POST /api/courses/:id/enroll` - Enroll in course (Business only)
- `GET /api/courses/enrolled` - Get enrolled courses

### Lesson Management
- `GET /api/courses/:courseId/lessons` - Get course lessons
- `GET /api/courses/:courseId/lessons/:lessonId` - Get single lesson
- `POST /api/courses/:courseId/lessons` - Create lesson (instructor)
- `PUT /api/courses/:courseId/lessons/:lessonId` - Update lesson
- `DELETE /api/courses/:courseId/lessons/:lessonId` - Delete lesson

### Progress Tracking
- `POST /api/courses/:courseId/lessons/:lessonId/complete` - Mark lesson complete
- `GET /api/courses/:courseId/certificate` - Get course certificate

### VideoSDK Integration
- `POST /api/courses/videosdk/token` - Generate auth token
- `POST /api/courses/videosdk/rooms` - Create meeting room
- `POST /api/courses/videosdk/recording/start` - Start recording
- `POST /api/courses/videosdk/recording/stop` - Stop recording
- `POST /api/courses/videosdk/livestream/start` - Start livestream
- `POST /api/courses/videosdk/livestream/stop` - Stop livestream

## Database Models Added
- Course - Main course model
- Lesson - Individual lessons within courses
- Enrollment - Tracks user enrollments
- Progress - Tracks lesson completion progress

## Features Implemented
- Course catalog with search and filtering
- Course enrollment system
- Progress tracking
- VideoSDK integration for live sessions
- Certificate generation upon completion
- Instructor dashboard for course management
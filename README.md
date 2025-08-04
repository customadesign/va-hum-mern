# Linkage VA Hub - MERN Stack

A complete MERN stack implementation of the Linkage VA Hub platform, connecting businesses with talented Filipino virtual assistants.

## Features

- User authentication with JWT
- Two profile types: Virtual Assistants (VAs) and Businesses
- Real-time messaging between VAs and businesses
- Advanced search and filtering for VAs
- Profile management with image uploads
- Admin dashboard for site management
- Email notifications
- Referral system

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Query, React Router
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Authentication**: JWT, bcrypt
- **File Storage**: Local storage with Multer (can be configured for cloud storage)
- **Email**: Nodemailer

## Installation

### Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email configuration
   - Other settings

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API URL

5. Start the frontend development server:
   ```bash
   npm start
   ```

### Running Both Servers

From the root directory, you can run both servers concurrently:

```bash
npm run install-all  # Install all dependencies
npm run dev         # Start both servers
```

## Project Structure

```
linkage-va-hub-mern/
├── backend/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utility functions
│   ├── services/       # Business logic
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # Utility functions
│   └── public/         # Static files
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/confirm-email/:token` - Confirm email
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Virtual Assistants
- `GET /api/vas` - Get all VAs (with filters)
- `GET /api/vas/featured` - Get featured VAs
- `GET /api/vas/:id` - Get single VA
- `POST /api/vas` - Create VA profile
- `PUT /api/vas/:id` - Update VA profile
- `POST /api/vas/:id/avatar` - Upload VA avatar

### Businesses
- `GET /api/businesses/:id` - Get business profile
- `POST /api/businesses` - Create business profile
- `PUT /api/businesses/:id` - Update business profile
- `POST /api/businesses/:id/avatar` - Upload business avatar

### Conversations & Messages
- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Start new conversation
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/messages` - Send message
- `GET /api/messages/:conversationId` - Get messages for conversation

### Other
- `GET /api/specialties` - Get all specialties
- `GET /api/locations` - Get all locations
- `GET /api/notifications` - Get user notifications

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/linkage-va-hub
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@linkagewebsolutions.com
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NAME=Linkage VA Hub
```

## Development

1. The backend runs on `http://localhost:5000`
2. The frontend runs on `http://localhost:3000`
3. MongoDB should be running on `mongodb://localhost:27017`

## Deployment

### Backend
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible
3. Build and deploy the Node.js application

### Frontend
1. Build the React app: `npm run build`
2. Deploy the build folder to your hosting service
3. Configure environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.# Force deployment trigger

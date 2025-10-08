# Linkage VA Hub - Startup Guide

## Port Configuration

The application is configured to run on the following ports:

| Service | Port | URL |
|---------|------|-----|
| **Linkage Frontend** (Main) | 3000 | http://localhost:3000 |
| **E-Systems Frontend** | 3001 | http://localhost:3001 |
| **Admin Frontend** | 4000 | http://localhost:4000 |
| **Main Backend API** | 5000 | http://localhost:5000 |
| **E-Systems Backend API** | 5001 | http://localhost:5001 |

## Prerequisites

Before starting the services, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** installed and running
3. **npm** installed
4. All dependencies installed (run `npm run install-all` in the root directory)

## Starting Services

### Option 1: Start All Services (Recommended)

Run all services with a single command:

```bash
./start-all-services.sh
```

This will start:
- MongoDB (if not already running)
- Main Backend API (port 5000)
- E-Systems Backend API (port 5001)
- Linkage Frontend (port 3000)
- E-Systems Frontend (port 3001)
- Admin Frontend (port 4000)

### Option 2: Start Individual Services

Start specific services as needed:

#### Linkage (Main Application)
```bash
./start-linkage.sh
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

#### E-Systems
```bash
./start-esystems.sh
```
- Backend: http://localhost:5001
- Frontend: http://localhost:3001

#### Admin Dashboard
```bash
./start-admin.sh
```
- Uses main backend: http://localhost:5000
- Admin UI: http://localhost:4000

### Option 3: Manual Start

Start services manually using npm commands:

#### Backend Services
```bash
# Main backend
cd backend
PORT=5000 npm run dev

# E-Systems backend (in a new terminal)
cd backend
ESYSTEMS_MODE=true PORT=5001 npm run dev
```

#### Frontend Services
```bash
# Linkage frontend (in a new terminal)
cd frontend
PORT=3000 npm start

# E-Systems frontend (in a new terminal)
cd esystems-frontend
PORT=3001 npm start

# Admin frontend (in a new terminal)
cd admin-frontend
PORT=4000 npm start
```

## Environment Configuration

Make sure to create `.env` files in the backend directory based on `.env.example`:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLIENT_URL`: http://localhost:3000
- `ESYSTEMS_CLIENT_URL`: http://localhost:3001
- `ADMIN_URL`: http://localhost:4000

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error, you can kill the process using the port:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use the cleanup command
lsof -ti:3000 | xargs kill -9
```

### MongoDB Not Running

Start MongoDB:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod --dbpath /usr/local/var/mongodb
```

### Dependencies Not Installed

Install all dependencies:

```bash
# From root directory
npm run install-all
```

## Logs

When using the startup scripts, logs are saved in the `./logs` directory:
- `backend-main.log` - Main backend logs
- `backend-esystems.log` - E-Systems backend logs
- `frontend-linkage.log` - Linkage frontend logs
- `frontend-esystems.log` - E-Systems frontend logs
- `frontend-admin.log` - Admin frontend logs

## Stopping Services

To stop all services:
- If using startup scripts: Press `Ctrl+C`
- The script will automatically clean up all processes

## Development Tips

1. **Check Service Status**: Visit each URL to verify services are running
2. **Monitor Logs**: Check the `./logs` directory for any errors
3. **Database Connection**: Ensure MongoDB is running before starting backend services
4. **API Testing**: Use tools like Postman to test backend APIs directly
5. **Hot Reload**: Both frontend and backend support hot reload in development mode
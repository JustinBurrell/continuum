# Continuum Backend

Backend API server for Continuum application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/continuum

# JWT Secret (will be used in Sprint 1)
JWT_SECRET=your-secret-key-change-in-production

# Google OAuth (will be used in Sprint 1)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

3. Make sure MongoDB is running locally or update `MONGODB_URI` to your MongoDB connection string.

4. Start the server:
```bash
npm start
```

## Health Check

Visit `http://localhost:5000/health` to verify the server is running.

## Project Structure

```
backend/
├── config/          # Configuration files (database, etc.)
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── server.js        # Entry point
└── .env            # Environment variables (not in git)
```

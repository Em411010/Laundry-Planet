# Laundry Planet - Setup Guide

## MongoDB Setup

1. **Install MongoDB** (if not already installed):
   - Download from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud)

2. **Start MongoDB locally**:
   ```bash
   # Windows
   mongod
   
   # Or if MongoDB is installed as a service, it should start automatically
   ```

## Running the Application

### Backend Server

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```
   
   The backend will run on `http://localhost:5000`

### Frontend Application

1. Open a new terminal and navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:5173`

## User Roles

The system has 3 user roles:

1. **Client** (default for new registrations)
   - Dashboard: `/dashboard/client`
   
2. **Staff**
   - Dashboard: `/dashboard/staff`
   
3. **Admin**
   - Dashboard: `/dashboard/admin`

## Testing the Application

1. **Register a new account**:
   - Go to `http://localhost:5173/register`
   - Fill in your details
   - New accounts are created with "client" role by default
   
2. **Login**:
   - Go to `http://localhost:5173/login`
   - Use your registered email and password
   - You'll be redirected to the appropriate dashboard based on your role

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

## Environment Variables

Backend `.env` file is configured with:
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/laundry-planet`
- `JWT_SECRET=your_jwt_secret_key_change_this_in_production`
- `NODE_ENV=development`

⚠️ **Important**: Change the JWT_SECRET in production!

## Notes

- All dashboards currently display "Still Under Development" message
- Default role for new registrations is "client"
- To create staff or admin users, you'll need to update the role directly in the database or create an admin panel (future feature)

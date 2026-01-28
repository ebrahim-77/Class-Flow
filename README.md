# ClassFlow - Complete Setup Guide

Full-stack classroom management system with React frontend and Node.js backend.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Configure environment (already done, but verify .env file)
# Make sure MONGODB_URI points to your MongoDB instance

# Seed the database with sample data
node seed.js

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

✅ **Sample Credentials:**
- Admin: `admin@classflow.com` / `admin123`
- Student: `jamil@student.com` / `password123`
- Teacher: `sarah@teacher.com` / `password123`

### 2. Frontend Setup

```bash
# Navigate to frontend folder (in new terminal)
cd frontend

# Dependencies are already installed

# Start frontend development server
npm run dev
```

Frontend will run on: **http://localhost:5174**

### 3. Access Application

Open your browser and go to: **http://localhost:5174**

Login with any of the sample credentials above!

## Architecture

### Backend (Port 5000)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT tokens
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt

### Frontend (Port 5174)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Features by Role

### Student
- View class timetable
- Book rooms for study/events
- View and manage bookings
- Request teacher role upgrade

### Teacher
- All student features
- Post class schedules
- Manage own schedules
- View teaching timetable

### Admin
- All teacher features
- Approve/reject teacher requests
- Approve/reject room bookings
- Manage rooms (CRUD operations)
- View system statistics

## API Integration

The frontend is now connected to the real backend API:

- **Authentication**: Real JWT-based auth with token storage
- **Auto-retry**: Axios interceptors handle token expiration
- **Error handling**: User-friendly error messages
- **Loading states**: UI feedback during API calls

## Database Models

1. **User** - Authentication and user management
2. **TeacherRequest** - Teacher role upgrade requests
3. **Room** - Classroom and facility information
4. **Schedule** - Class timetables and schedules
5. **Booking** - Room booking requests and approvals

## Development Commands

### Backend
```bash
npm start          # Production mode
npm run dev        # Development with nodemon
node seed.js       # Reseed database
```

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## Testing the System

### 1. Test Authentication
- Register a new student account
- Login with sample credentials
- Verify token is stored in localStorage
- Check user role-based navigation

### 2. Test Student Features
- Login as student (`jamil@student.com`)
- View timetable
- Book a room
- Submit teacher role request

### 3. Test Teacher Features
- Login as teacher (`sarah@teacher.com`)
- Post a new schedule
- Verify conflict detection
- View your classes

### 4. Test Admin Features
- Login as admin (`admin@classflow.com`)
- Approve/reject teacher requests
- Approve/reject booking requests
- Add/edit/delete rooms
- View all statistics

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
mongod --version

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/classflow
```

**Port 5000 already in use:**
Change PORT in `backend/.env` and update frontend API_URL in `frontend/src/api.ts`

### Frontend Issues

**API Connection Error:**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_URL in `frontend/src/api.ts`

**Login Not Working:**
- Clear browser localStorage
- Check network tab for API response
- Verify backend seed.js was run

## Next Steps

### Enhancements
1. Add email notifications (nodemailer)
2. Implement file uploads (profile pictures, room images)
3. Add real-time updates (Socket.io)
4. Create admin dashboard analytics
5. Add calendar view for bookings
6. Implement search and filters
7. Add pagination for large datasets
8. Create mobile-responsive design improvements

### Production Deployment
1. Set up environment variables
2. Configure production MongoDB
3. Set up proper CORS origins
4. Enable HTTPS
5. Add rate limiting
6. Set up logging and monitoring
7. Deploy backend (Heroku, Railway, AWS)
8. Deploy frontend (Vercel, Netlify)

## Project Structure

```
Class-flow/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── .env
│   ├── server.js
│   ├── seed.js
│   └── package.json
│
└── frontend/
    ├── components/
    ├── context/
    ├── src/
    │   └── api.ts
    ├── public/
    ├── index.html
    └── package.json
```

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend terminal for API errors
3. Verify MongoDB is running
4. Clear browser cache and localStorage
5. Restart both servers

---

**ClassFlow** - Modern Classroom Management System
Built with MERN Stack (MongoDB, Express, React, Node.js)

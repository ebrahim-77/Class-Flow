# ClassFlow Backend

Node.js/Express backend for the ClassFlow classroom management system.

## Setup Instructions

### 1. Install MongoDB

Download and install MongoDB Community Edition from: https://www.mongodb.com/try/download/community

Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/classflow
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
```

### 4. Seed Database

Run the seed script to populate initial data:

```bash
node seed.js
```

This creates:
- **Admin**: admin@classflow.com / admin123
- **Student**: jamil@student.com / password123
- **Teacher**: sarah@teacher.com / password123
- Sample rooms

### 5. Start Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Teacher Requests
- `POST /api/teacher-requests` - Submit request (Student)
- `GET /api/teacher-requests` - Get all requests (Admin)
- `GET /api/teacher-requests/my-request` - Get my request
- `PUT /api/teacher-requests/:id/approve` - Approve request (Admin)
- `PUT /api/teacher-requests/:id/reject` - Reject request (Admin)
- `GET /api/teacher-requests/stats` - Get statistics (Admin)

### Rooms
- `POST /api/rooms` - Create room (Admin)
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `PUT /api/rooms/:id` - Update room (Admin)
- `DELETE /api/rooms/:id` - Delete room (Admin)
- `GET /api/rooms/available/list` - Get available rooms

### Schedules
- `POST /api/schedules` - Create schedule (Teacher)
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/my-classes` - Get my classes
- `GET /api/schedules/upcoming` - Get upcoming classes
- `PUT /api/schedules/:id` - Update schedule (Teacher/Admin)
- `DELETE /api/schedules/:id` - Delete schedule (Teacher/Admin)
- `POST /api/schedules/check-conflict` - Check conflicts

### Bookings
- `POST /api/bookings` - Create booking (Student/Teacher)
- `GET /api/bookings` - Get all bookings (Admin)
- `GET /api/bookings/my-bookings` - Get my bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/approve` - Approve booking (Admin)
- `PUT /api/bookings/:id/reject` - Reject booking (Admin)
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/stats/summary` - Get statistics (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats (role-based)
- `GET /api/dashboard/upcoming-classes` - Get upcoming classes

## Testing

Test the API with:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@classflow.com","password":"admin123"}'
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── models/
│   ├── User.js            # User model
│   ├── TeacherRequest.js  # Teacher request model
│   ├── Room.js            # Room model
│   ├── Schedule.js        # Schedule model
│   └── Booking.js         # Booking model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User routes
│   ├── teacherRequests.js # Teacher request routes
│   ├── rooms.js           # Room routes
│   ├── schedules.js       # Schedule routes
│   ├── bookings.js        # Booking routes
│   └── dashboard.js       # Dashboard routes
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── validators.js      # Request validation
│   └── errorHandler.js    # Error handling
├── utils/
│   └── auth.js            # JWT utilities
├── .env                   # Environment variables
├── .env.example           # Example environment file
├── server.js              # Express server
├── seed.js                # Database seeding
└── package.json           # Dependencies
```

## Technologies

- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Validation
- **Helmet** - Security
- **CORS** - Cross-origin requests
- **Morgan** - Logging

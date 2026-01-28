# ClassFlow Troubleshooting Guide

## Common Issues and Solutions

### 1. Login/Registration Not Working

#### Symptoms
- "Login failed" error message
- "Network error" in browser console
- Nothing happens when clicking Sign In

#### Solutions

**Step 1: Check Backend Server**
```bash
# Open terminal in backend folder
cd backend

# Start the server
npm run dev
```

Server should show:
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

**Step 2: Check MongoDB**
```bash
# Check if MongoDB is running
mongosh

# Or check service status (Windows)
net start | findstr MongoDB

# Start MongoDB if not running (Windows)
net start MongoDB
```

**Step 3: Test Backend API**
Open browser and go to: `http://localhost:5000/api/health`

Should show: `{"status":"ok","message":"ClassFlow API is running"}`

**Step 4: Check Browser Console**
1. Open DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for error messages

**Common Errors:**

**a) CORS Error**
```
Access to XMLHttpRequest at 'http://localhost:5000' from origin 'http://localhost:5174' has been blocked by CORS policy
```
**Fix:** Already configured in backend. Restart backend server.

**b) Network Error / ERR_CONNECTION_REFUSED**
```
Network Error
AxiosError: Request failed with status code...
```
**Fix:** Backend server is not running. Start it with `npm run dev` in backend folder.

**c) 401 Unauthorized**
```
Login failed: Invalid credentials
```
**Fix:** Use correct demo credentials:
- Student: `jamil@student.com` / `password123`
- Teacher: `sarah@teacher.com` / `password123`
- Admin: `admin@classflow.com` / `admin123`

### 2. Admin Account Not Working

#### Create/Recreate Admin Account

**Option 1: Use createAdmin Script**
```bash
cd backend
node createAdmin.js
```

**Option 2: Reseed Database**
```bash
cd backend
node seed.js
```

**Option 3: Manual Creation in MongoDB Compass**
1. Connect to `mongodb://localhost:27017`
2. Open `classflow` database
3. Open `users` collection
4. Insert document:
```json
{
  "name": "Admin User",
  "email": "admin@classflow.com",
  "password": "$2a$10$sampleHashedPassword",
  "role": "admin",
  "teacherRequestStatus": "none",
  "createdAt": "2026-01-27T00:00:00.000Z",
  "updatedAt": "2026-01-27T00:00:00.000Z"
}
```
**Note:** Password will be hashed automatically when you login and change it.

### 3. How to Approve Teacher Requests

#### Step-by-Step Guide

**Step 1: Student Submits Request**
1. Student logs in (`jamil@student.com` / `password123`)
2. Clicks "Request Teacher Role" in sidebar
3. Fills out department and reason
4. Submits request

**Step 2: Admin Approves Request**
1. Login as admin (`admin@classflow.com` / `admin123`)
2. Click "Teacher Requests" in sidebar
3. See all pending requests
4. Click "Approve" button next to request
5. Request status changes to "Approved"

**Step 3: Student Becomes Teacher**
1. Student logs out and logs back in
2. Sidebar now shows teacher features:
   - Post Schedule
   - My Bookings
   - Timetable (with teaching view)

**Admin Dashboard Features:**
- **Teacher Requests**: Approve/reject teacher role upgrades
- **Booking Requests**: Approve/reject room bookings
- **Manage Rooms**: Add, edit, delete rooms
- **Statistics**: View system metrics

### 4. Port Already in Use

#### Backend Port 5000
```bash
# Windows - Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

#### Frontend Port 5174
```bash
# Usually handled by Vite automatically
# If needed, change port in vite.config.js
```

### 5. Database Connection Issues

#### MongoDB Not Running

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod --dbpath "C:\data\db"
```

**Check Connection String**
In `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/classflow
```

Or use MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/classflow
```

### 6. Frontend Not Loading

#### Clear Cache and Restart
```bash
cd frontend

# Clear node_modules cache
rm -rf node_modules
npm install

# Start dev server
npm run dev
```

### 7. API Endpoints Not Working

#### Test Individual Endpoints

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@classflow.com\",\"password\":\"admin123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@classflow.com",
    "role": "admin"
  }
}
```

**Test Get Rooms:**
```bash
# Get auth token first, then:
curl -X GET http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Environment Variables

#### Check .env File Exists
```bash
cd backend
cat .env  # or type .env on Windows
```

Should contain:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/classflow
JWT_SECRET=classflow_secret_key_2026_change_in_production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
```

### 9. Dependencies Missing

#### Reinstall Dependencies

**Backend:**
```bash
cd backend
rm -rf node_modules
npm install
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules
npm install
```

### 10. Quick Reset Everything

#### Complete Reset (Nuclear Option)
```bash
# 1. Stop all servers (Ctrl+C in terminals)

# 2. Drop MongoDB database
mongosh
use classflow
db.dropDatabase()
exit

# 3. Reinstall backend
cd backend
rm -rf node_modules
npm install
node seed.js

# 4. Reinstall frontend
cd ../frontend
rm -rf node_modules
npm install

# 5. Start both servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### Verification Checklist

Before asking for help, verify:

- [ ] MongoDB is running (`mongosh` connects successfully)
- [ ] Backend server is running (port 5000)
- [ ] Frontend server is running (port 5174)
- [ ] `.env` file exists in backend folder
- [ ] Browser console shows no errors
- [ ] Network tab shows API calls are being made
- [ ] Using correct credentials (check demo accounts)

### Still Having Issues?

1. Check browser console (F12 → Console)
2. Check backend terminal for errors
3. Check MongoDB is running (`mongosh`)
4. Try the complete reset steps above
5. Check firewall isn't blocking ports 5000 or 5174

---

## Quick Command Reference

```bash
# Start MongoDB (Windows)
net start MongoDB

# Backend commands
cd backend
npm install              # Install dependencies
node seed.js            # Seed database
node createAdmin.js     # Create admin user
npm run dev             # Start dev server
npm start               # Start production server

# Frontend commands
cd frontend
npm install             # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production

# Testing
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@classflow.com\",\"password\":\"admin123\"}"

# MongoDB commands
mongosh                          # Connect to MongoDB
use classflow                    # Switch to classflow db
db.users.find()                  # List all users
db.users.find({role: "admin"})   # Find admin users
```

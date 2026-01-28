const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Room = require('./models/Room');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@classflow.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create sample users
    const student1 = await User.create({
      name: 'jamil',
      email: 'jamil@student.com',
      password: 'password123',
      role: 'student',
      department: 'Computer Science'
    });

    const teacher1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah@teacher.com',
      password: 'password123',
      role: 'teacher',
      department: 'Computer Science'
    });

    console.log('✅ Created users');

    // Create sample rooms
    const rooms = await Room.insertMany([
      { name: 'B-210', building: 'Building B', floor: '2nd Floor', capacity: 30, features: ['Wifi', 'Projector', 'Whiteboard', 'AC'], status: 'available' },
      { name: 'C-105', building: 'Building C', floor: '1st Floor', capacity: 50, features: ['Wifi', 'Projector', 'AC', 'Sound System'], status: 'available' },
      { name: 'A-301', building: 'Building A', floor: '3rd Floor', capacity: 40, features: ['Wifi', 'Projector', 'Whiteboard', 'AC'], status: 'available' },
      { name: 'B-105', building: 'Building B', floor: '1st Floor', capacity: 25, features: ['Wifi', 'Whiteboard'], status: 'available' },
      { name: 'C-202', building: 'Building C', floor: '2nd Floor', capacity: 35, features: ['Wifi', 'Projector'], status: 'maintenance' },
      { name: 'A-405', building: 'Building A', floor: '4th Floor', capacity: 60, features: ['Wifi', 'Projector', 'AC', 'Sound System', 'Microphone'], status: 'available' },
      { name: 'B-308', building: 'Building B', floor: '3rd Floor', capacity: 45, features: ['Wifi', 'Projector', 'Whiteboard'], status: 'available' },
      { name: 'Lab 3', building: 'Building C', floor: '3rd Floor', capacity: 30, features: ['Wifi', 'Computers', 'Projector'], status: 'available' }
    ]);

    console.log('✅ Created rooms');

    console.log('\n📝 Sample credentials:');
    console.log('Admin: admin@classflow.com / admin123');
    console.log('Student: jamil@student.com / password123');
    console.log('Teacher: sarah@teacher.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

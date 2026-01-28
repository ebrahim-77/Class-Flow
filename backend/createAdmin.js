const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const email = 'admin@classflow.com';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log('   Email:', email);
      console.log('   Role:', existingAdmin.role);
      console.log('\n💡 Admin credentials:');
      console.log('   Email: admin@classflow.com');
      console.log('   Password: admin123');
      
      if (existingAdmin.role !== 'admin') {
        console.log('\n⚠️  Warning: User exists but is not an admin!');
        console.log('   Updating role to admin...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User role updated to admin!');
      }
      
      process.exit(0);
    }

    // Create new admin user
    const admin = await User.create({
      name: 'Admin User',
      email: email,
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📝 Admin Credentials:');
    console.log('   Email: admin@classflow.com');
    console.log('   Password: admin123');
    console.log('\n🔐 Please change the password after first login!');
    console.log('\n🎯 You can now:');
    console.log('   1. Login at http://localhost:5174');
    console.log('   2. Approve teacher requests');
    console.log('   3. Manage rooms');
    console.log('   4. Approve booking requests');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

console.log('🚀 Creating admin user...\n');
createAdmin();

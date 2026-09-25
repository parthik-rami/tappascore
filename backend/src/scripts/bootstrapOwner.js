import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const bootstrapOwner = async () => {
  try {
    console.log('🔄 Connecting to MongoDB for Owner Bootstrap...');
    await connectDB();

    // 1. Check if an Owner already exists in system
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      console.error('❌ ERROR: An Owner account already exists in this database.');
      console.error(`   Existing Owner User ID: ${existingOwner._id}`);
      console.error('   Owner creation is permanently blocked to prevent unauthorized escalation.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // 2. Read bootstrap env vars
    const email = process.env.OWNER_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.OWNER_BOOTSTRAP_PASSWORD;
    const name = process.env.OWNER_BOOTSTRAP_NAME?.trim() || 'App Owner';

    if (!email || !password) {
      console.error('❌ ERROR: Missing required environment variables:');
      console.error('   Please set OWNER_BOOTSTRAP_EMAIL and OWNER_BOOTSTRAP_PASSWORD in backend/.env');
      await mongoose.connection.close();
      process.exit(1);
    }

    // 3. Check if user with target email already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`ℹ️ User with email ${email} already exists. Promoting to Owner role...`);
      user.role = 'owner';
      user.isActive = true;
      if (password) {
        user.password = password; // Will trigger pre('save') scrypt hash
      }
      await user.save();
      console.log(`✅ SUCCESS: Existing user promoted to Owner role.`);
      console.log(`   Owner User ID: ${user._id}`);
    } else {
      console.log(`✨ Creating new Owner account for ${email}...`);
      user = new User({
        name,
        email,
        password,
        role: 'owner',
        isActive: true,
      });
      await user.save();
      console.log(`✅ SUCCESS: Owner account created successfully.`);
      console.log(`   Owner User ID: ${user._id}`);
    }

    await mongoose.connection.close();
    console.log('🔒 Owner bootstrap finished cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR during Owner bootstrap:', err);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

bootstrapOwner();

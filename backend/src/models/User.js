import mongoose from 'mongoose';
import crypto from 'crypto';
import util from 'util';

const scrypt = util.promisify(crypto.scrypt);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    statsVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    role: {
      type: String,
      enum: ['user', 'owner'],
      default: 'user',
    },
    failedOwnerLoginAttempts: {
      type: Number,
      default: 0,
    },
    notificationPreferences: {
      matchLifecycle: {
        type: Boolean,
        default: true,
      },
      playerStats: {
        type: Boolean,
        default: true,
      },
      reviewAccount: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password securely with crypto.scrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(this.password, salt, 64);
  this.password = `${salt}:${derivedKey.toString('hex')}`;
});

// Compare password helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const [salt, storedHash] = this.password.split(':');
  if (!salt || !storedHash) return false;
  const derivedKey = await scrypt(candidatePassword, salt, 64);
  return crypto.timingSafeEqual(
    Buffer.from(storedHash, 'hex'),
    Buffer.from(derivedKey.toString('hex'), 'hex')
  );
};

const User = mongoose.model('User', userSchema);

export default User;

import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    matchId: {
      type: String,
      default: null,
    },
    hidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// We define index on normalizedEmail. We won't strictly enforce unique: true on the schema if existing duplicate emails exist,
// but our submit review controller will enforce 1 normalized email = 1 review or duplicate check.

const Review = mongoose.model('Review', reviewSchema);

export default Review;

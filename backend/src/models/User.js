import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CROP_IDS } from '../data/crops.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 4, select: false },
    location: { type: String, trim: true, default: '' },
    crop: { type: String, enum: CROP_IDS, default: 'sugarcane' },
    sowingDate: { type: Date, default: Date.now },
    // Cached result of geocoding `location`, used for weather lookups.
    coords: {
      lat: Number,
      lon: Number,
      label: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('location')) this.coords = undefined;
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    location: this.location,
    crop: this.crop,
    sowingDate: this.sowingDate,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);

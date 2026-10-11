import mongoose from 'mongoose';

const irrigationEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    waterMm: { type: Number, required: true, min: 1, max: 200 },
    moistureBefore: Number,
    moistureAfter: Number,
    note: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

irrigationEventSchema.index({ user: 1, createdAt: -1 });

irrigationEventSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    return ret;
  },
});

export default mongoose.model('IrrigationEvent', irrigationEventSchema);

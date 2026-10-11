import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['critical', 'warning', 'normal'], required: true },
    // Identifies the rule that raised the alert, so the same condition
    // doesn't create a new alert on every reading.
    code: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

alertSchema.index({ user: 1, createdAt: -1 });

alertSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    return ret;
  },
});

export default mongoose.model('Alert', alertSchema);

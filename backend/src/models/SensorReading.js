import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    soilMoisture: { type: Number, required: true, min: 0, max: 100 }, // %
    temperature: { type: Number, required: true, min: -20, max: 60 }, // °C
    humidity: { type: Number, required: true, min: 0, max: 100 },     // %
    rainfall: { type: Number, default: 0, min: 0 },                   // mm
    waterLevel: { type: Number, default: 0, min: 0, max: 100 },       // % of tank/reservoir
    source: { type: String, enum: ['device', 'simulated', 'manual'], default: 'device' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

sensorReadingSchema.index({ user: 1, createdAt: -1 });

sensorReadingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    return ret;
  },
});

export default mongoose.model('SensorReading', sensorReadingSchema);

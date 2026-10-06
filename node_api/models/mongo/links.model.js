import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    link: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Link', linkSchema);

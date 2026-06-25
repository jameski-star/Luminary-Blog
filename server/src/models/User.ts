import crypto from 'crypto';
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin';
  joinedAt: Date;
  postsCount: number;
  verified: boolean;
  verificationTokenHash?: string;
  banned?: boolean;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  joinedAt: { type: Date, default: Date.now },
  postsCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationTokenHash: { type: String },
  banned: { type: Boolean, default: false },
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc: any, ret: any) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    if (ret.verificationTokenHash) delete ret.verificationTokenHash;
    return ret;
  }
});

userSchema.index({ email: 1 }, { unique: true });

export function generateVerificationToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export const User = mongoose.model<IUser>('User', userSchema);

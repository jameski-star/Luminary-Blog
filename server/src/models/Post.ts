import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  htmlContent?: string;
  coverImage?: string;
  tags: string[];
  keywords: string[];
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorAvatar?: string;
  publishedAt: Date;
  modifiedAt: Date;
  status: 'draft' | 'quarantined' | 'published' | 'review' | 'disapproved';
  readTime: number;
  views: number;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  auditScore?: number;
  wordCount: number;
  isApproved?: boolean;
  editorialIntelligence?: any;
}

const postSchema = new Schema<IPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },
  htmlContent: { type: String },
  coverImage: { type: String },
  tags: [{ type: String }],
  keywords: [{ type: String }],
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  publishedAt: { type: Date, default: () => new Date() },
  modifiedAt: { type: Date, default: () => new Date() },
  status: {
    type: String,
    enum: ['draft', 'quarantined', 'published', 'review', 'disapproved'],
    default: 'draft',
  },
  readTime: { type: Number, default: 1 },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  auditScore: { type: Number },
  wordCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  editorialIntelligence: { type: Schema.Types.Mixed },
});

postSchema.index({ status: 1, isApproved: 1, publishedAt: -1 });
postSchema.index({ authorId: 1, status: 1 });
postSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text', keywords: 'text' });

postSchema.set('toJSON', {
  virtuals: true,
  transform(_doc: any, ret: any) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    if (ret.authorId) ret.authorId = String(ret.authorId);
    if (ret.likedBy) ret.likedBy = (ret.likedBy as any[]).map((id: any) => String(id));
    return ret;
  }
});

export const Post = mongoose.model<IPost>('Post', postSchema);

# Chapter 8 — MongoDB & Mongoose

MongoDB is a **document database** — it stores JSON-like objects (documents) in collections (like tables).

## Documents vs SQL tables

```
SQL (relational):               MongoDB (document):
┌─────────────┐                ┌─────────────────────────┐
│   users                      │  users (collection)      │
│  id  name  email             │  { _id: ObjectId,       │
│ ─────────────────            │    name: "Alice",       │
│  1  Alice  a@b.com           │    email: "a@b.com" }   │
│  2  Bob    b@b.com           │  { _id: ObjectId,       │
└─────────────┘                │    name: "Bob",         │
                               │    email: "b@b.com" }   │
                               └─────────────────────────┘
```

**Key difference:** MongoDB documents can have different fields. SQL tables have rigid columns.

## Mongoose — the bridge

Mongoose is an **ODM** (Object Document Mapper). It connects your Express code to MongoDB:

```typescript
import mongoose from 'mongoose';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');
```

## Schemas & Models

A **schema** defines the shape of documents. A **model** is the class you use to query:

```typescript
// server/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the TypeScript interface
interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  joinedAt: Date;
}

// 2. Create the Mongoose schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  joinedAt: { type: Date, default: Date.now },
});

// 3. Create and export the model
export const User = mongoose.model<IUser>('User', UserSchema);
```

## Schema field types

```
String, Number, Boolean, Date, Buffer, ObjectId, Array, Mixed (any)
```

Field options:
```typescript
{
  type: String,
  required: true,        // must be present
  unique: true,          // no duplicates across documents
  default: 'default',    // value if not provided
  lowercase: true,       // auto-transform
  enum: ['a', 'b'],      // must be one of these
  trim: true,            // remove whitespace
}
```

## CRUD operations

```typescript
// CREATE
const user = await User.create({
  name: 'Alice',
  email: 'alice@example.com',
  passwordHash: hashedPassword,
});

// READ
const all = await User.find();                              // all documents
const some = await User.find({ role: 'admin' });            // with filter
const one = await User.findById('abc123');                  // by _id
const oneByEmail = await User.findOne({ email: 'a@b.com' });

// UPDATE
await User.findByIdAndUpdate(id, { name: 'New Name' });
await User.updateMany({ role: 'user' }, { $set: { role: 'admin' } });

// DELETE
await User.findByIdAndDelete(id);
await User.deleteMany({ role: 'user' });
```

## The Post schema in this project

Open `server/src/models/Post.ts`:

```typescript
const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: '' },
  coverImage: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'review', 'quarantined'],
    default: 'draft',
  },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  tags: [String],
  readTime: Number,
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  auditScore: Number,
}, { timestamps: true });  // auto adds createdAt, updatedAt
```

## toJSON transform

Mongoose models have a `toJSON` method. Add a transform to clean up output:

```typescript
PostSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();   // convert ObjectId to string
    delete ret._id;                 // remove MongoDB's _id
    delete ret.__v;                 // remove version key
    return ret;
  },
});
```

This is why the frontend uses `post.id` instead of `post._id`.

## Relationships (references)

MongoDB doesn't have SQL-style joins. You store related data differently:

```typescript
// Option 1: Reference (like a foreign key)
const PostSchema = new Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Option 2: Embed (store data inside the document)
const PostSchema = new Schema({
  authorName: String,  // copied from User (denormalized)
});
```

This project uses **Option 2** — `authorName` is stored directly on the post. This avoids needing a join when displaying posts.

## Indexing

Indexes speed up queries:

```typescript
PostSchema.index({ slug: 1 }, { unique: true });
PostSchema.index({ status: 1, publishedAt: -1 });  // common query pattern
```

## Using models in routes

```typescript
// server/src/routes/posts.ts
router.get('/', async (req, res) => {
  const posts = await Post.find({ status: 'published' })
    .sort({ publishedAt: -1 })     // newest first
    .select('-content')            // exclude body (too large for list)
    .limit(20);                    // pagination

  res.json({ posts });
});
```

## Seed script

The seed script creates an initial admin if the database is empty:

```typescript
// server/src/seed.ts
export async function seed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Users already exist, skipping seed.');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      email: adminEmail.toLowerCase().trim(),
      name: process.env.ADMIN_NAME || 'Admin',
      passwordHash,
      role: 'admin',
    });
  }
}
```

## Your practice

Create a Task model and use it in a route:

```typescript
// models/Task.ts
const TaskSchema = new Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

TaskSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Task = mongoose.model('Task', TaskSchema);
```

```typescript
// routes/tasks.ts
router.get('/', async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json({ tasks });
});

router.post('/', async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json({ task });
});
```

In [Chapter 9](09-auth.md), you'll learn authentication with JWT.

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from './config.js';
import { User } from './models/User.js';
import { Post } from './models/Post.js';

export async function seed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Users already exist, skipping seed.');
    return;
  }

  // Create initial admin if ADMIN_EMAIL and ADMIN_PASSWORD are set
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const user = await User.create({
      email: adminEmail.toLowerCase().trim(),
      name: process.env.ADMIN_NAME || 'Admin',
      passwordHash,
      role: 'admin',
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log('No users found. First user to sign up via the UI will become admin automatically.');
    console.log('To pre-create an admin, set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  }
}

// Run directly: tsx src/seed.ts
const isMain = process.argv[1]?.endsWith('/seed.ts') || process.argv[1]?.endsWith('\\seed.ts');
if (isMain) {
  mongoose.connect(config.mongoUri)
    .then(() => seed())
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

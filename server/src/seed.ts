import mongoose from 'mongoose';
import { config } from './config';
import { User } from './models/User';
import { Post } from './models/Post';

export async function seed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Users already exist, skipping seed.');
    return;
  }

  console.log('Demo seed skipped — no demo data will be created.');
}

// Run directly: tsx src/seed.ts
const isMain = process.argv[1]?.endsWith('/seed.ts') || process.argv[1]?.endsWith('\\seed.ts');
if (isMain) {
  mongoose.connect(config.mongoUri)
    .then(() => seed())
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/luminary',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiApiKey2: process.env.GEMINI_API_KEY_2 || '',
  geminiApiKey3: process.env.GEMINI_API_KEY_3 || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@luminary.blog',
};

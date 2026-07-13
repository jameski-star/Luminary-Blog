import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/luminary',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  serperApiKey: process.env.SERPER_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiApiKey2: process.env.GEMINI_API_KEY_2 || '',
  geminiApiKey3: process.env.GEMINI_API_KEY_3 || '',
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'e3986e39a05965fb562e64afe3673efc',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  nvidiaApiKey: process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY || '',
  nvidiaBaseUrl: process.env.NVIDIA_NIM_BASE_URL || process.env.NVIDIA_NIM_URL || 'https://integrate.api.nvidia.com/v1',
  nvidiaModel: process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.3-70b-instruct',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@luminary.blog',
};

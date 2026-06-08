// ============================================
// ⚙️ إعدادات التطبيق
// ============================================
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  port: parseInt(process.env.PORT || '3001', 10),

  // إعدادات APIs الخارجية
  okx: {
    baseUrl: 'https://www.okx.com',
    timeout: 10000, // 10 ثوانٍ
  },
  bybit: {
    baseUrl: 'https://api.bybit.com',
    timeout: 10000,
  },

  // إعدادات الأمان
  safety: {
    maxRequestsPerMinute: 20,
    maxToolCallsPerRequest: 5,
    allowedSymbols: [
      'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA',
      'DOGE', 'TRX', 'DOT', 'MATIC', 'LINK', 'AVAX', 'SHIB',
      'LTC', 'UNI', 'ATOM', 'XLM', 'NEAR', 'APT', 'ARB', 'OP',
      'FIL', 'TON', 'PEPE', 'SUI', 'SEI', 'TIA',
    ],
  },
};

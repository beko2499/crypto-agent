// ============================================
// 🚀 نقطة الدخول — Express Server
// ============================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import chatRoutes from './routes/chat.routes.js';
import { apiRateLimiter, errorHandler } from './middleware/safety.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Middleware ───
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Rate Limiting ───
app.use('/api', apiRateLimiter);

// ─── Routes ───
app.use('/api', chatRoutes);

// ─── Error Handler ───
app.use(errorHandler);

// ─── تشغيل السيرفر ───
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🤖 وكيل الأسواق المالية — Crypto Agent             ║
║                                                      ║
║   🌐 الواجهة:  http://localhost:${config.port}              ║
║   📡 API:      http://localhost:${config.port}/api           ║
║   💚 الحالة:   http://localhost:${config.port}/api/health    ║
║                                                      ║
║   🔧 الأدوات المتاحة:                                ║
║   • get_crypto_price    — سعر عملة                   ║
║   • compare_exchanges   — مقارنة منصات              ║
║   • get_top_cryptos     — أعلى العملات              ║
║   • get_price_change    — نسبة التغيير              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
});

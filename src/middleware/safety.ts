// ============================================
// 🛡️ ضوابط الأمان — Safety Controls
// ============================================
// هذا الملف يضمن أن الوكيل الذكي لا يقوم بأي عمليات غير مصرح بها.

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

// ─── 1. تحديد معدل الطلبات (Rate Limiting) ───

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // نافذة زمنية: دقيقة واحدة
  max: config.safety.maxRequestsPerMinute,
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار دقيقة.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── 2. التحقق من صحة المدخلات ───

export function validateChatInput(req: Request, res: Response, next: NextFunction): void {
  const { question } = req.body;

  // التحقق من وجود السؤال
  if (!question || typeof question !== 'string') {
    res.status(400).json({
      success: false,
      error: 'يرجى إرسال سؤال صالح في حقل "question".',
    });
    return;
  }

  // التحقق من طول السؤال
  if (question.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'السؤال لا يمكن أن يكون فارغاً.',
    });
    return;
  }

  if (question.length > 500) {
    res.status(400).json({
      success: false,
      error: 'السؤال طويل جداً. الحد الأقصى 500 حرف.',
    });
    return;
  }

  next();
}

// ─── 3. تسجيل الأحداث (Logging Middleware) ───

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  console.log(`\n📝 [${timestamp}] ${req.method} ${req.path}`);
  if (req.body?.question) {
    console.log(`   💬 السؤال: "${req.body.question.substring(0, 100)}${req.body.question.length > 100 ? '...' : ''}"`);
  }
  next();
}

// ─── 4. معالجة الأخطاء العامة ───

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`\n🚨 خطأ غير متوقع: ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: 'حدث خطأ داخلي في السيرفر. يرجى المحاولة لاحقاً.',
  });
}

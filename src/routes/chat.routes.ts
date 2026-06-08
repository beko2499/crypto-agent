// ============================================
// 🌐 نقاط نهاية API — Routes
// ============================================

import { Router, Request, Response } from 'express';
import { CryptoAgent } from '../agent/agent.js';
import { validateChatInput, requestLogger } from '../middleware/safety.js';

const router = Router();
const agent = new CryptoAgent();

// ─── GET /api/health — فحص حالة النظام ───

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agent: true,
    tools: ['get_crypto_price', 'compare_exchanges', 'get_top_cryptos', 'get_price_change'],
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/chat — إرسال سؤال للوكيل ───

router.post('/chat', requestLogger, validateChatInput, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    const result = await agent.processQuestion(question);

    res.json({
      success: true,
      answer: result.answer,
      toolCalls: result.toolCalls,
      processingTimeMs: result.totalDurationMs,
    });
  } catch (error: any) {
    console.error('❌ خطأ في /api/chat:', error.message);
    res.status(500).json({
      success: false,
      error: `حدث خطأ أثناء معالجة سؤالك: ${error.message}`,
    });
  }
});

export default router;

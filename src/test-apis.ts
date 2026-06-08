// ============================================
// 🧪 اختبار APIs الخارجية + الوكيل
// ============================================

import { OkxService } from './services/okx.service.js';
import { BybitService } from './services/bybit.service.js';
import { CryptoAgent } from './agent/agent.js';

async function main() {
  console.log('═══ اختبار APIs الخارجية ═══\n');

  // اختبار OKX
  console.log('1️⃣ اختبار OKX API:');
  const okx = new OkxService();
  const btcOkx = await okx.getTicker('BTC');
  if (btcOkx) {
    console.log(`   ✅ BTC-USDT = $${btcOkx.last}\n`);
  } else {
    console.log('   ❌ فشل\n');
  }

  // اختبار Bybit
  console.log('2️⃣ اختبار Bybit API:');
  const bybit = new BybitService();
  const btcBybit = await bybit.getTicker('BTC');
  if (btcBybit) {
    console.log(`   ✅ BTCUSDT = $${btcBybit.lastPrice}\n`);
  } else {
    console.log('   ❌ فشل\n');
  }

  // اختبار الوكيل
  console.log('\n═══ اختبار الوكيل الذكي ═══\n');
  const agent = new CryptoAgent();

  const result = await agent.processQuestion('كم سعر البيتكوين الآن؟');
  console.log('\n📝 الإجابة:', result.answer.substring(0, 200), '...');
  console.log(`📊 عدد الأدوات المستدعاة: ${result.toolCalls.length}`);
  for (const tc of result.toolCalls) {
    console.log(`   🔧 ${tc.toolName}(${JSON.stringify(tc.args)}) — ${tc.durationMs}ms`);
  }
}

main().catch(console.error);

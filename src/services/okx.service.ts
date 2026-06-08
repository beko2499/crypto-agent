// ============================================
// 🔗 خدمة OKX API — جلب بيانات السوق
// ============================================
// OKX Public API v5 — لا تحتاج مفتاح API
// التوثيق: https://www.okx.com/docs-v5/en/

import { config } from '../config.js';

// ─── أنواع البيانات ───

export interface OkxTicker {
  instId: string;     // مثال: "BTC-USDT"
  last: string;       // آخر سعر
  open24h: string;    // سعر الافتتاح (24 ساعة)
  high24h: string;    // أعلى سعر (24 ساعة)
  low24h: string;     // أدنى سعر (24 ساعة)
  vol24h: string;     // حجم التداول (24 ساعة) بالعملة الأساسية
  volCcy24h: string;  // حجم التداول (24 ساعة) بالعملة المقابلة
  ts: string;         // الطابع الزمني
  bidPx: string;      // أفضل سعر شراء
  askPx: string;      // أفضل سعر بيع
}

interface OkxResponse {
  code: string;
  msg: string;
  data: OkxTicker[];
}

// ─── الخدمة ───

export class OkxService {
  private baseUrl = config.okx.baseUrl;
  private timeout = config.okx.timeout;

  /**
   * جلب سعر عملة واحدة
   * @param symbol رمز العملة مثل "BTC"
   * @param quote العملة المقابلة، الافتراضي "USDT"
   */
  async getTicker(symbol: string, quote: string = 'USDT'): Promise<OkxTicker | null> {
    const instId = `${symbol.toUpperCase()}-${quote.toUpperCase()}`;
    const url = `${this.baseUrl}/api/v5/market/ticker?instId=${instId}`;

    console.log(`   📡 OKX: جلب سعر ${instId}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`   ❌ OKX API خطأ: ${res.status} ${res.statusText}`);
        return null;
      }

      const data: OkxResponse = await res.json();

      if (data.code !== '0' || !data.data || data.data.length === 0) {
        console.error(`   ❌ OKX: لم يتم العثور على ${instId}`);
        return null;
      }

      console.log(`   ✅ OKX: ${instId} = $${data.data[0].last}`);
      return data.data[0];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`   ⏱️ OKX: انتهت مهلة الطلب`);
      } else {
        console.error(`   ❌ OKX خطأ: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * جلب أسعار أهم العملات الرقمية
   * @param limit عدد العملات المطلوبة
   */
  async getTopTickers(limit: number = 10): Promise<OkxTicker[]> {
    const url = `${this.baseUrl}/api/v5/market/tickers?instType=SPOT`;

    console.log(`   📡 OKX: جلب أعلى ${limit} عملة...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const data: OkxResponse = await res.json();

      if (data.code !== '0' || !data.data) return [];

      // فلترة فقط أزواج USDT وترتيبها حسب حجم التداول
      const usdtPairs = data.data
        .filter(t => t.instId.endsWith('-USDT'))
        .sort((a, b) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
        .slice(0, limit);

      console.log(`   ✅ OKX: تم جلب ${usdtPairs.length} عملة`);
      return usdtPairs;
    } catch (error: any) {
      console.error(`   ❌ OKX خطأ: ${error.message}`);
      return [];
    }
  }
}

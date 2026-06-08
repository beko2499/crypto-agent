// ============================================
// 🔗 خدمة Bybit API — جلب بيانات السوق
// ============================================
// Bybit Public API v5 — لا تحتاج مفتاح API
// التوثيق: https://bybit-exchange.github.io/docs/v5/market/tickers

import { config } from '../config.js';

// ─── أنواع البيانات ───

export interface BybitTicker {
  symbol: string;        // مثال: "BTCUSDT"
  lastPrice: string;     // آخر سعر
  prevPrice24h: string;  // سعر قبل 24 ساعة
  price24hPcnt: string;  // نسبة التغيير (24 ساعة)
  highPrice24h: string;  // أعلى سعر (24 ساعة)
  lowPrice24h: string;   // أدنى سعر (24 ساعة)
  volume24h: string;     // حجم التداول (24 ساعة)
  turnover24h: string;   // قيمة التداول (24 ساعة)
  bid1Price: string;     // أفضل سعر شراء
  ask1Price: string;     // أفضل سعر بيع
}

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTicker[];
  };
}

// ─── الخدمة ───

export class BybitService {
  private baseUrl = config.bybit.baseUrl;
  private timeout = config.bybit.timeout;

  /**
   * جلب سعر عملة واحدة
   * @param symbol رمز العملة مثل "BTC"
   * @param quote العملة المقابلة، الافتراضي "USDT"
   */
  async getTicker(symbol: string, quote: string = 'USDT'): Promise<BybitTicker | null> {
    const pair = `${symbol.toUpperCase()}${quote.toUpperCase()}`;
    const url = `${this.baseUrl}/v5/market/tickers?category=spot&symbol=${pair}`;

    console.log(`   📡 Bybit: جلب سعر ${pair}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`   ❌ Bybit API خطأ: ${res.status} ${res.statusText}`);
        return null;
      }

      const data: BybitResponse = await res.json();

      if (data.retCode !== 0 || !data.result?.list || data.result.list.length === 0) {
        console.error(`   ❌ Bybit: لم يتم العثور على ${pair}`);
        return null;
      }

      console.log(`   ✅ Bybit: ${pair} = $${data.result.list[0].lastPrice}`);
      return data.result.list[0];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`   ⏱️ Bybit: انتهت مهلة الطلب`);
      } else {
        console.error(`   ❌ Bybit خطأ: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * جلب أسعار أهم العملات الرقمية
   * @param limit عدد العملات المطلوبة
   */
  async getTopTickers(limit: number = 10): Promise<BybitTicker[]> {
    const url = `${this.baseUrl}/v5/market/tickers?category=spot`;

    console.log(`   📡 Bybit: جلب أعلى ${limit} عملة...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const data: BybitResponse = await res.json();

      if (data.retCode !== 0 || !data.result?.list) return [];

      // فلترة أزواج USDT وترتيبها حسب قيمة التداول
      const usdtPairs = data.result.list
        .filter(t => t.symbol.endsWith('USDT'))
        .sort((a, b) => parseFloat(b.turnover24h) - parseFloat(a.turnover24h))
        .slice(0, limit);

      console.log(`   ✅ Bybit: تم جلب ${usdtPairs.length} عملة`);
      return usdtPairs;
    } catch (error: any) {
      console.error(`   ❌ Bybit خطأ: ${error.message}`);
      return [];
    }
  }
}

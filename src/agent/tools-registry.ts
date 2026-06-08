// ============================================
// 🛠️ سجل الأدوات — Tools Registry
// ============================================
// هنا نربط كل اسم أداة بالدالة التي تنفذها فعلياً.
// عندما يطلب Gemini استدعاء أداة، نبحث عنها هنا وننفذها.

import { OkxService } from '../services/okx.service.js';
import { BybitService } from '../services/bybit.service.js';
import { config } from '../config.js';

// ─── أنواع البيانات ───

export interface ToolResult {
  success: boolean;
  data: any;
  error?: string;
}

export type ToolFunction = (args: Record<string, any>) => Promise<ToolResult>;

// ─── سجل الأدوات ───

export class ToolsRegistry {
  private tools: Map<string, ToolFunction> = new Map();
  private okxService: OkxService;
  private bybitService: BybitService;

  constructor() {
    this.okxService = new OkxService();
    this.bybitService = new BybitService();
    this.registerAllTools();
  }

  private registerAllTools() {
    // ─── أداة 1: جلب سعر عملة ───
    this.tools.set('get_crypto_price', async (args) => {
      const symbol = args.symbol?.toUpperCase();
      const quote = args.quote_currency?.toUpperCase() || 'USDT';

      // التحقق من صحة الرمز
      if (!symbol) {
        return { success: false, data: null, error: 'لم يتم تحديد رمز العملة' };
      }

      console.log(`\n🔧 تنفيذ أداة: get_crypto_price(${symbol}, ${quote})`);

      const ticker = await this.okxService.getTicker(symbol, quote);
      if (!ticker) {
        return {
          success: false,
          data: null,
          error: `لم يتم العثور على سعر ${symbol}-${quote}. تأكد من صحة رمز العملة.`,
        };
      }

      return {
        success: true,
        data: {
          symbol: symbol,
          pair: ticker.instId,
          price: parseFloat(ticker.last),
          bid: parseFloat(ticker.bidPx),
          ask: parseFloat(ticker.askPx),
          high24h: parseFloat(ticker.high24h),
          low24h: parseFloat(ticker.low24h),
          volume24h: parseFloat(ticker.vol24h),
          exchange: 'OKX',
          timestamp: new Date(parseInt(ticker.ts)).toISOString(),
        },
      };
    });

    // ─── أداة 2: مقارنة المنصات ───
    this.tools.set('compare_exchanges', async (args) => {
      const symbol = args.symbol?.toUpperCase();

      if (!symbol) {
        return { success: false, data: null, error: 'لم يتم تحديد رمز العملة' };
      }

      console.log(`\n🔧 تنفيذ أداة: compare_exchanges(${symbol})`);

      // جلب من المنصتين بالتوازي
      const [okxTicker, bybitTicker] = await Promise.all([
        this.okxService.getTicker(symbol),
        this.bybitService.getTicker(symbol),
      ]);

      const results: any = { symbol, exchanges: [] };

      if (okxTicker) {
        results.exchanges.push({
          exchange: 'OKX',
          price: parseFloat(okxTicker.last),
          bid: parseFloat(okxTicker.bidPx),
          ask: parseFloat(okxTicker.askPx),
          volume24h: parseFloat(okxTicker.vol24h),
        });
      }

      if (bybitTicker) {
        results.exchanges.push({
          exchange: 'Bybit',
          price: parseFloat(bybitTicker.lastPrice),
          bid: parseFloat(bybitTicker.bid1Price),
          ask: parseFloat(bybitTicker.ask1Price),
          volume24h: parseFloat(bybitTicker.volume24h),
        });
      }

      if (results.exchanges.length === 0) {
        return {
          success: false,
          data: null,
          error: `لم يتم العثور على ${symbol} في أي من المنصتين`,
        };
      }

      // حساب الفرق إذا توفرت بيانات المنصتين
      if (results.exchanges.length === 2) {
        const okxPrice = results.exchanges[0].price;
        const bybitPrice = results.exchanges[1].price;
        const diff = Math.abs(okxPrice - bybitPrice);
        const diffPercent = (diff / Math.min(okxPrice, bybitPrice)) * 100;

        results.priceDifference = {
          absolute: diff,
          percentage: diffPercent,
          cheaperExchange: okxPrice < bybitPrice ? 'OKX' : 'Bybit',
          cheaperPrice: Math.min(okxPrice, bybitPrice),
        };
      }

      return { success: true, data: results };
    });

    // ─── أداة 3: أعلى العملات ───
    this.tools.set('get_top_cryptos', async (args) => {
      const limit = Math.min(args.limit || 10, 20);

      console.log(`\n🔧 تنفيذ أداة: get_top_cryptos(${limit})`);

      const tickers = await this.okxService.getTopTickers(limit);

      if (tickers.length === 0) {
        return { success: false, data: null, error: 'فشل في جلب بيانات السوق' };
      }

      const cryptos = tickers.map((t, i) => {
        const changePercent =
          ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100;

        return {
          rank: i + 1,
          symbol: t.instId.replace('-USDT', ''),
          pair: t.instId,
          price: parseFloat(t.last),
          change24h: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          high24h: parseFloat(t.high24h),
          low24h: parseFloat(t.low24h),
          volume24h_usdt: parseFloat(t.volCcy24h),
        };
      });

      return {
        success: true,
        data: {
          count: cryptos.length,
          source: 'OKX',
          cryptos,
        },
      };
    });

    // ─── أداة 4: نسبة التغيير ───
    this.tools.set('get_price_change', async (args) => {
      const symbol = args.symbol?.toUpperCase();

      if (!symbol) {
        return { success: false, data: null, error: 'لم يتم تحديد رمز العملة' };
      }

      console.log(`\n🔧 تنفيذ أداة: get_price_change(${symbol})`);

      const ticker = await this.okxService.getTicker(symbol);
      if (!ticker) {
        return {
          success: false,
          data: null,
          error: `لم يتم العثور على بيانات ${symbol}`,
        };
      }

      const currentPrice = parseFloat(ticker.last);
      const openPrice = parseFloat(ticker.open24h);
      const changeAmount = currentPrice - openPrice;
      const changePercent = (changeAmount / openPrice) * 100;

      return {
        success: true,
        data: {
          symbol,
          currentPrice,
          openPrice24h: openPrice,
          changeAmount: changeAmount,
          changePercent: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
          direction: changePercent >= 0 ? 'ارتفاع 📈' : 'انخفاض 📉',
          high24h: parseFloat(ticker.high24h),
          low24h: parseFloat(ticker.low24h),
          range24h: parseFloat(ticker.high24h) - parseFloat(ticker.low24h),
        },
      };
    });
  }

  /**
   * تنفيذ أداة بالاسم
   */
  async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        data: null,
        error: `أداة غير معروفة: ${name}. الأدوات المتاحة: ${[...this.tools.keys()].join(', ')}`,
      };
    }
    return tool(args);
  }

  /**
   * التحقق من وجود أداة
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * قائمة الأدوات المسجلة
   */
  getToolNames(): string[] {
    return [...this.tools.keys()];
  }
}

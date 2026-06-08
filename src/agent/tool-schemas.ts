// ============================================
// 📋 تعريفات الأدوات — JSON Schemas
// ============================================
// هذه هي الطريقة التي نخبر بها Gemini عن الأدوات المتاحة.
// كل أداة لها: اسم، وصف، ومعاملات (parameters).
// Gemini يقرأ هذه التعريفات ويقرر متى وكيف يستدعيها.

import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

// ─── أداة 1: جلب سعر عملة رقمية ───

export const getCryptoPriceTool: FunctionDeclaration = {
  name: 'get_crypto_price',
  description: 'جلب السعر الحالي لعملة رقمية محددة من منصة OKX. استخدم هذه الأداة عندما يسأل المستخدم عن سعر عملة رقمية معينة مثل Bitcoin أو Ethereum أو USDT.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      symbol: {
        type: SchemaType.STRING,
        description: 'رمز العملة الرقمية بأحرف إنجليزية كبيرة. أمثلة: BTC, ETH, USDT, SOL, XRP, DOGE',
      },
      quote_currency: {
        type: SchemaType.STRING,
        description: 'العملة المقابلة للتسعير. الافتراضي USDT. أمثلة: USDT, USD',
      },
    },
    required: ['symbol'],
  },
};

// ─── أداة 2: مقارنة الأسعار بين المنصات ───

export const compareExchangesTool: FunctionDeclaration = {
  name: 'compare_exchanges',
  description: 'مقارنة سعر عملة رقمية بين منصتي OKX و Bybit لإيجاد أفضل سعر. استخدم هذه الأداة عندما يسأل المستخدم عن أفضل مكان لشراء أو بيع عملة، أو يريد مقارنة الأسعار بين المنصات.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      symbol: {
        type: SchemaType.STRING,
        description: 'رمز العملة الرقمية. أمثلة: BTC, ETH, USDT',
      },
    },
    required: ['symbol'],
  },
};

// ─── أداة 3: جلب أعلى العملات ───

export const getTopCryptosTool: FunctionDeclaration = {
  name: 'get_top_cryptos',
  description: 'جلب قائمة بأعلى العملات الرقمية من حيث حجم التداول مع أسعارها الحالية. استخدم هذه الأداة عندما يسأل المستخدم عن أفضل العملات أو أكثرها تداولاً أو يريد نظرة عامة على السوق.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      limit: {
        type: SchemaType.NUMBER,
        description: 'عدد العملات المطلوب عرضها. الافتراضي 10، الحد الأقصى 20.',
      },
    },
  },
};

// ─── أداة 4: جلب نسبة التغيير ───

export const getPriceChangeTool: FunctionDeclaration = {
  name: 'get_price_change',
  description: 'جلب نسبة تغيير سعر عملة رقمية خلال 24 ساعة مع أعلى وأدنى سعر. استخدم هذه الأداة عندما يسأل المستخدم عن أداء عملة أو هل ارتفعت أو انخفضت.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      symbol: {
        type: SchemaType.STRING,
        description: 'رمز العملة الرقمية. أمثلة: BTC, ETH, SOL',
      },
    },
    required: ['symbol'],
  },
};

// ─── تصدير جميع الأدوات ───

export const allToolDeclarations: FunctionDeclaration[] = [
  getCryptoPriceTool,
  compareExchangesTool,
  getTopCryptosTool,
  getPriceChangeTool,
];

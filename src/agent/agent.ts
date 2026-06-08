// ============================================
// 🤖 الوكيل الذكي — Agent Loop
// ============================================
// هذا هو قلب النظام. الوكيل يعمل كالتالي:
//
// 1. يستقبل سؤال المستخدم
// 2. يرسله إلى Gemini مع تعريف الأدوات المتاحة
// 3. إذا طلب Gemini استدعاء أداة:
//    أ. ينفذ الأداة ويجمع النتيجة
//    ب. يرسل النتيجة مرة أخرى إلى Gemini
//    ج. يكرر العملية حتى يحصل على إجابة نصية نهائية
// 4. يعيد الإجابة النهائية للمستخدم
//
// هذه هي "حلقة الوكيل" (Agent Loop) — الفكرة الأساسية في Agentic AI.

import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  Part,
  FunctionCall,
  FunctionResponsePart,
} from '@google/generative-ai';
import { config } from '../config.js';
import { allToolDeclarations } from './tool-schemas.js';
import { ToolsRegistry } from './tools-registry.js';

// ─── أنواع البيانات ───

export interface ToolCallLog {
  toolName: string;
  args: Record<string, any>;
  result: any;
  durationMs: number;
}

export interface AgentResponse {
  answer: string;
  toolCalls: ToolCallLog[];
  totalDurationMs: number;
}

// ─── الوكيل ───

export class CryptoAgent {
  private model: GenerativeModel;
  private toolsRegistry: ToolsRegistry;

  constructor() {
    const genAI = new GoogleGenerativeAI(config.googleApiKey);

    // تهيئة النموذج مع الأدوات
    this.model = genAI.getGenerativeModel({
      model: config.geminiModel,
      // 🔧 هنا نمرر تعريفات الأدوات لـ Gemini
      tools: [{
        functionDeclarations: allToolDeclarations,
      }],
      // تعليمات النظام: شخصية الوكيل
      systemInstruction: `أنت وكيل ذكي متخصص في الأسواق المالية والعملات الرقمية.

قواعدك:
1. أجب دائماً باللغة العربية.
2. عندما يسألك المستخدم عن سعر عملة أو بيانات سوق، استخدم الأدوات المتاحة لك لجلب البيانات الحية — لا تخمن الأسعار أبداً.
3. عند عرض الأسعار، نسّقها بشكل واضح مع تحديد المصدر (OKX أو Bybit).
4. إذا سُئلت عن أفضل مكان للشراء، استخدم أداة مقارنة المنصات.
5. قدم نصائح عامة مفيدة لكن وضّح دائماً أنها ليست نصائح استثمارية.
6. إذا لم تجد عملة أو حدث خطأ، أخبر المستخدم بلطف واقترح بدائل.
7. نسّق الأرقام الكبيرة بفواصل (مثل: 104,521.50$).
8. أنت لا تستطيع تنفيذ عمليات شراء أو بيع — فقط عرض بيانات السوق.`,
    });

    this.toolsRegistry = new ToolsRegistry();

    console.log(`🤖 تم تهيئة الوكيل الذكي — النموذج: ${config.geminiModel}`);
    console.log(`🔧 الأدوات المتاحة: ${this.toolsRegistry.getToolNames().join(', ')}`);
  }

  /**
   * معالجة سؤال المستخدم — حلقة الوكيل الرئيسية
   */
  async processQuestion(question: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const toolCallLogs: ToolCallLog[] = [];

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`❓ السؤال: "${question}"`);
    console.log(`${'═'.repeat(50)}`);

    try {
      // ─── الخطوة 1: إرسال السؤال إلى Gemini ───
      const chat = this.model.startChat();
      let response = await chat.sendMessage(question);
      let result = response.response;

      // ─── حلقة الوكيل: تنفيذ الأدوات حتى نحصل على إجابة نصية ───
      let iterations = 0;
      const maxIterations = config.safety.maxToolCallsPerRequest;

      while (iterations < maxIterations) {
        // التحقق من وجود استدعاءات أدوات
        const functionCalls = result.functionCalls();
        if (!functionCalls || functionCalls.length === 0) {
          // لا يوجد استدعاء أداة → Gemini أعاد إجابة نصية نهائية
          break;
        }

        console.log(`\n🔄 الدورة ${iterations + 1}: Gemini طلب ${functionCalls.length} أداة(أدوات)`);

        // ─── تنفيذ كل أداة ───
        const functionResponses: FunctionResponsePart[] = [];

        for (const call of functionCalls) {
          console.log(`   📞 استدعاء: ${call.name}(${JSON.stringify(call.args)})`);

          const toolStart = Date.now();

          // التحقق من وجود الأداة في السجل (أمان)
          if (!this.toolsRegistry.hasTool(call.name)) {
            console.log(`   🚫 أداة غير مسجلة: ${call.name}`);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { error: `أداة غير مسموح بها: ${call.name}` },
              },
            });
            continue;
          }

          // تنفيذ الأداة
          const toolResult = await this.toolsRegistry.executeTool(call.name, call.args || {});
          const toolDuration = Date.now() - toolStart;

          // تسجيل استدعاء الأداة
          toolCallLogs.push({
            toolName: call.name,
            args: call.args || {},
            result: toolResult.success ? toolResult.data : toolResult.error,
            durationMs: toolDuration,
          });

          console.log(`   ${toolResult.success ? '✅' : '❌'} النتيجة في ${toolDuration}ms`);

          // إعداد الرد لإرساله مرة أخرى إلى Gemini
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult.success
                ? { result: toolResult.data }
                : { error: toolResult.error },
            },
          });
        }

        // ─── إرسال نتائج الأدوات مرة أخرى إلى Gemini ───
        response = await chat.sendMessage(functionResponses);
        result = response.response;
        iterations++;
      }

      // ─── استخراج الإجابة النهائية ───
      const answer = result.text() || 'عذراً، لم أتمكن من صياغة إجابة.';
      const totalDuration = Date.now() - startTime;

      console.log(`\n✅ تمت الإجابة في ${totalDuration}ms (${toolCallLogs.length} أداة مُستدعاة)`);

      return {
        answer,
        toolCalls: toolCallLogs,
        totalDurationMs: totalDuration,
      };

    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error(`\n❌ خطأ في الوكيل: ${error.message}`);

      return {
        answer: `عذراً، حدث خطأ أثناء معالجة سؤالك: ${error.message}`,
        toolCalls: toolCallLogs,
        totalDurationMs: totalDuration,
      };
    }
  }
}

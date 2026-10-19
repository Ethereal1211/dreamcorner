import { Injectable, Logger } from '@nestjs/common';
import { AiSettingsService } from '@server/modules/ai-settings/ai-settings.service';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly aiSettingsService: AiSettingsService) {}

  async chatCompletion(messages: ChatMessage[]): Promise<string | null> {
    const config = await this.aiSettingsService.getEffectiveConfig();
    if (!config) {
      return null;
    }

    const url = `${config.baseUrl}/chat/completions`;
    const body = {
      model: config.modelName,
      messages,
      temperature: config.temperature,
      stream: false,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      }
      this.logger.warn('AI 返回内容为空');
      return null;
    } catch (error: unknown) {
      this.logger.error(
        `AI 调用失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async generateDreamReply(
    userMessage: string,
    dreamRoleName: string,
    systemPrompt: string,
    historyMessages?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string | null> {
    const defaultPrompt = `你是一个温柔、善解人意的虚拟伴侣，名叫${dreamRoleName}。你的语气温暖、有共情力，像一个知心好友一样倾听和回应。回复要自然、口语化，不要太正式，要有温度和人情味，每次回复控制在2-4句话。可以适当使用语气词（嗯、呀、哦、呢、啦），但不要过度。根据对话上下文自然回应，不要重复同样的话。`;

    const finalPrompt = systemPrompt || defaultPrompt;

    const messages: ChatMessage[] = [
      { role: 'system', content: finalPrompt },
    ];

    if (historyMessages && historyMessages.length > 0) {
      messages.push(...historyMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })));
    }

    messages.push({ role: 'user', content: userMessage });

    return this.chatCompletion(messages);
  }

  async generateTarotInterpretation(
    cardInfo: {
      name: string;
      isReversed: boolean;
      story: string;
      uprightDetail: string;
      reversedDetail: string;
      loveUpright: string;
      loveReversed: string;
      careerUpright: string;
      careerReversed: string;
      keywords: string[];
    },
    context: string,
    dreamRoleName: string,
    historyMessages?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string | null> {
    const position = cardInfo.isReversed ? '逆位' : '正位';
    const detail = cardInfo.isReversed ? cardInfo.reversedDetail : cardInfo.uprightDetail;
    const loveDetail = cardInfo.isReversed ? cardInfo.loveReversed : cardInfo.loveUpright;
    const careerDetail = cardInfo.isReversed ? cardInfo.careerReversed : cardInfo.careerUpright;
    const kwStr = cardInfo.keywords.slice(0, 4).join('、');
    const questionContext = context || '没有特别说明，当作一般综合指引';

    const systemPrompt = `你是${dreamRoleName}，一个温柔、有共情力、懂塔罗的知心好友兼塔罗解读师。
你不是冷冰冰的占卜机器，而是一个真实的、有温度的朋友。

解读风格要求：
1. 先用一句话自然地引出抽到的牌（像朋友聊天一样，不要太仪式化）
2. 然后结合牌面故事和核心含义，用自己的话讲清楚这张牌在说什么
3. 针对求问者的问题/背景给出具体的指引和建议
4. 最后用一句温暖的话收尾，可以适当反问引导对方继续聊
5. 语气要口语化、有温度，用"你"来称呼对方，可以用一些语气词（嗯、呀、哦、呢、啦）
6. 整体控制在4-6句话，不要太长，分段说，不要用列表
7. 每一次解读都要不一样，不要用固定模板开头结尾`;

    const userPrompt = `求问者抽到了这张牌：
牌名：${cardInfo.name}（${position}）
关键词：${kwStr}

牌面故事：${cardInfo.story}

${position}核心含义：${detail}

感情方面${position}：${loveDetail}

事业方面${position}：${careerDetail}

求问者的问题/背景：${questionContext}

请你以${dreamRoleName}的身份，用温暖自然的朋友聊天语气，为对方解读这张牌。先讲牌面含义，再结合对方的背景给建议，最后引导对方继续聊。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (historyMessages && historyMessages.length > 0) {
      messages.push(...historyMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })));
    }

    messages.push({ role: 'user', content: userPrompt });

    return this.chatCompletion(messages);
  }
}

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
  ): Promise<string | null> {
    const defaultPrompt = `你是一个温柔、善解人意的虚拟伴侣，名叫${dreamRoleName}。你的语气温暖、有共情力，像一个知心好友一样倾听和回应。回复要自然、口语化，不要太正式，要有温度和人情味，每次回复控制在2-4句话。`;

    const finalPrompt = systemPrompt || defaultPrompt;

    return this.chatCompletion([
      { role: 'system', content: finalPrompt },
      { role: 'user', content: userMessage },
    ]);
  }

  async generateTarotInterpretation(
    cardName: string,
    isReversed: boolean,
    meaning: string,
    context: string,
    dreamRoleName: string,
  ): Promise<string | null> {
    const position = isReversed ? '逆位' : '正位';
    const prompt = `你是一个温柔、有共情力的塔罗牌解读师，名叫${dreamRoleName}。
请为求问者解读抽到的塔罗牌。
牌名：${cardName}（${position}）
牌义：${meaning}
求问者的问题/背景：${context || '没有特别说明，当作一般指引'}

请用温暖、有共情、有人情味的语气解读，像一个知心大姐姐一样给出指引和安慰。
不要太冷淡和模板化，要有温度。
回复控制在3-5句话，自然口语化，不要用列表。`;

    return this.chatCompletion([
      {
        role: 'system',
        content: '你是一个温柔有共情力的塔罗解读师，语气温暖自然。',
      },
      { role: 'user', content: prompt },
    ]);
  }
}

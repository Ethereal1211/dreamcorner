import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq } from 'drizzle-orm';
import { dreamChatMessages, tarotDraws, userSettings, aiSettings as aiSettingsTable } from '@server/database/schema';
import { TAROT_CARDS, getCardByName, getFallbackTarotReply, DREAM_RESPONSES } from '@server/common/tarot-cards';
import { AiService } from '@server/common/ai.service';
import type { ChatMessage, ListResponse, TarotChatDrawResult } from '@shared/api.interface';

@Injectable()
export class DreamChatService {
  private readonly logger = new Logger(DreamChatService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
  ) {}

  async getMessages(page: number, pageSize: number): Promise<ListResponse<ChatMessage>> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(dreamChatMessages)
        .orderBy(desc(dreamChatMessages.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(dreamChatMessages),
    ]);

    const items: ChatMessage[] = rows.map((row) => ({
      id: row.id,
      role: row.role as 'user' | 'dream',
      content: row.content,
      tarotDrawId: row.tarotDrawId ?? null,
      messageType: row.messageType,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async sendMessage(
    content: string,
    messageType = 'text',
  ): Promise<{ userMessage: ChatMessage; dreamMessage: ChatMessage } | TarotChatDrawResult> {
    const trimmed = content.trim();

    if (/抽牌|抽一张|占卜|塔罗|帮我抽/.test(trimmed)) {
      let context = 'general';
      if (/感情|爱情|恋爱|喜欢/.test(trimmed)) context = 'love';
      else if (/工作|事业|职业|学业/.test(trimmed)) context = 'career';
      else if (/财运|钱|财富|收入/.test(trimmed)) context = 'wealth';
      else if (/今日|今天|运势|运气/.test(trimmed)) context = 'daily';
      return this.drawTarotInChat(context, trimmed);
    }

    const userInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'user',
        content,
        messageType,
      })
      .returning();

    const userRow = userInserted[0];
    const userMessage: ChatMessage = {
      id: userRow.id,
      role: 'user',
      content: userRow.content,
      tarotDrawId: userRow.tarotDrawId ?? null,
      messageType: userRow.messageType,
      createdAt: userRow.createdAt.toISOString(),
    };

    const dreamRoleInfo = await this.getDreamRoleInfo();
    const history = await this.getRecentHistory(8);
    const aiReply = await this.aiService.generateDreamReply(
      content,
      dreamRoleInfo.name,
      dreamRoleInfo.systemPrompt,
      history,
    );

    let replyContent = '';
    if (aiReply) {
      replyContent = aiReply;
    } else {
      const allResponses = [
        ...DREAM_RESPONSES.comfort,
        ...DREAM_RESPONSES.encouragement,
        ...DREAM_RESPONSES.greeting,
      ];
      replyContent = allResponses[Math.floor(Math.random() * allResponses.length)];
    }

    const dreamInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'dream',
        content: replyContent,
        messageType: 'text',
      })
      .returning();

    const dreamRow = dreamInserted[0];
    const dreamMessage: ChatMessage = {
      id: dreamRow.id,
      role: 'dream',
      content: dreamRow.content,
      tarotDrawId: dreamRow.tarotDrawId ?? null,
      messageType: dreamRow.messageType,
      createdAt: dreamRow.createdAt.toISOString(),
    };

    return { userMessage, dreamMessage };
  }

  async deleteMessage(id: string): Promise<void> {
    const deleted = await this.db
      .delete(dreamChatMessages)
      .where(eq(dreamChatMessages.id, id))
      .returning({ id: dreamChatMessages.id });
    if (deleted.length === 0) {
      throw new NotFoundException('消息不存在');
    }
  }

  async clearAll(): Promise<void> {
    await this.db.delete(dreamChatMessages);
  }

  async drawTarotInChat(context: string, userQuery?: string): Promise<TarotChatDrawResult> {
    const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
    const cardData = TAROT_CARDS[randomIndex];
    const isReversed = Math.random() < 0.5;
    const meaning = isReversed ? cardData.reversedMeaning : cardData.meaning;
    const detail = isReversed ? cardData.reversedDetail : cardData.uprightDetail;

    const dreamRoleInfo = await this.getDreamRoleInfo();
    const history = await this.getRecentHistory(6);

    const aiDreamMsg = await this.aiService.generateTarotInterpretation(
      {
        name: cardData.name,
        isReversed,
        story: cardData.story,
        uprightDetail: cardData.uprightDetail,
        reversedDetail: cardData.reversedDetail,
        loveUpright: cardData.loveUpright,
        loveReversed: cardData.loveReversed,
        careerUpright: cardData.careerUpright,
        careerReversed: cardData.careerReversed,
        keywords: cardData.keywords,
      },
      userQuery || context,
      dreamRoleInfo.name,
      history,
    );
    const finalDreamMessage = aiDreamMsg || getFallbackTarotReply(cardData.name, isReversed, context);

    const drawInserted = await this.db
      .insert(tarotDraws)
      .values({
        cardName: cardData.name,
        cardNumber: cardData.number,
        isReversed,
        position: 'single',
        message: detail,
        dreamMessage: finalDreamMessage,
        context: context || 'chat',
      })
      .returning({ id: tarotDraws.id });
    const drawId = drawInserted[0].id;

    const displayContent = userQuery && userQuery.trim() ? userQuery.trim() : (context === 'general' ? '抽一张牌看看' : `抽一张牌（${this.getContextLabel(context)}）`);

    const userInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'user',
        content: displayContent,
        messageType: 'text',
      })
      .returning();

    const tarotContent = JSON.stringify({
      cardName: cardData.name,
      cardNumber: cardData.number,
      isReversed,
      meaning,
      keywords: cardData.keywords,
      story: cardData.story,
      uprightDetail: cardData.uprightDetail,
      reversedDetail: cardData.reversedDetail,
      loveUpright: cardData.loveUpright,
      loveReversed: cardData.loveReversed,
      careerUpright: cardData.careerUpright,
      careerReversed: cardData.careerReversed,
    });

    const tarotInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'dream',
        content: tarotContent,
        messageType: 'tarot',
        tarotDrawId: drawId,
      })
      .returning();

      const dreamInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'dream',
        content: finalDreamMessage,
        messageType: 'text',
        tarotDrawId: drawId,
      })
      .returning();

    const rowToMessage = (row: typeof dreamChatMessages.$inferSelect): ChatMessage => ({
      id: row.id,
      role: row.role as 'user' | 'dream',
      content: row.content,
      tarotDrawId: row.tarotDrawId ?? null,
      messageType: row.messageType,
      createdAt: row.createdAt.toISOString(),
    });

    return {
      userMessage: rowToMessage(userInserted[0]),
      tarotMessage: rowToMessage(tarotInserted[0]),
      dreamMessage: rowToMessage(dreamInserted[0]),
      recordId: drawId,
    };
  }

  private async getDreamRoleInfo(): Promise<{ name: string; systemPrompt: string }> {
    try {
      const [settingsRow, aiRow] = await Promise.all([
        this.db.select().from(userSettings).limit(1),
        this.db
          .select({ systemPrompt: aiSettingsTable.systemPrompt })
          .from(aiSettingsTable)
          .limit(1),
      ]);
      return {
        name: settingsRow[0]?.dreamRoleName || '梦角',
        systemPrompt: aiRow[0]?.systemPrompt || '',
      };
    } catch {
      return { name: '梦角', systemPrompt: '' };
    }
  }

  private async getRecentHistory(limit: number): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      const rows = await this.db
        .select()
        .from(dreamChatMessages)
        .orderBy(desc(dreamChatMessages.createdAt))
        .limit(limit * 2)
        .where(eq(dreamChatMessages.messageType, 'text'));

      const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (const row of rows) {
        if (row.role === 'user') {
          history.unshift({ role: 'user', content: row.content });
        } else if (row.role === 'dream') {
          history.unshift({ role: 'assistant', content: row.content });
        }
        if (history.length >= limit) break;
      }
      return history;
    } catch {
      return [];
    }
  }

  private getContextLabel(context: string): string {
    const map: Record<string, string> = {
      daily: '今日运势',
      love: '感情',
      career: '事业',
      wealth: '财运',
      general: '综合',
    };
    return map[context] || context;
  }
}

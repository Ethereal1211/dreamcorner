import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq } from 'drizzle-orm';
import { dreamChatMessages, tarotDraws, userSettings, aiSettings as aiSettingsTable } from '@server/database/schema';
import { DREAM_RESPONSES, TAROT_CARDS, getDreamMessage } from '@server/common/tarot-cards';
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
  ): Promise<{ userMessage: ChatMessage; dreamMessage: ChatMessage }> {
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

    let replyContent = '';
    if (content.includes('抽牌') || content.toLowerCase().includes('tarot')) {
      replyContent =
        '想要抽牌吗？去塔罗牌页面看看吧，我会在那里为你解读哦～每一张牌都有它的故事。';
    } else {
      const dreamRoleInfo = await this.getDreamRoleInfo();
      const aiReply = await this.aiService.generateDreamReply(
        content,
        dreamRoleInfo.name,
        dreamRoleInfo.systemPrompt,
      );
      if (aiReply) {
        replyContent = aiReply;
      } else {
        const allResponses = [
          ...DREAM_RESPONSES.comfort,
          ...DREAM_RESPONSES.encouragement,
        ];
        replyContent = allResponses[Math.floor(Math.random() * allResponses.length)];
      }
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

  async drawTarotInChat(context: string): Promise<TarotChatDrawResult> {
    const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
    const cardData = TAROT_CARDS[randomIndex];
    const isReversed = Math.random() < 0.5;
    const baseDreamMessage = getDreamMessage(cardData.name, isReversed);
    const meaning = isReversed ? cardData.reversedMeaning : cardData.meaning;
    const dreamRoleInfo = await this.getDreamRoleInfo();
    const aiDreamMsg = await this.aiService.generateTarotInterpretation(
      cardData.name,
      isReversed,
      meaning,
      context,
      dreamRoleInfo.name,
    );
    const finalDreamMessage = aiDreamMsg || baseDreamMessage;

    const drawInserted = await this.db
      .insert(tarotDraws)
      .values({
        cardName: cardData.name,
        cardNumber: cardData.number,
        isReversed,
        position: 'single',
        message: meaning,
        dreamMessage: finalDreamMessage,
        context: context || 'chat',
      })
      .returning({ id: tarotDraws.id });
    const drawId = drawInserted[0].id;

    const userInserted = await this.db
      .insert(dreamChatMessages)
      .values({
        role: 'user',
        content: context ? `抽一张牌（${context}）` : '抽一张牌',
        messageType: 'text',
      })
      .returning();

    const tarotContent = JSON.stringify({
      cardName: cardData.name,
      cardNumber: cardData.number,
      isReversed,
      meaning,
      keywords: cardData.keywords,
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
}

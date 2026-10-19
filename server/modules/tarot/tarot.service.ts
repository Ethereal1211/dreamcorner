import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq } from 'drizzle-orm';
import { tarotDraws } from '@server/database/schema';
import { TAROT_CARDS, getDreamMessage } from '@server/common/tarot-cards';
import type { TarotCard, TarotDrawRecord, TarotDrawResponse } from '@shared/api.interface';

@Injectable()
export class TarotService {
  private readonly logger = new Logger(TarotService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  getAllCards(): TarotCard[] {
    return TAROT_CARDS.map((card) => ({
      id: `card-${card.number}`,
      name: card.name,
      number: card.number,
      suit: card.suit,
      meaning: card.meaning,
      reversedMeaning: card.reversedMeaning,
      keywords: card.keywords,
    }));
  }

  async getDraws(page: number, pageSize: number): Promise<{ items: TarotDrawRecord[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(tarotDraws)
        .orderBy(desc(tarotDraws.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(tarotDraws),
    ]);

    const items: TarotDrawRecord[] = rows.map((row) => ({
      id: row.id,
      cardName: row.cardName,
      cardNumber: row.cardNumber,
      isReversed: row.isReversed,
      position: row.position,
      message: row.message,
      dreamMessage: row.dreamMessage,
      context: row.context,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async getDrawById(id: string): Promise<TarotDrawRecord> {
    const rows = await this.db.select().from(tarotDraws).where(eq(tarotDraws.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('抽牌记录不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      cardName: row.cardName,
      cardNumber: row.cardNumber,
      isReversed: row.isReversed,
      position: row.position,
      message: row.message,
      dreamMessage: row.dreamMessage,
      context: row.context,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async drawCard(context: string): Promise<TarotDrawResponse> {
    const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
    const cardData = TAROT_CARDS[randomIndex];
    const isReversed = Math.random() < 0.5;
    const dreamMessage = getDreamMessage(cardData.name, isReversed);
    const meaning = isReversed ? cardData.reversedMeaning : cardData.meaning;

    const inserted = await this.db
      .insert(tarotDraws)
      .values({
        cardName: cardData.name,
        cardNumber: cardData.number,
        isReversed,
        position: 'single',
        message: meaning,
        dreamMessage,
        context: context || 'general',
      })
      .returning({ id: tarotDraws.id });

    const card: TarotCard = {
      id: `card-${cardData.number}`,
      name: cardData.name,
      number: cardData.number,
      suit: cardData.suit,
      meaning: cardData.meaning,
      reversedMeaning: cardData.reversedMeaning,
      keywords: cardData.keywords,
    };

    return {
      card,
      isReversed,
      dreamMessage,
      recordId: inserted[0].id,
    };
  }
}

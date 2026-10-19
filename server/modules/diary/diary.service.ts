import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq } from 'drizzle-orm';
import { diaryEntries } from '@server/database/schema';
import type { DiaryEntry, ListResponse } from '@shared/api.interface';

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(page: number, pageSize: number): Promise<ListResponse<DiaryEntry>> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(diaryEntries)
        .orderBy(desc(diaryEntries.entryDate))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(diaryEntries),
    ]);

    const items: DiaryEntry[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      entryDate: row.entryDate.toString(),
      isDream: row.isDream,
      dreamRoleMessage: row.dreamRoleMessage,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async getById(id: string): Promise<DiaryEntry> {
    const rows = await this.db.select().from(diaryEntries).where(eq(diaryEntries.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('日记不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      entryDate: row.entryDate.toString(),
      isDream: row.isDream,
      dreamRoleMessage: row.dreamRoleMessage,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(dto: {
    title?: string;
    content: string;
    mood?: string;
    entryDate?: string;
    isDream?: boolean;
    dreamRoleMessage?: string;
  }): Promise<DiaryEntry> {
    const inserted = await this.db
      .insert(diaryEntries)
      .values({
        title: dto.title ?? '',
        content: dto.content,
        mood: dto.mood ?? 'neutral',
        entryDate: dto.entryDate,
        isDream: dto.isDream ?? false,
        dreamRoleMessage: dto.dreamRoleMessage ?? '',
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      entryDate: row.entryDate.toString(),
      isDream: row.isDream,
      dreamRoleMessage: row.dreamRoleMessage,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async update(
    id: string,
    dto: {
      title?: string;
      content?: string;
      mood?: string;
      entryDate?: string;
      isDream?: boolean;
      dreamRoleMessage?: string;
    },
  ): Promise<DiaryEntry> {
    const patch: Partial<typeof diaryEntries.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.content !== undefined) patch.content = dto.content;
    if (dto.mood !== undefined) patch.mood = dto.mood;
    if (dto.entryDate !== undefined) patch.entryDate = dto.entryDate;
    if (dto.isDream !== undefined) patch.isDream = dto.isDream;
    if (dto.dreamRoleMessage !== undefined) patch.dreamRoleMessage = dto.dreamRoleMessage;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(diaryEntries)
      .set(patch)
      .where(eq(diaryEntries.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('日记不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      entryDate: row.entryDate.toString(),
      isDream: row.isDream,
      dreamRoleMessage: row.dreamRoleMessage,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db.delete(diaryEntries).where(eq(diaryEntries.id, id)).returning({ id: diaryEntries.id });
    if (deleted.length === 0) {
      throw new NotFoundException('日记不存在');
    }
  }
}

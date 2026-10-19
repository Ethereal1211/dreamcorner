import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq, sql } from 'drizzle-orm';
import { moments } from '@server/database/schema';
import type { Moment, ListResponse } from '@shared/api.interface';

@Injectable()
export class MomentsService {
  private readonly logger = new Logger(MomentsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(page: number, pageSize: number): Promise<ListResponse<Moment>> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(moments)
        .orderBy(desc(moments.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(moments),
    ]);

    const items: Moment[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      images: row.images ?? [],
      likes: row.likes,
      isFromDream: row.isFromDream,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async getById(id: string): Promise<Moment> {
    const rows = await this.db.select().from(moments).where(eq(moments.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('朋友圈不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      content: row.content,
      images: row.images ?? [],
      likes: row.likes,
      isFromDream: row.isFromDream,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(dto: {
    content: string;
    images?: string[];
    isFromDream?: boolean;
  }): Promise<Moment> {
    const inserted = await this.db
      .insert(moments)
      .values({
        content: dto.content,
        images: dto.images ?? [],
        isFromDream: dto.isFromDream ?? false,
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      content: row.content,
      images: row.images ?? [],
      likes: row.likes,
      isFromDream: row.isFromDream,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async like(id: string): Promise<Moment> {
    const updated = await this.db
      .update(moments)
      .set({ likes: sql<number>`${moments.likes} + 1` })
      .where(eq(moments.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('朋友圈不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      content: row.content,
      images: row.images ?? [],
      likes: row.likes,
      isFromDream: row.isFromDream,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db.delete(moments).where(eq(moments.id, id)).returning({ id: moments.id });
    if (deleted.length === 0) {
      throw new NotFoundException('朋友圈不存在');
    }
  }
}

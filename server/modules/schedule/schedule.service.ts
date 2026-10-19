import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq, gte, lte, and, asc } from 'drizzle-orm';
import { schedules } from '@server/database/schema';
import type { Schedule, ListResponse } from '@shared/api.interface';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getList(
    page: number,
    pageSize: number,
    date?: string,
  ): Promise<ListResponse<Schedule>> {
    const offset = (page - 1) * pageSize;
    const conditions = [];

    if (date) {
      conditions.push(eq(schedules.scheduleDate, date));
    }

    const baseQuery = conditions.length > 0
      ? this.db.select().from(schedules).where(and(...conditions))
      : this.db.select().from(schedules);

    const [rows, totalRows] = await Promise.all([
      baseQuery
        .orderBy(asc(schedules.scheduleDate), asc(schedules.scheduleTime))
        .limit(pageSize)
        .offset(offset),
      (conditions.length > 0
        ? this.db.select({ count: count() }).from(schedules).where(and(...conditions))
        : this.db.select({ count: count() }).from(schedules)),
    ]);

    const items: Schedule[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      scheduleDate: row.scheduleDate.toString(),
      scheduleTime: row.scheduleTime,
      isDone: row.isDone,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async getById(id: string): Promise<Schedule> {
    const rows = await this.db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('日程不存在');
    }
    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      scheduleDate: row.scheduleDate.toString(),
      scheduleTime: row.scheduleTime,
      isDone: row.isDone,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(dto: {
    title: string;
    description?: string;
    scheduleDate: string;
    scheduleTime?: string;
    category?: string;
  }): Promise<Schedule> {
    const inserted = await this.db
      .insert(schedules)
      .values({
        title: dto.title,
        description: dto.description ?? '',
        scheduleDate: dto.scheduleDate,
        scheduleTime: dto.scheduleTime ?? '',
        category: dto.category ?? 'general',
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      scheduleDate: row.scheduleDate.toString(),
      scheduleTime: row.scheduleTime,
      isDone: row.isDone,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async update(
    id: string,
    dto: {
      title?: string;
      description?: string;
      scheduleDate?: string;
      scheduleTime?: string;
      isDone?: boolean;
      category?: string;
    },
  ): Promise<Schedule> {
    const patch: Partial<typeof schedules.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.scheduleDate !== undefined) patch.scheduleDate = dto.scheduleDate;
    if (dto.scheduleTime !== undefined) patch.scheduleTime = dto.scheduleTime;
    if (dto.isDone !== undefined) patch.isDone = dto.isDone;
    if (dto.category !== undefined) patch.category = dto.category;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(schedules)
      .set(patch)
      .where(eq(schedules.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('日程不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      scheduleDate: row.scheduleDate.toString(),
      scheduleTime: row.scheduleTime,
      isDone: row.isDone,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db.delete(schedules).where(eq(schedules.id, id)).returning({ id: schedules.id });
    if (deleted.length === 0) {
      throw new NotFoundException('日程不存在');
    }
  }
}

import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count, desc, eq } from 'drizzle-orm';
import { periodRecords } from '@server/database/schema';
import type { PeriodRecord, PeriodPrediction, ListResponse } from '@shared/api.interface';

@Injectable()
export class PeriodService {
  private readonly logger = new Logger(PeriodService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getRecords(page: number, pageSize: number): Promise<ListResponse<PeriodRecord>> {
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(periodRecords)
        .orderBy(desc(periodRecords.startDate))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(periodRecords),
    ]);

    const items: PeriodRecord[] = rows.map((row) => ({
      id: row.id,
      startDate: row.startDate.toString(),
      endDate: row.endDate ? row.endDate.toString() : null,
      cycleLength: row.cycleLength,
      periodLength: row.periodLength,
      notes: row.notes,
      symptoms: row.symptoms ?? [],
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  }

  async predictNextPeriod(): Promise<PeriodPrediction> {
    const rows = await this.db
      .select()
      .from(periodRecords)
      .orderBy(desc(periodRecords.startDate))
      .limit(3);

    if (rows.length === 0) {
      throw new BadRequestException('暂无经期记录，无法预测');
    }

    const defaultCycle = 28;
    const defaultPeriod = 5;

    let avgCycle = defaultCycle;
    let avgPeriod = defaultPeriod;

    if (rows.length >= 2) {
      const cycles: number[] = [];
      for (let i = 0; i < rows.length - 1; i++) {
        const diff = Math.floor(
          (new Date(rows[i].startDate.toString()).getTime() -
            new Date(rows[i + 1].startDate.toString()).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diff > 0 && diff < 100) {
          cycles.push(diff);
        }
      }
      if (cycles.length > 0) {
        avgCycle = Math.round(cycles.reduce((sum: number, val: number) => sum + val, 0) / cycles.length);
      }
    }

    const periodLengths: number[] = rows
      .filter((r) => r.endDate)
      .map((r) => {
        const start = new Date(r.startDate.toString());
        const end = new Date(r.endDate!.toString());
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff;
      });

    if (periodLengths.length > 0) {
      avgPeriod = Math.round(
        periodLengths.reduce((sum: number, val: number) => sum + val, 0) / periodLengths.length,
      );
    }

    const lastStart = new Date(rows[0].startDate.toString());
    const nextStart = new Date(lastStart);
    nextStart.setDate(nextStart.getDate() + avgCycle);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + avgPeriod - 1);

    const ovulationDate = new Date(nextStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 4);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilNext = Math.ceil(
      (nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    const cycleDay = Math.ceil(
      (today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    let currentPhase = 'follicular';
    if (cycleDay <= avgPeriod) {
      currentPhase = 'menstruation';
    } else if (cycleDay >= avgCycle - 14 - 5 && cycleDay <= avgCycle - 14 + 4) {
      currentPhase = 'ovulation';
    } else if (cycleDay > avgCycle - 14 + 4) {
      currentPhase = 'luteal';
    }

    return {
      nextStartDate: nextStart.toISOString().split('T')[0],
      nextEndDate: nextEnd.toISOString().split('T')[0],
      ovulationDate: ovulationDate.toISOString().split('T')[0],
      fertileStart: fertileStart.toISOString().split('T')[0],
      fertileEnd: fertileEnd.toISOString().split('T')[0],
      daysUntilNext,
      currentPhase,
    };
  }

  async create(dto: {
    startDate: string;
    endDate?: string;
    cycleLength?: number;
    periodLength?: number;
    notes?: string;
    symptoms?: string[];
  }): Promise<PeriodRecord> {
    const inserted = await this.db
      .insert(periodRecords)
      .values({
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        cycleLength: dto.cycleLength ?? 28,
        periodLength: dto.periodLength ?? 5,
        notes: dto.notes ?? '',
        symptoms: dto.symptoms ?? [],
      })
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      startDate: row.startDate.toString(),
      endDate: row.endDate ? row.endDate.toString() : null,
      cycleLength: row.cycleLength,
      periodLength: row.periodLength,
      notes: row.notes,
      symptoms: row.symptoms ?? [],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async update(
    id: string,
    dto: {
      startDate?: string;
      endDate?: string;
      cycleLength?: number;
      periodLength?: number;
      notes?: string;
      symptoms?: string[];
    },
  ): Promise<PeriodRecord> {
    const patch: Partial<typeof periodRecords.$inferInsert> = {};
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate ?? null;
    if (dto.cycleLength !== undefined) patch.cycleLength = dto.cycleLength;
    if (dto.periodLength !== undefined) patch.periodLength = dto.periodLength;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.symptoms !== undefined) patch.symptoms = dto.symptoms;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(periodRecords)
      .set(patch)
      .where(eq(periodRecords.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('经期记录不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      startDate: row.startDate.toString(),
      endDate: row.endDate ? row.endDate.toString() : null,
      cycleLength: row.cycleLength,
      periodLength: row.periodLength,
      notes: row.notes,
      symptoms: row.symptoms ?? [],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.db
      .delete(periodRecords)
      .where(eq(periodRecords.id, id))
      .returning({ id: periodRecords.id });
    if (deleted.length === 0) {
      throw new NotFoundException('经期记录不存在');
    }
  }
}

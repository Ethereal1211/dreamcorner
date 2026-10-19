import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import { aiSettings } from '@server/database/schema';
import type { AiSettings } from '@shared/api.interface';

const DEFAULT_AI_SETTINGS = {
  provider: 'openai_compatible',
  apiKey: '',
  baseUrl: '',
  modelName: '',
  temperature: '0.7',
  systemPrompt: '',
  isEnabled: false,
};

@Injectable()
export class AiSettingsService {
  private readonly logger = new Logger(AiSettingsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getSettings(): Promise<AiSettings> {
    const rows = await this.db.select().from(aiSettings).limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        provider: row.provider,
        apiKey: row.apiKey,
        baseUrl: row.baseUrl,
        modelName: row.modelName,
        temperature: Number(row.temperature),
        systemPrompt: row.systemPrompt,
        isEnabled: row.isEnabled,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }

    const envApiKey = process.env.AI_API_KEY || '';
    const envBaseUrl = process.env.AI_BASE_URL || '';
    const envModel = process.env.AI_MODEL_NAME || '';
    const envTemp = process.env.AI_TEMPERATURE || '';
    const envPrompt = process.env.AI_SYSTEM_PROMPT || '';
    const envEnabled = !!(envApiKey && envBaseUrl && envModel);

    const defaults = {
      ...DEFAULT_AI_SETTINGS,
      apiKey: envApiKey,
      baseUrl: envBaseUrl,
      modelName: envModel,
      temperature: envTemp || '0.7',
      systemPrompt: envPrompt,
      isEnabled: envEnabled,
    };

    const inserted = await this.db
      .insert(aiSettings)
      .values(defaults)
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      provider: row.provider,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl,
      modelName: row.modelName,
      temperature: Number(row.temperature),
      systemPrompt: row.systemPrompt,
      isEnabled: row.isEnabled,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateSettings(
    patch: Partial<typeof DEFAULT_AI_SETTINGS>,
  ): Promise<AiSettings> {
    const existing = await this.db.select().from(aiSettings).limit(1);

    let row;
    if (existing.length > 0) {
      const updated = await this.db
        .update(aiSettings)
        .set(patch)
        .where(eq(aiSettings.id, existing[0].id))
        .returning();
      row = updated[0];
    } else {
      const inserted = await this.db
        .insert(aiSettings)
        .values({ ...DEFAULT_AI_SETTINGS, ...patch })
        .returning();
      row = inserted[0];
    }

    return {
      id: row.id,
      provider: row.provider,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl,
      modelName: row.modelName,
      temperature: Number(row.temperature),
      systemPrompt: row.systemPrompt,
      isEnabled: row.isEnabled,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getEffectiveConfig(): Promise<{
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature: number;
    systemPrompt: string;
  } | null> {
    const envApiKey = process.env.AI_API_KEY || '';
    const envBaseUrl = process.env.AI_BASE_URL || '';
    const envModel = process.env.AI_MODEL_NAME || '';
    const envTemp = process.env.AI_TEMPERATURE || '';
    const envPrompt = process.env.AI_SYSTEM_PROMPT || '';

    const hasEnvConfig = !!(envApiKey && envBaseUrl && envModel);

    if (hasEnvConfig) {
      return {
        enabled: true,
        apiKey: envApiKey,
        baseUrl: envBaseUrl.replace(/\/$/, ''),
        modelName: envModel,
        temperature: envTemp ? Number(envTemp) : 0.7,
        systemPrompt: envPrompt,
      };
    }

    const settings = await this.getSettings();
    if (!settings.isEnabled || !settings.apiKey || !settings.baseUrl || !settings.modelName) {
      return null;
    }
    return {
      enabled: true,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl.replace(/\/$/, ''),
      modelName: settings.modelName,
      temperature: settings.temperature,
      systemPrompt: settings.systemPrompt,
    };
  }
}

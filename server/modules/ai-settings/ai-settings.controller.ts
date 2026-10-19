import { Controller, Get, Patch, Body } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AiSettingsService } from './ai-settings.service';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';
import type { AiSettings } from '@shared/api.interface';

@Controller('api/ai-settings')
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  @Get()
  @NeedLogin()
  async getSettings(): Promise<AiSettings> {
    const settings = await this.aiSettingsService.getSettings();
    return { ...settings, apiKey: settings.apiKey ? '********' : '' };
  }

  @Patch()
  @NeedLogin()
  async updateSettings(@Body() dto: UpdateAiSettingsDto): Promise<AiSettings> {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.apiKey === '********') {
      delete patch.apiKey;
    }
    const updated = await this.aiSettingsService.updateSettings(patch);
    return { ...updated, apiKey: updated.apiKey ? '********' : '' };
  }
}

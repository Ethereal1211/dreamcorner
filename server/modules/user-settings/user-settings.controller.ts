import { Controller, Get, Patch, Body } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { UserSettingsService } from './user-settings.service';
import { UpdateSettingsDto } from './dto';
import type { UserSettings } from '@shared/api.interface';

@Controller('api/user-settings')
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get()
  @NeedLogin()
  async getSettings(): Promise<UserSettings> {
    return this.userSettingsService.getSettings();
  }

  @Patch()
  @NeedLogin()
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<UserSettings> {
    return this.userSettingsService.updateSettings(dto);
  }
}

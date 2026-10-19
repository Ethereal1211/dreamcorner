import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import { userSettings } from '@server/database/schema';
import type { UserSettings } from '@shared/api.interface';

const DEFAULT_SETTINGS = {
  themeName: 'dream_purple',
  primaryColor: 'hsl(280 80% 72%)',
  accentColor: 'hsl(320 70% 70%)',
  backgroundColor: 'hsl(270 40% 8%)',
  dreamRoleName: '梦角',
  dreamRoleAvatar: '梦',
  dreamRoleAvatarColor: 'from-violet-400 to-pink-400',
  dreamRoleAvatarUrl: '',
  userName: '',
  userAvatar: '我',
  userAvatarColor: 'from-blue-400 to-cyan-400',
  userAvatarUrl: '',
};

@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getSettings(): Promise<UserSettings> {
    const rows = await this.db
      .select()
      .from(userSettings)
      .limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        themeName: row.themeName,
        primaryColor: row.primaryColor,
        accentColor: row.accentColor,
        backgroundColor: row.backgroundColor,
        dreamRoleName: row.dreamRoleName,
        dreamRoleAvatar: row.dreamRoleAvatar,
        dreamRoleAvatarColor: row.dreamRoleAvatarColor,
        dreamRoleAvatarUrl: row.dreamRoleAvatarUrl,
        userName: row.userName,
        userAvatar: row.userAvatar,
        userAvatarColor: row.userAvatarColor,
        userAvatarUrl: row.userAvatarUrl,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }

    const inserted = await this.db
      .insert(userSettings)
      .values(DEFAULT_SETTINGS)
      .returning();

    const row = inserted[0];
    return {
      id: row.id,
      themeName: row.themeName,
      primaryColor: row.primaryColor,
      accentColor: row.accentColor,
      backgroundColor: row.backgroundColor,
      dreamRoleName: row.dreamRoleName,
      dreamRoleAvatar: row.dreamRoleAvatar,
      dreamRoleAvatarColor: row.dreamRoleAvatarColor,
      dreamRoleAvatarUrl: row.dreamRoleAvatarUrl,
      userName: row.userName,
      userAvatar: row.userAvatar,
      userAvatarColor: row.userAvatarColor,
      userAvatarUrl: row.userAvatarUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateSettings(patch: Partial<typeof DEFAULT_SETTINGS>): Promise<UserSettings> {
    const existing = await this.db
      .select()
      .from(userSettings)
      .limit(1);

    let row;
    if (existing.length > 0) {
      const updated = await this.db
        .update(userSettings)
        .set(patch)
        .where(eq(userSettings.id, existing[0].id))
        .returning();
      row = updated[0];
    } else {
      const inserted = await this.db
        .insert(userSettings)
        .values({ ...DEFAULT_SETTINGS, ...patch })
        .returning();
      row = inserted[0];
    }

    return {
      id: row.id,
      themeName: row.themeName,
      primaryColor: row.primaryColor,
      accentColor: row.accentColor,
      backgroundColor: row.backgroundColor,
      dreamRoleName: row.dreamRoleName,
      dreamRoleAvatar: row.dreamRoleAvatar,
      dreamRoleAvatarColor: row.dreamRoleAvatarColor,
      dreamRoleAvatarUrl: row.dreamRoleAvatarUrl,
      userName: row.userName,
      userAvatar: row.userAvatar,
      userAvatarColor: row.userAvatarColor,
      userAvatarUrl: row.userAvatarUrl,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

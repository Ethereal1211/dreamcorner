import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import type { UserSettings } from '@shared/api.interface';

export class UpdateSettingsDto implements Partial<UserSettings> {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  themeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dreamRoleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  dreamRoleAvatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  dreamRoleAvatarColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  userName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  userAvatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  userAvatarColor?: string;

  @IsOptional()
  @IsString()
  dreamRoleAvatarUrl?: string;

  @IsOptional()
  @IsString()
  userAvatarUrl?: string;
}

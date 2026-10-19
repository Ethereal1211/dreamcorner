import { IsString, IsOptional, MaxLength, IsNumber, IsBoolean } from 'class-validator';
import type { AiSettings } from '@shared/api.interface';

export class UpdateAiSettingsDto implements Partial<AiSettings> {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  provider?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelName?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class CreateDiaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  mood?: string;

  @IsOptional()
  @IsString()
  entryDate?: string;

  @IsOptional()
  @IsBoolean()
  isDream?: boolean;

  @IsOptional()
  @IsString()
  dreamRoleMessage?: string;
}

export class UpdateDiaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  mood?: string;

  @IsOptional()
  @IsString()
  entryDate?: string;

  @IsOptional()
  @IsBoolean()
  isDream?: boolean;

  @IsOptional()
  @IsString()
  dreamRoleMessage?: string;
}

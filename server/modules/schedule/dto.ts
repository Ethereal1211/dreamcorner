import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  scheduleDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  scheduleTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scheduleDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  scheduleTime?: string;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

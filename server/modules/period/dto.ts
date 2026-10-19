import { IsOptional, IsString, IsNumber, IsArray, Min, Max } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(60)
  cycleLength?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  periodLength?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];
}

export class UpdatePeriodDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(60)
  cycleLength?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  periodLength?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];
}

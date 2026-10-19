import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class CreateMomentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isFromDream?: boolean;
}

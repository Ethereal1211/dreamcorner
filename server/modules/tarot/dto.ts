import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DrawTarotDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  context?: string;
}

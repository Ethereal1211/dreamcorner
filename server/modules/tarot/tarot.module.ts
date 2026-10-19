import { Module } from '@nestjs/common';
import { TarotController } from './tarot.controller';
import { TarotService } from './tarot.service';

@Module({
  controllers: [TarotController],
  providers: [TarotService],
})
export class TarotModule {}

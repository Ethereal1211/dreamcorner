import { Module } from '@nestjs/common';
import { TarotController } from './tarot.controller';
import { TarotService } from './tarot.service';
import { AiService } from '@server/common/ai.service';
import { AiSettingsModule } from '@server/modules/ai-settings/ai-settings.module';

@Module({
  imports: [AiSettingsModule],
  controllers: [TarotController],
  providers: [TarotService, AiService],
})
export class TarotModule {}

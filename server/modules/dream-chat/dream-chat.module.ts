import { Module } from '@nestjs/common';
import { DreamChatController } from './dream-chat.controller';
import { DreamChatService } from './dream-chat.service';
import { AiService } from '@server/common/ai.service';
import { AiSettingsModule } from '@server/modules/ai-settings/ai-settings.module';

@Module({
  imports: [AiSettingsModule],
  controllers: [DreamChatController],
  providers: [DreamChatService, AiService],
})
export class DreamChatModule {}

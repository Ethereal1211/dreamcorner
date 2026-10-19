import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { TarotModule } from './modules/tarot/tarot.module';
import { DiaryModule } from './modules/diary/diary.module';
import { MomentsModule } from './modules/moments/moments.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { PeriodModule } from './modules/period/period.module';
import { DreamChatModule } from './modules/dream-chat/dream-chat.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';
import { AiSettingsModule } from './modules/ai-settings/ai-settings.module';

@Module({
  imports: [
    PlatformModule.forRoot(),
    TarotModule,
    DiaryModule,
    MomentsModule,
    ScheduleModule,
    PeriodModule,
    DreamChatModule,
    UserSettingsModule,
    AiSettingsModule,
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}

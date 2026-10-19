import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { DreamChatService } from './dream-chat.service';
import { SendMessageDto } from './dto';
import type { ChatMessage, ListResponse } from '@shared/api.interface';

@Controller('api/dream-chat')
export class DreamChatController {
  constructor(private readonly dreamChatService: DreamChatService) {}

  @Get('messages')
  @NeedLogin()
  async getMessages(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListResponse<ChatMessage>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.dreamChatService.getMessages(pageNum, pageSizeNum);
  }

  @Post('messages')
  @NeedLogin()
  async sendMessage(
    @Body() dto: SendMessageDto,
  ): Promise<{ userMessage: ChatMessage; dreamMessage: ChatMessage }> {
    return this.dreamChatService.sendMessage(dto.content, dto.messageType);
  }

  @Delete('messages/:id')
  @NeedLogin()
  async deleteMessage(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.dreamChatService.deleteMessage(id);
    return { success: true };
  }

  @Delete('clear')
  @NeedLogin()
  async clearAll(): Promise<{ success: boolean }> {
    await this.dreamChatService.clearAll();
    return { success: true };
  }

  @Post('draw-tarot')
  @NeedLogin()
  async drawTarot(
    @Body() dto: { context?: string },
  ): Promise<import('@shared/api.interface').TarotChatDrawResult> {
    return this.dreamChatService.drawTarotInChat(dto.context ?? '');
  }
}

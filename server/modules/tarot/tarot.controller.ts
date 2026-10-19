import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { TarotService } from './tarot.service';
import { DrawTarotDto } from './dto';
import type {
  TarotCard,
  TarotDrawRecord,
  TarotDrawResponse,
  ListResponse,
} from '@shared/api.interface';

@Controller('api/tarot')
export class TarotController {
  constructor(private readonly tarotService: TarotService) {}

  @Get('cards')
  @NeedLogin()
  async getAllCards(): Promise<{ cards: TarotCard[] }> {
    return { cards: this.tarotService.getAllCards() };
  }

  @Get('draws')
  @NeedLogin()
  async getDraws(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListResponse<TarotDrawRecord>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.tarotService.getDraws(pageNum, pageSizeNum);
  }

  @Get('draws/:id')
  @NeedLogin()
  async getDrawById(@Param('id') id: string): Promise<TarotDrawRecord> {
    return this.tarotService.getDrawById(id);
  }

  @Post('draw')
  @NeedLogin()
  async drawCard(@Body() dto: DrawTarotDto): Promise<TarotDrawResponse> {
    return this.tarotService.drawCard(dto.context ?? '');
  }
}

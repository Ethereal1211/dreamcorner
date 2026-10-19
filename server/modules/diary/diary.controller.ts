import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { DiaryService } from './diary.service';
import { CreateDiaryDto, UpdateDiaryDto } from './dto';
import type { DiaryEntry, ListResponse } from '@shared/api.interface';

@Controller('api/diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  @NeedLogin()
  async getList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListResponse<DiaryEntry>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.diaryService.getList(pageNum, pageSizeNum);
  }

  @Get(':id')
  @NeedLogin()
  async getById(@Param('id') id: string): Promise<DiaryEntry> {
    return this.diaryService.getById(id);
  }

  @Post()
  @NeedLogin()
  async create(@Body() dto: CreateDiaryDto): Promise<DiaryEntry> {
    return this.diaryService.create(dto);
  }

  @Patch(':id')
  @NeedLogin()
  async update(@Param('id') id: string, @Body() dto: UpdateDiaryDto): Promise<DiaryEntry> {
    return this.diaryService.update(id, dto);
  }

  @Delete(':id')
  @NeedLogin()
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.diaryService.remove(id);
    return { success: true };
  }
}

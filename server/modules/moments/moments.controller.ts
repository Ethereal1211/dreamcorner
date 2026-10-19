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
import { MomentsService } from './moments.service';
import { CreateMomentDto } from './dto';
import type { Moment, ListResponse } from '@shared/api.interface';

@Controller('api/moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Get()
  @NeedLogin()
  async getList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListResponse<Moment>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.momentsService.getList(pageNum, pageSizeNum);
  }

  @Get(':id')
  @NeedLogin()
  async getById(@Param('id') id: string): Promise<Moment> {
    return this.momentsService.getById(id);
  }

  @Post()
  @NeedLogin()
  async create(@Body() dto: CreateMomentDto): Promise<Moment> {
    return this.momentsService.create(dto);
  }

  @Patch(':id/like')
  @NeedLogin()
  async like(@Param('id') id: string): Promise<Moment> {
    return this.momentsService.like(id);
  }

  @Delete(':id')
  @NeedLogin()
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.momentsService.remove(id);
    return { success: true };
  }
}

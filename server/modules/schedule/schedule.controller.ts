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
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import type { Schedule, ListResponse } from '@shared/api.interface';

@Controller('api/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @NeedLogin()
  async getList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('date') date?: string,
  ): Promise<ListResponse<Schedule>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.scheduleService.getList(pageNum, pageSizeNum, date);
  }

  @Get(':id')
  @NeedLogin()
  async getById(@Param('id') id: string): Promise<Schedule> {
    return this.scheduleService.getById(id);
  }

  @Post()
  @NeedLogin()
  async create(@Body() dto: CreateScheduleDto): Promise<Schedule> {
    return this.scheduleService.create(dto);
  }

  @Patch(':id')
  @NeedLogin()
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto): Promise<Schedule> {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @NeedLogin()
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.scheduleService.remove(id);
    return { success: true };
  }
}

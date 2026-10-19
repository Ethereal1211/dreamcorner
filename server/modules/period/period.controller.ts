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
import { PeriodService } from './period.service';
import { CreatePeriodDto, UpdatePeriodDto } from './dto';
import type { PeriodRecord, PeriodPrediction, ListResponse } from '@shared/api.interface';

@Controller('api/period')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Get('records')
  @NeedLogin()
  async getRecords(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListResponse<PeriodRecord>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 参数无效');
    }
    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new BadRequestException('pageSize 参数无效，最大为 100');
    }
    return this.periodService.getRecords(pageNum, pageSizeNum);
  }

  @Get('prediction')
  @NeedLogin()
  async getPrediction(): Promise<PeriodPrediction> {
    return this.periodService.predictNextPeriod();
  }

  @Post('records')
  @NeedLogin()
  async create(@Body() dto: CreatePeriodDto): Promise<PeriodRecord> {
    return this.periodService.create(dto);
  }

  @Patch('records/:id')
  @NeedLogin()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodDto,
  ): Promise<PeriodRecord> {
    return this.periodService.update(id, dto);
  }

  @Delete('records/:id')
  @NeedLogin()
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.periodService.remove(id);
    return { success: true };
  }
}

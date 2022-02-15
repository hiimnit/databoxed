import { Controller, Get, Param } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DataboxesService } from './databoxes.service';

@Controller('databoxes')
export class DataboxesController {
  constructor(private readonly databoxesService: DataboxesService) {}

  @Get()
  async get() {
    const args: Prisma.DataboxFindManyArgs = {
      take: 10,
    };
    return this.databoxesService.databoxes(args);
  }

  @Get('/:id')
  async getById(@Param('id') id: string) {
    return this.databoxesService.databox(id);
  }
}

// TODO use a azure function with a time trigger to call the data refresh?

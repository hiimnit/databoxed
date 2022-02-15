import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DataboxesController } from './databoxes.controller';
import { DataboxesService } from './databoxes.service';

@Module({
  controllers: [DataboxesController],
  providers: [PrismaService, DataboxesService],
})
export class DataboxesModule {}

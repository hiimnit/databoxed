import { Injectable } from '@nestjs/common';
import { Databox, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DataboxesService {
  constructor(private readonly prisma: PrismaService) {}

  async databox(id: string): Promise<Databox | null> {
    return this.prisma.databox.findUnique({
      where: {
        id: id,
      },
    });
  }

  async databoxes(args: Prisma.DataboxFindManyArgs): Promise<Databox[]> {
    return this.prisma.databox.findMany(args);
  }
}

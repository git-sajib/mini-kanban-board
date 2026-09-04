import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async create(boardId: string, userId: string, dto: CreateColumnDto) {
    await this.boardsService.verifyAccess(boardId, userId);

    let targetOrder = dto.order;
    if (targetOrder === undefined) {
      const lastColumn = await this.prisma.column.findFirst({
        where: { boardId },
        orderBy: { order: 'desc' },
      });
      targetOrder = lastColumn ? lastColumn.order + 1 : 0;
    }

    return this.prisma.column.create({
      data: {
        title: dto.title.trim(),
        order: targetOrder,
        boardId,
      },
      include: {
        tasks: true,
      },
    });
  }

  async update(columnId: string, userId: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyAccess(column.boardId, userId);

    return this.prisma.column.update({
      where: { id: columnId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async delete(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyAccess(column.boardId, userId);

    await this.prisma.column.delete({
      where: { id: columnId },
    });

    return { message: 'Column deleted successfully' };
  }
}

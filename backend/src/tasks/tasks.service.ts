import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async create(columnId: string, userId: string, dto: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.boardsService.verifyAccess(column.boardId, userId);

    const taskCount = await this.prisma.task.count({
      where: { columnId },
    });

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        order: taskCount,
        columnId,
        assigneeId: dto.assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.verifyAccess(task.column.boardId, userId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.boardsService.verifyAccess(task.column.boardId, userId);

    const columnId = task.columnId;

    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: taskId },
      });

      // Re-normalize sibling orders
      const remainingTasks = await tx.task.findMany({
        where: { columnId },
        orderBy: { order: 'asc' },
      });

      for (let i = 0; i < remainingTasks.length; i++) {
        if (remainingTasks[i].order !== i) {
          await tx.task.update({
            where: { id: remainingTasks[i].id },
            data: { order: i },
          });
        }
      }
    });

    return { message: 'Task deleted successfully' };
  }

  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const sourceCol = await this.prisma.column.findUnique({
      where: { id: dto.sourceColumnId },
    });

    const targetCol = await this.prisma.column.findUnique({
      where: { id: dto.targetColumnId },
    });

    if (!sourceCol || !targetCol) {
      throw new NotFoundException('Source or Target column not found');
    }

    // Ensure columns belong to the same board to prevent unauthorized cross-board moving
    if (sourceCol.boardId !== targetCol.boardId) {
      throw new BadRequestException('Cross-board task movement is prohibited');
    }

    // Verify access
    await this.boardsService.verifyAccess(sourceCol.boardId, userId);

    const isSameColumn = dto.sourceColumnId === dto.targetColumnId;

    await this.prisma.$transaction(async (tx) => {
      if (isSameColumn) {
        // Fetch all tasks in column except current task
        const tasks = await tx.task.findMany({
          where: { columnId: dto.sourceColumnId, id: { not: taskId } },
          orderBy: { order: 'asc' },
        });

        // Insert current task at target position
        const targetIndex = Math.min(Math.max(0, dto.newOrder), tasks.length);
        tasks.splice(targetIndex, 0, task);

        // Update all tasks with deterministic gapless 0..N order
        for (let i = 0; i < tasks.length; i++) {
          await tx.task.update({
            where: { id: tasks[i].id },
            data: { order: i },
          });
        }
      } else {
        // Target column
        const targetTasks = await tx.task.findMany({
          where: { columnId: dto.targetColumnId, id: { not: taskId } },
          orderBy: { order: 'asc' },
        });

        const targetIndex = Math.min(Math.max(0, dto.newOrder), targetTasks.length);
        targetTasks.splice(targetIndex, 0, task);

        for (let i = 0; i < targetTasks.length; i++) {
          await tx.task.update({
            where: { id: targetTasks[i].id },
            data: {
              columnId: dto.targetColumnId,
              order: i,
            },
          });
        }

        // Normalize source column remaining tasks
        const sourceRemaining = await tx.task.findMany({
          where: { columnId: dto.sourceColumnId, id: { not: taskId } },
          orderBy: { order: 'asc' },
        });

        for (let i = 0; i < sourceRemaining.length; i++) {
          await tx.task.update({
            where: { id: sourceRemaining[i].id },
            data: { order: i },
          });
        }
      }
    });

    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { BoardRole } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: BoardRole.OWNER,
          },
        },
        columns: {
          create: [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'Done', order: 2 },
          ],
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            columns: true,
          },
        },
      },
    });
  }

  async findOne(boardId: string, userId: string) {
    await this.verifyAccess(boardId, userId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    await this.verifyAccess(boardId, userId, true); // Owner only

    return this.prisma.board.update({
      where: { id: boardId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
      },
    });
  }

  async delete(boardId: string, userId: string) {
    await this.verifyAccess(boardId, userId, true); // Owner only

    await this.prisma.board.delete({
      where: { id: boardId },
    });

    return { message: 'Board deleted successfully' };
  }

  async addMember(boardId: string, currentUserId: string, dto: AddMemberDto) {
    await this.verifyAccess(boardId, currentUserId, true); // Owner only

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!targetUser) {
      throw new NotFoundException(`No registered user found with email: ${dto.email}`);
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException('You are already the owner of this board');
    }

    const existingMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this board');
    }

    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId: targetUser.id,
        role: BoardRole.MEMBER,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeMember(boardId: string, currentUserId: string, memberUserId: string) {
    await this.verifyAccess(boardId, currentUserId, true); // Owner only

    if (memberUserId === currentUserId) {
      throw new BadRequestException('Board owner cannot be removed');
    }

    const member = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: memberUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this board');
    }

    await this.prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId: memberUserId,
        },
      },
    });

    return { message: 'Member removed successfully' };
  }

  async verifyAccess(boardId: string, userId: string, requireOwner = false) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isOwner = board.ownerId === userId;
    const isMember = board.members.some((m) => m.userId === userId);

    if (requireOwner && !isOwner) {
      throw new ForbiddenException('Only the board owner can perform this action');
    }

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return { board, isOwner, isMember };
  }
}

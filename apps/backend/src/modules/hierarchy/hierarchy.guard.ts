import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const HIERARCHY_OWNERSHIP_KEY = 'hierarchy_ownership';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 0,
  MASTER_ID: 1,
  AGENT: 2,
  USER: 3,
};

@Injectable()
export class HierarchyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredOwnership = this.reflector.getAllAndOverride<string>(HIERARCHY_OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredOwnership) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!targetUserId) {
      const userHierarchy = await this.prisma.userHierarchy.findUnique({
        where: { userId: user.sub },
      });
      if (!userHierarchy) {
        throw new ForbiddenException('Hierarchy not found');
      }
      return true;
    }

    const actorHierarchy = await this.prisma.userHierarchy.findUnique({
      where: { userId: user.sub },
    });

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { hierarchy: true },
    });

    if (!actorHierarchy || !targetUser || !targetUser.hierarchy) {
      throw new ForbiddenException('Hierarchy not found');
    }

    const actorLevel = ROLE_HIERARCHY[user.role];
    const targetLevel = ROLE_HIERARCHY[targetUser.role];

    if (actorLevel === undefined || targetLevel === undefined) {
      throw new ForbiddenException('Invalid role');
    }

    if (actorLevel >= targetLevel) {
      throw new ForbiddenException('Cannot manage users at the same or higher hierarchy level');
    }

    const hasAccess = await this.isDescendant(targetUser.hierarchy.id, actorHierarchy.id);
    if (!hasAccess) {
      throw new ForbiddenException('Not authorized to manage this user');
    }

    return true;
  }

  private async isDescendant(targetId: string, ancestorId: string, depth: number = 0): Promise<boolean> {
    if (depth > 10) return false;
    if (targetId === ancestorId) return true;

    const node = await this.prisma.userHierarchy.findUnique({
      where: { id: targetId },
      select: { parentId: true },
    });

    if (!node || !node.parentId) return false;
    if (node.parentId === ancestorId) return true;

    return this.isDescendant(node.parentId, ancestorId, depth + 1);
  }
}

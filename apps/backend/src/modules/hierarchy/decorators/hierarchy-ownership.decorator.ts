import { SetMetadata } from '@nestjs/common';
import { HIERARCHY_OWNERSHIP_KEY } from '../hierarchy.guard';

export const HierarchyOwnership = (mode: 'direct' | 'subtree') =>
  SetMetadata(HIERARCHY_OWNERSHIP_KEY, mode);

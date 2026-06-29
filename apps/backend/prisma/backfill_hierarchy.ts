import { PrismaClient, UserRole, HierarchyLevel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting UserHierarchy backfill...");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${users.length} users to process.`);

  const roleToLevel: Record<UserRole, HierarchyLevel> = {
    SUPER_ADMIN: "LEVEL_1_ADMIN",
    ADMIN: "LEVEL_1_ADMIN",
    MASTER_ID: "LEVEL_2_MASTER",
    AGENT: "LEVEL_3_AGENT",
    USER: "LEVEL_4_PLAYER",
  };

  const hierarchyMap = new Map<string, string>();

  for (const user of users) {
    const level = roleToLevel[user.role];
    const isPlayer = level === "LEVEL_4_PLAYER";

    const existing = await prisma.userHierarchy.findUnique({ where: { userId: user.id } });
    if (existing) {
      console.log(`  SKIP: ${user.email} already has hierarchy entry ${existing.id}`);
      hierarchyMap.set(user.id, existing.id);
      continue;
    }

    const hierarchy = await prisma.userHierarchy.create({
      data: {
        userId: user.id,
        parentId: null,
        level,
        commissionRate: isPlayer ? null : 0,
        creditLimit: isPlayer
          ? null
          : level === "LEVEL_1_ADMIN"
            ? 100000
            : level === "LEVEL_2_MASTER"
              ? 50000
              : 25000,
        exposureLimit: isPlayer
          ? null
          : level === "LEVEL_1_ADMIN"
            ? 50000
            : level === "LEVEL_2_MASTER"
              ? 25000
              : 10000,
        maxPlayerCount: isPlayer
          ? null
          : level === "LEVEL_1_ADMIN"
            ? 100
            : level === "LEVEL_2_MASTER"
              ? 50
              : 25,
      },
    });

    hierarchyMap.set(user.id, hierarchy.id);
    console.log(`  Created: ${user.email} (${user.role} -> ${level})`);
  }

  const adminIds = users.filter(u => roleToLevel[u.role] === "LEVEL_1_ADMIN").map(u => u.id);
  const masterIds = users.filter(u => roleToLevel[u.role] === "LEVEL_2_MASTER").map(u => u.id);
  const agentIds = users.filter(u => roleToLevel[u.role] === "LEVEL_3_AGENT").map(u => u.id);

  for (const user of users) {
    const hierarchyId = hierarchyMap.get(user.id);
    if (!hierarchyId) continue;

    const level = roleToLevel[user.role];
    let parentUserId: string | undefined;

    if (level === "LEVEL_2_MASTER" && adminIds.length > 0) {
      parentUserId = adminIds[0];
    } else if (level === "LEVEL_3_AGENT") {
      parentUserId = masterIds.length > 0 ? masterIds[0] : adminIds[0];
    } else if (level === "LEVEL_4_PLAYER") {
      if (user.referredById) {
        parentUserId = user.referredById;
      } else if (agentIds.length > 0) {
        parentUserId = agentIds[0];
      } else if (masterIds.length > 0) {
        parentUserId = masterIds[0];
      } else if (adminIds.length > 0) {
        parentUserId = adminIds[0];
      }
    }

    if (parentUserId) {
      const parentHierarchyId = hierarchyMap.get(parentUserId);
      if (parentHierarchyId) {
        const existing = await prisma.userHierarchy.findUnique({ where: { id: hierarchyId } });
        if (existing && existing.parentId !== parentHierarchyId) {
          await prisma.userHierarchy.update({
            where: { id: hierarchyId },
            data: { parentId: parentHierarchyId },
          });
        }
      }
    }
  }

  const total = await prisma.userHierarchy.count();
  console.log(`\nBackfill complete. ${total} hierarchy entries total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

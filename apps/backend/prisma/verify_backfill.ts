import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== USER COUNT ===");
  const users = await prisma.user.count();
  console.log(`SELECT COUNT(*) FROM users; => ${users}`);

  console.log("\n=== HIERARCHY COUNT ===");
  const hierarchies = await prisma.userHierarchy.count();
  console.log(`SELECT COUNT(*) FROM user_hierarchy; => ${hierarchies}`);

  console.log("\n=== MATCH: every user has exactly 1 hierarchy record ===");
  const missing: any[] = await prisma.$queryRawUnsafe(`
    SELECT u.id, u.email, u.username
    FROM users u
    LEFT JOIN user_hierarchy uh ON uh.user_id = u.id
    WHERE uh.id IS NULL
  `) as any[];
  if (missing.length === 0) {
    console.log("PASS: No users missing hierarchy records.");
  } else {
    console.log(`FAIL: ${missing.length} users have no hierarchy:`);
    console.table(missing);
  }

  const orphans: any[] = await prisma.$queryRawUnsafe(`
    SELECT uh.id, uh.user_id
    FROM user_hierarchy uh
    LEFT JOIN users u ON u.id = uh.user_id
    WHERE u.id IS NULL
  `) as any[];
  if (orphans.length === 0) {
    console.log("PASS: No orphaned hierarchy records.");
  } else {
    console.log(`FAIL: ${orphans.length} hierarchy records with no user:`);
    console.table(orphans);
  }

  const duplicates: any[] = await prisma.$queryRawUnsafe(`
    SELECT user_id, COUNT(*) as cnt
    FROM user_hierarchy
    GROUP BY user_id
    HAVING COUNT(*) > 1
  `) as any[];
  if (duplicates.length === 0) {
    console.log("PASS: No users with duplicate hierarchy records.");
  } else {
    console.log(`FAIL: ${duplicates.length} users have multiple hierarchy records:`);
    console.table(duplicates);
  }

  const detailed: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      u.email,
      u.role,
      uh.level,
      uh.commission_rate,
      uh.credit_limit,
      uh.exposure_limit,
      uh.max_player_count,
      uh.parent_id IS NOT NULL AS has_parent
    FROM users u
    JOIN user_hierarchy uh ON uh.user_id = u.id
    ORDER BY u.created_at
  `) as any[];
  console.log("\n=== USER-HIERARCHY MAPPING ===");
  console.table(detailed);

  if (users === hierarchies) {
    console.log(`\nVERDICT: PASS - ${users} users, ${hierarchies} hierarchy records (1:1 match).`);
  } else {
    console.log(`\nVERDICT: FAIL - ${users} users vs ${hierarchies} hierarchy records (mismatch).`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

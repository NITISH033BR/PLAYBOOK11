import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const rows: any[] = await p.$queryRawUnsafe(`
    SELECT
      u.id, u.email, u.username, u.role,
      uh.id AS hierarchy_id,
      uh.level,
      uh.parent_id,
      uh.commission_rate,
      uh.credit_limit,
      uh.exposure_limit,
      uh.max_player_count,
      (SELECT u2.email FROM users u2 WHERE u2.id = (SELECT uh2.user_id FROM user_hierarchy uh2 WHERE uh2.id = uh.parent_id)) AS parent_email
    FROM users u
    LEFT JOIN user_hierarchy uh ON uh.user_id = u.id
    ORDER BY u.created_at
  `) as any[];
  console.log(JSON.stringify(rows, null, 2));
  await p.$disconnect();
})();

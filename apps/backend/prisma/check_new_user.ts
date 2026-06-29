import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const u = await p.user.count();
  const h = await p.userHierarchy.count();
  const d = await p.user.findUnique({ where: { email: "testnew@test.com" }, include: { hierarchy: true } });
  console.log(`users: ${u}, user_hierarchy: ${h}`);
  if (d && d.hierarchy) {
    console.log(`testnew hierarchy: ${d.hierarchy.id} level=${d.hierarchy.level}`);
  } else {
    console.log(`testnew has NO hierarchy entry: ${d ? JSON.stringify(d) : 'not found'}`);
  }
  await p.$disconnect();
})();

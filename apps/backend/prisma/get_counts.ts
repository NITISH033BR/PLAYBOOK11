import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const users = await p.user.count();
  const hierarchies = await p.userHierarchy.count();
  const wallets = await p.wallet.count();
  console.log(JSON.stringify({ users, user_hierarchy: hierarchies, wallets }));
  await p.$disconnect();
})();

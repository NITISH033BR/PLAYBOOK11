const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const u = await p.user.findFirst({ where: { username: "refreshTestUser" } });
  if (u) {
    await p.transaction.deleteMany({ where: { userId: u.id } });
    await p.wallet.deleteMany({ where: { userId: u.id } });
    await p.user.delete({ where: { id: u.id } });
    console.log("CLEANUP: removed test user");
  } else {
    console.log("CLEANUP: no test user found");
  }
  await p.$disconnect();
})().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });

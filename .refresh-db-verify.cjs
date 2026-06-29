const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const u = await p.user.findFirst({ where: { username: "refreshTestUser" } });
  if (!u) { console.log("USER NOT FOUND"); return; }
  const w = await p.wallet.findUnique({ where: { userId: u.id } });
  console.log("DB final balance=" + w.balance + " version=" + w.version);
  const txs = await p.walletTransaction.findMany({ where: { walletId: w.id }, orderBy: { createdAt: "asc" } });
  console.log("DB transaction count=" + txs.length);
  for (const tx of txs) {
    console.log("  DB: type=" + tx.type + " amount=" + tx.amount + " before=" + tx.balanceBefore + " after=" + tx.balanceAfter + " desc=" + tx.description);
  }
  await p.$disconnect();
})().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Clean up old test user if exists
  const existing = await prisma.user.findFirst({ where: { username: "refreshTestUser" } });
  if (existing) {
    await prisma.walletTransaction.deleteMany({ where: { wallet: { user: { username: "refreshTestUser" } } } });
    await prisma.wallet.deleteMany({ where: { user: { username: "refreshTestUser" } } });
    await prisma.user.delete({ where: { email: "refresh@test.com" } });
    console.log("Cleaned up existing test user");
  }

  const user = await prisma.user.create({
    data: {
      username: "refreshTestUser",
      email: "refresh@test.com",
      displayName: "Refresh Test User",
      passwordHash: "$2a$12$A89bGVewXZwRZWBlNm/MredpPJIH3cYuYd4Ub6PrXQMea/IFaT7iu",
      role: "USER",
      referralCode: "REF_" + Date.now().toString(36).toUpperCase(),
      isActive: true,
      wallet: {
        create: { balance: 1000, bonus: 0, locked: 0 },
      },
      hierarchy: {
        create: { level: "LEVEL_4_PLAYER", commissionRate: 0 },
      },
    },
  });
  console.log("Created user: id=" + user.id);
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  console.log("Wallet: id=" + wallet.id + " balance=" + wallet.balance + " version=" + wallet.version);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });

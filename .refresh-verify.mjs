import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { username: "refreshTestUser" } });
  if (!user) { console.log("USER NOT FOUND"); return; }
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  console.log("DB-INITIAL");
  console.log("USER_ID=" + user.id);
  console.log("WALLET_ID=" + wallet.id);
  console.log("BALANCE=" + wallet.balance);
  console.log("VERSION=" + wallet.version);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });

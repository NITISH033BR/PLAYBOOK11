import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const models = [
    "sport","league","team","match","market","odds","user","wallet","bet","betLeg",
    "transaction","referral","notification","refreshToken","auditLog","userHierarchy","commission"
  ];
  for (const m of models) {
    const c = await (p as any)[m].count();
    console.log(m + ": " + c);
  }
  await p.$disconnect();
}
main();

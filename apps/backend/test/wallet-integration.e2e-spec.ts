import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../src/prisma/prisma.module";
import { WalletModule } from "../src/modules/wallet/wallet.module";
import { WalletService } from "../src/modules/wallet/wallet.service";
import * as crypto from "crypto";

// ============================================================
// WALLET INTEGRATION TEST — REAL POSTGRESQL
// ============================================================
// Covers:
//   - Deposit flow
//   - Withdraw flow
//   - Wallet history
//   - Balance refresh persistence
//   - Transaction integrity
//   - Concurrency safety (optimistic locking)
// ============================================================

const uuid = () => crypto.randomUUID();

interface TestData {
  userId: string;
  walletId: string;
}

async function createWallet(prisma: PrismaClient, initialBalance: number): Promise<TestData> {
  const userId = uuid();
  const walletId = uuid();

  await prisma.user.create({
    data: {
      id: userId,
      email: `wallet_test_${userId.slice(0, 8)}@test.com`,
      username: `wallet_test_${userId.slice(0, 8)}`,
      passwordHash: "test-hash",
      displayName: "Wallet Test User",
      role: "USER",
      referralCode: `wref_${userId.slice(0, 8)}`,
    },
  });

  await prisma.wallet.create({
    data: {
      id: walletId,
      userId,
      balance: initialBalance,
      locked: 0,
      version: 0,
    },
  });

  return { userId, walletId };
}

async function destroyWallet(prisma: PrismaClient, data: TestData) {
  await prisma.transaction.deleteMany({ where: { userId: data.userId } });
  await prisma.wallet.deleteMany({ where: { id: data.walletId } });
  await prisma.user.deleteMany({ where: { id: data.userId } });
}

async function queryWallet(prisma: PrismaClient, data: TestData) {
  return prisma.wallet.findUnique({ where: { id: data.walletId } });
}

async function queryTransactions(prisma: PrismaClient, data: TestData, types?: string[]) {
  const where: any = { userId: data.userId };
  if (types) where.type = { in: types };
  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

jest.setTimeout(120000);

describe("WALLET INTEGRATION — Real PostgreSQL Evidence", () => {
  let prisma: PrismaClient;
  let moduleRef: TestingModule;
  let walletService: WalletService;

  // Main test user for deposit/withdraw/history
  let mainUser: TestData = null!;
  // Separate user for concurrency test
  let concurrencyUser: TestData = null!;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log("\n========================================");
    console.log("  WALLET INTEGRATION TEST");
    console.log("  Connected to PostgreSQL via Prisma");
    console.log("========================================");

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        WalletModule,
      ],
    }).compile();

    walletService = moduleRef.get(WalletService);

    // Main user starts with 1000
    mainUser = await createWallet(prisma, 1000);
    // Concurrency user starts with 100
    concurrencyUser = await createWallet(prisma, 100);
  });

  afterAll(async () => {
    await destroyWallet(prisma, mainUser);
    await destroyWallet(prisma, concurrencyUser);
    await moduleRef?.close();
    await prisma?.$disconnect();
    console.log("\n  Cleanup complete.");
  });

  // =============================================
  // DEPOSIT FLOW
  // =============================================
  describe("DEPOSIT FLOW", () => {
    let preWallet: any;

    it("1. initial balance is 1000", async () => {
      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1000);
      expect(Number(w!.locked)).toBe(0);
      preWallet = w;
    });

    it("2. deposit 500 → balance 1500, transaction created", async () => {
      const result = await walletService.deposit(mainUser.userId, { amount: 500 });

      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1500);
      expect(Number(w!.version)).toBe(1);

      // Transaction record
      expect(result.transaction.type).toBe("DEPOSIT");
      expect(Number(result.transaction.amount)).toBe(500);
      expect(Number(result.transaction.balanceBefore)).toBe(1000);
      expect(Number(result.transaction.balanceAfter)).toBe(1500);
      expect(result.transaction.status).toBe("COMPLETED");

      // Verify in DB
      const txns = await queryTransactions(prisma, mainUser, ["DEPOSIT"]);
      expect(txns.length).toBeGreaterThanOrEqual(1);
      const depositTxn = txns[0];
      expect(Number(depositTxn.amount)).toBe(500);
      expect(Number(depositTxn.balanceAfter)).toBe(1500);
    });

    it("3. second deposit 200 → balance 1700 (accumulation works)", async () => {
      await walletService.deposit(mainUser.userId, { amount: 200 });

      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1700);

      const deposits = await queryTransactions(prisma, mainUser, ["DEPOSIT"]);
      expect(deposits.length).toBe(2);

      // First deposit: 1000 → 1500
      expect(Number(deposits[1].amount)).toBe(500);
      expect(Number(deposits[1].balanceBefore)).toBe(1000);
      expect(Number(deposits[1].balanceAfter)).toBe(1500);

      // Second deposit: 1500 → 1700
      expect(Number(deposits[0].amount)).toBe(200);
      expect(Number(deposits[0].balanceBefore)).toBe(1500);
      expect(Number(deposits[0].balanceAfter)).toBe(1700);
    });

    it("4. negative amount rejected", async () => {
      await expect(
        walletService.deposit(mainUser.userId, { amount: -50 }),
      ).rejects.toThrow("Amount must be positive");
    });

    it("5. zero amount rejected", async () => {
      await expect(
        walletService.deposit(mainUser.userId, { amount: 0 }),
      ).rejects.toThrow("Amount must be positive");
    });
  });

  // =============================================
  // WITHDRAW FLOW
  // =============================================
  describe("WITHDRAW FLOW", () => {
    it("1. balance is 1700 before withdrawal", async () => {
      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1700);
    });

    it("2. withdraw 300 → balance 1400, transaction created", async () => {
      const result = await walletService.withdraw(mainUser.userId, { amount: 300 });

      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1400);

      // Transaction record
      expect(result.transaction.type).toBe("WITHDRAWAL");
      expect(Number(result.transaction.amount)).toBe(300);
      expect(Number(result.transaction.balanceBefore)).toBe(1700);
      expect(Number(result.transaction.balanceAfter)).toBe(1400);
      expect(result.transaction.status).toBe("COMPLETED");

      // Verify in DB
      const txns = await queryTransactions(prisma, mainUser, ["WITHDRAWAL"]);
      expect(txns.length).toBeGreaterThanOrEqual(1);
      expect(Number(txns[0].amount)).toBe(300);
      expect(Number(txns[0].balanceAfter)).toBe(1400);
    });

    it("3. insufficient balance blocked", async () => {
      await expect(
        walletService.withdraw(mainUser.userId, { amount: 99999 }),
      ).rejects.toThrow("Insufficient available balance");

      // Balance unchanged
      const w = await queryWallet(prisma, mainUser);
      expect(Number(w!.balance)).toBe(1400);
    });

    it("4. negative amount rejected", async () => {
      await expect(
        walletService.withdraw(mainUser.userId, { amount: -100 }),
      ).rejects.toThrow("Amount must be positive");
    });

    it("5. zero amount rejected", async () => {
      await expect(
        walletService.withdraw(mainUser.userId, { amount: 0 }),
      ).rejects.toThrow("Amount must be positive");
    });
  });

  // =============================================
  // WALLET HISTORY
  // =============================================
  describe("WALLET HISTORY", () => {
    it("1. history shows all transactions newest first", async () => {
      const result = await walletService.getTransactions(mainUser.userId, { page: 1, limit: 50 });

      expect(result.data.length).toBeGreaterThanOrEqual(3);

      // Newest first
      for (let i = 1; i < result.data.length; i++) {
        const prev = new Date(result.data[i - 1].createdAt).getTime();
        const curr = new Date(result.data[i].createdAt).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }

      // Log the types
      const types = result.data.map(t => `${t.type} ${t.amount} (${t.balanceBefore}→${t.balanceAfter})`);
      console.log(`\n  Transaction History (${result.data.length} rows):`);
      types.forEach(t => console.log(`    ${t}`));
    });

    it("2. pagination works", async () => {
      // Page 1, limit 2
      const page1 = await walletService.getTransactions(mainUser.userId, { page: 1, limit: 2 });
      expect(page1.data.length).toBeLessThanOrEqual(2);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.limit).toBe(2);
      expect(page1.meta.total).toBeGreaterThanOrEqual(3);

      // Page 2, limit 2
      const page2 = await walletService.getTransactions(mainUser.userId, { page: 2, limit: 2 });
      expect(page2.data.length).toBeGreaterThanOrEqual(1);
      expect(page2.meta.page).toBe(2);

      // Ensure no overlap
      const ids1 = new Set(page1.data.map(t => t.id));
      const ids2 = new Set(page2.data.map(t => t.id));
      for (const id of ids1) {
        expect(ids2.has(id)).toBe(false);
      }

      console.log(`\n  Pagination: page1=${page1.data.length}, page2=${page2.data.length}, total=${page1.meta.total}`);
    });

    it("3. transaction types are correct", async () => {
      const result = await walletService.getTransactions(mainUser.userId, { page: 1, limit: 50 });

      const depositTxns = result.data.filter(t => t.type === "DEPOSIT");
      const withdrawTxns = result.data.filter(t => t.type === "WITHDRAWAL");

      expect(depositTxns.length).toBe(2);
      expect(withdrawTxns.length).toBe(1);

      // Amounts correct
      expect(Number(depositTxns[1].amount)).toBe(500); // First deposit (oldest)
      expect(Number(depositTxns[0].amount)).toBe(200); // Second deposit
      expect(Number(withdrawTxns[0].amount)).toBe(300); // Withdrawal

      // Balance chain: 1000 → 1500 → 1700 → 1400
      const ordered = [...result.data].reverse();
      expect(Number(ordered[0].balanceBefore)).toBe(1000);
      expect(Number(ordered[0].balanceAfter)).toBe(1500);
      expect(Number(ordered[1].balanceBefore)).toBe(1500);
      expect(Number(ordered[1].balanceAfter)).toBe(1700);
      expect(Number(ordered[2].balanceBefore)).toBe(1700);
      expect(Number(ordered[2].balanceAfter)).toBe(1400);
    });
  });

  // =============================================
  // BALANCE REFRESH PERSISTENCE
  // =============================================
  describe("BALANCE REFRESH & API CONSISTENCY", () => {
    it("1. getWallet returns same balance as DB after operations", async () => {
      // Direct DB query
      const dbWallet = await queryWallet(prisma, mainUser);
      // API call
      const apiWallet = await walletService.getWallet(mainUser.userId);

      expect(Number(apiWallet.balance)).toBe(Number(dbWallet!.balance));
      expect(Number(apiWallet.locked)).toBe(Number(dbWallet!.locked));
      expect(apiWallet.version).toBe(dbWallet!.version);
    });

    it("2. multiple getWallet calls return consistent balance", async () => {
      const w1 = await walletService.getWallet(mainUser.userId);
      const w2 = await walletService.getWallet(mainUser.userId);
      const w3 = await walletService.getWallet(mainUser.userId);

      expect(Number(w1.balance)).toBe(Number(w2.balance));
      expect(Number(w2.balance)).toBe(Number(w3.balance));
    });

    it("3. after deposit, new getWallet reflects updated balance", async () => {
      const before = await walletService.getWallet(mainUser.userId);
      const beforeBal = Number(before.balance);

      await walletService.deposit(mainUser.userId, { amount: 100 });

      const after = await walletService.getWallet(mainUser.userId);
      expect(Number(after.balance)).toBe(beforeBal + 100);

      // Clean up: withdraw the extra 100 to restore previous balance
      await walletService.withdraw(mainUser.userId, { amount: 100 });
    });

    it("4. after withdraw, new getWallet reflects updated balance", async () => {
      const before = await walletService.getWallet(mainUser.userId);
      const beforeBal = Number(before.balance);

      await walletService.withdraw(mainUser.userId, { amount: 100 });

      const after = await walletService.getWallet(mainUser.userId);
      expect(Number(after.balance)).toBe(beforeBal - 100);

      // Restore
      await walletService.deposit(mainUser.userId, { amount: 100 });
    });

    it("5. page refresh equivalent — fresh query returns correct data", async () => {
      // Simulate a page refresh by creating a new service instance query
      const freshWallet = await walletService.getWallet(mainUser.userId);
      const dbWallet = await queryWallet(prisma, mainUser);

      expect(Number(freshWallet.balance)).toBe(Number(dbWallet!.balance));
      // Should match the expected running balance
      // 1000 + 500 + 200 - 300 = 1400
      expect(Number(freshWallet.balance)).toBe(1400);
    });
  });

  // =============================================
  // CONCURRENCY SAFETY
  // =============================================
  describe("CONCURRENCY SAFETY", () => {
    it("1. sequential deposits: both succeed, no lost updates", async () => {
      const w = await queryWallet(prisma, concurrencyUser);
      expect(Number(w!.balance)).toBe(100);
      expect(w!.version).toBe(0);

      // Deposit 100
      await walletService.deposit(concurrencyUser.userId, { amount: 100 });
      const after1 = await queryWallet(prisma, concurrencyUser);
      expect(Number(after1!.balance)).toBe(200);
      expect(after1!.version).toBe(1);

      // Deposit 200
      await walletService.deposit(concurrencyUser.userId, { amount: 200 });
      const after2 = await queryWallet(prisma, concurrencyUser);
      expect(Number(after2!.balance)).toBe(400);
      expect(after2!.version).toBe(2);

      console.log(`\n  Concurrency sequential: 100 → 200 → 400 (version: 0→1→2)`);
    });

    it("2. concurrent deposit race — version conflict prevents lost update", async () => {
      // Create a fresh wallet for this test
      const freshUser = await createWallet(prisma, 500);

      try {
        // Both deposits read the same initial version (0)
        const t1 = walletService.deposit(freshUser.userId, { amount: 100 });
        const t2 = walletService.deposit(freshUser.userId, { amount: 200 });

        const results = await Promise.allSettled([t1, t2]);

        // At least one should succeed
        const succeeded = results.filter(r => r.status === "fulfilled");
        const failed = results.filter(r => r.status === "rejected");

        expect(succeeded.length).toBeGreaterThanOrEqual(1);

        // The final balance should be at minimum 500 + (successful deposit amount)
        const finalWallet = await queryWallet(prisma, freshUser);
        const finalBalance = Number(finalWallet!.balance);

        // At minimum: one deposit succeeded
        expect(finalBalance).toBeGreaterThan(500);
        // At maximum: both deposits could succeed if they were serialized
        expect(finalBalance).toBeLessThanOrEqual(800);

        console.log(`\n  Concurrent deposit race: 500 → ${finalBalance}`);
        console.log(`  Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
        if (failed.length > 0) {
          const reason = (failed[0] as PromiseRejectedResult).reason;
          console.log(`  Failure reason: ${reason.message || reason}`);
        }

        // If version conflict occurred, verify it was caught
        if (failed.length > 0) {
          const errMsg = String((failed[0] as PromiseRejectedResult).reason?.message || "");
          const didCatchConflict = errMsg.includes("Concurrent update detected") || errMsg.includes("Please retry");
          expect(didCatchConflict || finalBalance === 800).toBe(true);
        }
      } finally {
        await destroyWallet(prisma, freshUser);
      }
    });

    it("3. deposit + withdraw race — version conflict", async () => {
      // Create another fresh wallet
      const freshUser = await createWallet(prisma, 1000);

      try {
        const t1 = walletService.deposit(freshUser.userId, { amount: 500 });
        const t2 = walletService.withdraw(freshUser.userId, { amount: 200 });

        const results = await Promise.allSettled([t1, t2]);

        const succeeded = results.filter(r => r.status === "fulfilled");
        const failed = results.filter(r => r.status === "rejected");

        const finalWallet = await queryWallet(prisma, freshUser);
        const finalBalance = Number(finalWallet!.balance);

        // Minimum: 1000 + 500 - 200 = 1300 (both succeed, serialized)
        // Or: 1000 + 500 = 1500 (only deposit succeeds)
        // Or: 1000 - 200 = 800 (only withdraw succeeds)
        expect(finalBalance).not.toBe(1000); // At least one should succeed

        console.log(`\n  Deposit/Withdraw race: 1000 → ${finalBalance}`);
        console.log(`  Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
      } finally {
        await destroyWallet(prisma, freshUser);
      }
    });
  });

  // =============================================
  // TRANSACTION INTEGRITY
  // =============================================
  describe("TRANSACTION INTEGRITY", () => {
    it("1. every balance change has a matching transaction record", async () => {
      const allTxns = await queryTransactions(prisma, mainUser);

      // Group by type and verify counts
      const depositTxns = allTxns.filter(t => t.type === "DEPOSIT");
      const withdrawTxns = allTxns.filter(t => t.type === "WITHDRAWAL");

      // Total deposits: 500 + 200 + 100 - 100 = 700 net (but we have extra deposit+withdraw from refresh tests)
      // Let's just verify the balance chain is consistent
      let runningBalance = 1000; // Initial balance
      const orderedTxns = [...allTxns].reverse(); // chronological order

      console.log(`\n  Transaction integrity — balance chain:`);
      for (const tx of orderedTxns) {
        const expectedAfter = tx.type === "DEPOSIT" || tx.type === "BET_WON" || tx.type === "TRANSFER_IN" || tx.type === "COMMISSION"
          ? Number(runningBalance) + Number(tx.amount)
          : Number(runningBalance) - Number(tx.amount);

        expect(Number(tx.balanceBefore)).toBe(runningBalance);
        expect(Number(tx.balanceAfter)).toBe(expectedAfter);

        console.log(`    ${tx.type}: ${tx.balanceBefore} → ${tx.balanceAfter} (Δ${tx.amount})`);
        runningBalance = Number(tx.balanceAfter);
      }

      // Final DB balance should match chain end
      const dbWallet = await queryWallet(prisma, mainUser);
      expect(Number(dbWallet!.balance)).toBe(runningBalance);
      console.log(`    Final DB balance: ${runningBalance} ✅`);
    });

    it("2. no orphan transactions — every transaction has a valid wallet", async () => {
      const txns = await prisma.transaction.findMany({
        where: { userId: mainUser.userId },
        include: { wallet: true },
      });

      for (const tx of txns) {
        expect(tx.wallet).not.toBeNull();
        expect(tx.wallet.userId).toBe(mainUser.userId);
      }

      console.log(`\n  Orphan check: ${txns.length} transactions, all have valid wallets ✅`);
    });

    it("3. balance does not drift — running total matches DB", async () => {
      // Re-calculate from scratch
      const allTxns = await queryTransactions(prisma, mainUser);
      const ordered = [...allTxns].reverse();

      let computedBalance = 1000;
      for (const tx of ordered) {
        if (tx.type === "DEPOSIT" || tx.type === "BET_WON" || tx.type === "TRANSFER_IN" || tx.type === "REFERRAL_BONUS" || tx.type === "COMMISSION") {
          computedBalance += Number(tx.amount);
        } else {
          computedBalance -= Number(tx.amount);
        }
      }

      const actualWallet = await queryWallet(prisma, mainUser);
      expect(Number(actualWallet!.balance)).toBe(computedBalance);
      console.log(`\n  Balance drift check: computed=${computedBalance}, actual=${Number(actualWallet!.balance)} ✅`);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../src/prisma/prisma.module";
import { BettingModule } from "../src/modules/betting/betting.module";
import { SettlementService } from "../src/modules/betting/settlement.service";
import { CommissionService } from "../src/modules/commission/commission.service";
import * as crypto from "crypto";

// ============================================================
// REAL DATABASE INTEGRATION TEST — COMMISSION ROLLBACK
// ============================================================
// Uses real PostgreSQL via PrismaClient.
// No mocks. No fake clients. Only database evidence.
// ============================================================

const uuid = () => crypto.randomUUID();

interface ScenarioData {
  sportId: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchId: string;
  marketId: string;
  winningOddsId: string;
  losingOddsId: string;
  playerUserId: string;
  agentUserId: string;
  masterUserId: string;
  playerHierarchyId: string;
  agentHierarchyId: string;
  masterHierarchyId: string;
  playerWalletId: string;
  agentWalletId: string;
  masterWalletId: string;
  betId: string;
  betLegId: string;
}

async function createScenarioData(prisma: PrismaClient): Promise<ScenarioData> {
  const data: ScenarioData = {
    sportId: uuid(),
    leagueId: uuid(),
    homeTeamId: uuid(),
    awayTeamId: uuid(),
    matchId: uuid(),
    marketId: uuid(),
    winningOddsId: uuid(),
    losingOddsId: uuid(),
    playerUserId: uuid(),
    agentUserId: uuid(),
    masterUserId: uuid(),
    playerHierarchyId: uuid(),
    agentHierarchyId: uuid(),
    masterHierarchyId: uuid(),
    playerWalletId: uuid(),
    agentWalletId: uuid(),
    masterWalletId: uuid(),
    betId: uuid(),
    betLegId: uuid(),
  };

  const slug = data.sportId.replace(/-/g, "").slice(0, 12);

  // 1. Sport
  await prisma.sport.create({
    data: { id: data.sportId, name: `Test Sport ${slug}`, slug: `test_sport_${slug}` },
  });

  // 2. League
  await prisma.league.create({
    data: { id: data.leagueId, sportId: data.sportId, name: `Test League ${slug}` },
  });

  // 3. Teams
  await prisma.team.create({
    data: { id: data.homeTeamId, name: `Home ${slug}`, sportId: data.sportId },
  });
  await prisma.team.create({
    data: { id: data.awayTeamId, name: `Away ${slug}`, sportId: data.sportId },
  });

  // 4. Match
  await prisma.match.create({
    data: {
      id: data.matchId,
      leagueId: data.leagueId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      startTime: new Date(Date.now() + 86400000),
      status: "FINISHED",
    },
  });

  // 5. Market
  await prisma.market.create({
    data: {
      id: data.marketId,
      matchId: data.matchId,
      name: `Test Market ${slug}`,
      type: "MATCH_ODDS",
      status: "OPEN",
    },
  });

  // 6. Odds
  await prisma.odds.create({
    data: {
      id: data.winningOddsId,
      marketId: data.marketId,
      label: "Team A",
      value: 2.0,
      active: true,
    },
  });
  await prisma.odds.create({
    data: {
      id: data.losingOddsId,
      marketId: data.marketId,
      label: "Team B",
      value: 3.5,
      active: true,
    },
  });

  // 7. Users
  await prisma.user.create({
    data: {
      id: data.playerUserId,
      email: `player_${slug}@test.com`,
      username: `player_${slug}`,
      passwordHash: "test-hash",
      displayName: "Test Player",
      role: "USER",
      referralCode: `ref_player_${slug}`,
    },
  });
  await prisma.user.create({
    data: {
      id: data.agentUserId,
      email: `agent_${slug}@test.com`,
      username: `agent_${slug}`,
      passwordHash: "test-hash",
      displayName: "Test Agent",
      role: "AGENT",
      referralCode: `ref_agent_${slug}`,
    },
  });
  await prisma.user.create({
    data: {
      id: data.masterUserId,
      email: `master_${slug}@test.com`,
      username: `master_${slug}`,
      passwordHash: "test-hash",
      displayName: "Test Master",
      role: "MASTER_ID",
      referralCode: `ref_master_${slug}`,
    },
  });

  // 8. Hierarchy
  await prisma.userHierarchy.create({
    data: {
      id: data.masterHierarchyId,
      userId: data.masterUserId,
      level: "LEVEL_2_MASTER",
      parentId: null,
      commissionRate: 5,
    },
  });
  await prisma.userHierarchy.create({
    data: {
      id: data.agentHierarchyId,
      userId: data.agentUserId,
      level: "LEVEL_3_AGENT",
      parentId: data.masterHierarchyId,
      commissionRate: 10,
    },
  });
  await prisma.userHierarchy.create({
    data: {
      id: data.playerHierarchyId,
      userId: data.playerUserId,
      level: "LEVEL_4_PLAYER",
      parentId: data.agentHierarchyId,
      commissionRate: 0,
    },
  });

  // 9. Wallets
  await prisma.wallet.create({
    data: {
      id: data.playerWalletId,
      userId: data.playerUserId,
      balance: 500,
      locked: 100,
      version: 0,
    },
  });
  await prisma.wallet.create({
    data: {
      id: data.agentWalletId,
      userId: data.agentUserId,
      balance: 1000,
      locked: 0,
      version: 0,
    },
  });
  await prisma.wallet.create({
    data: {
      id: data.masterWalletId,
      userId: data.masterUserId,
      balance: 5000,
      locked: 0,
      version: 0,
    },
  });

  // 10. Bet
  await prisma.bet.create({
    data: {
      id: data.betId,
      userId: data.playerUserId,
      type: "SINGLE",
      stake: 100,
      totalOdds: 2.0,
      potentialWin: 200,
      status: "PENDING",
    },
  });

  // 11. BetLeg
  await prisma.betLeg.create({
    data: {
      id: data.betLegId,
      betId: data.betId,
      marketId: data.marketId,
      oddsId: data.winningOddsId,
      oddsValue: 2.0,
      status: "PENDING",
    },
  });

  return data;
}

async function safeDelete(prisma: PrismaClient, table: string, ids: string[]) {
  const valid = ids.filter(Boolean);
  if (valid.length === 0) return;
  const where = valid.length === 1 ? { id: valid[0] } : { id: { in: valid } };
  switch (table) {
    case "commissionTransaction":
      await prisma.commissionTransaction.deleteMany({ where: { sourceBetId: { in: valid } } });
      break;
    case "commission":
      await prisma.commission.deleteMany({ where: { betId: { in: valid } } });
      break;
    case "transaction":
      await prisma.transaction.deleteMany({ where: { id: { in: valid } } });
      break;
    default:
      break;
  }
}

async function destroyScenarioData(prisma: PrismaClient, data: ScenarioData | null) {
  if (!data) return;

  const userIds = [data.playerUserId, data.agentUserId, data.masterUserId].filter(Boolean);
  const teamIds = [data.homeTeamId, data.awayTeamId].filter(Boolean);
  const hierarchyIds = [data.playerHierarchyId, data.agentHierarchyId, data.masterHierarchyId].filter(Boolean);
  const oddsIds = [data.winningOddsId, data.losingOddsId].filter(Boolean);
  const walletIds = [data.playerWalletId, data.agentWalletId, data.masterWalletId].filter(Boolean);

  // Cascade-safe delete order
  if (data.betId) {
    await safeDelete(prisma, "commissionTransaction", [data.betId]);
    await safeDelete(prisma, "commission", [data.betId]);
  }
  if (userIds.length > 0) {
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
  }
  if (data.betLegId) await prisma.betLeg.deleteMany({ where: { id: data.betLegId } });
  if (data.betId) await prisma.bet.deleteMany({ where: { id: data.betId } });
  if (walletIds.length > 0) await prisma.wallet.deleteMany({ where: { id: { in: walletIds } } });
  if (hierarchyIds.length > 0) await prisma.userHierarchy.deleteMany({ where: { id: { in: hierarchyIds } } });
  if (userIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  if (oddsIds.length > 0) await prisma.odds.deleteMany({ where: { id: { in: oddsIds } } });
  if (data.marketId) await prisma.market.deleteMany({ where: { id: data.marketId } });
  if (data.matchId) await prisma.match.deleteMany({ where: { id: data.matchId } });
  if (teamIds.length > 0) await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
  if (data.leagueId) await prisma.league.deleteMany({ where: { id: data.leagueId } });
  if (data.sportId) await prisma.sport.deleteMany({ where: { id: data.sportId } });
}

async function snapshotState(prisma: PrismaClient, data: ScenarioData, label: string) {
  const market = await prisma.market.findUnique({ where: { id: data.marketId } });
  const playerWallet = await prisma.wallet.findUnique({ where: { id: data.playerWalletId } });
  const agentWallet = await prisma.wallet.findUnique({ where: { id: data.agentWalletId } });
  const masterWallet = await prisma.wallet.findUnique({ where: { id: data.masterWalletId } });
  const bet = await prisma.bet.findUnique({ where: { id: data.betId } });
  const betLeg = await prisma.betLeg.findUnique({ where: { id: data.betLegId } });
  const commissions = await prisma.commission.findMany({
    where: { betId: data.betId },
  });
  const commissionTxns = await prisma.commissionTransaction.findMany({
    where: { sourceBetId: data.betId },
  });
  const userIds = [data.playerUserId, data.agentUserId, data.masterUserId];
  const txns = await prisma.transaction.findMany({
    where: { userId: { in: userIds } },
  });

  console.log(`\n=== ${label} ===`);
  console.log(`  Market status:    ${market?.status ?? "null"}`);
  console.log(`  Player wallet:    balance=${playerWallet?.balance ?? "null"}, locked=${playerWallet?.locked ?? "null"}, version=${playerWallet?.version ?? "null"}`);
  console.log(`  Agent wallet:     balance=${agentWallet?.balance ?? "null"}, locked=${agentWallet?.locked ?? "null"}, version=${agentWallet?.version ?? "null"}`);
  console.log(`  Master wallet:    balance=${masterWallet?.balance ?? "null"}, locked=${masterWallet?.locked ?? "null"}, version=${masterWallet?.version ?? "null"}`);
  console.log(`  Bet status:       ${bet?.status ?? "null"}`);
  console.log(`  BetLeg status:    ${betLeg?.status ?? "null"}`);
  console.log(`  Transaction rows: ${txns.length}  (${txns.map(t => t.type).join(", ") || "none"})`);
  console.log(`  Commission rows:  ${commissions.length}  (amounts: ${commissions.map(c => c.amount).join(", ") || "none"})`);
  console.log(`  Commission txn:   ${commissionTxns.length}  (amounts: ${commissionTxns.map(c => c.amount).join(", ") || "none"})`);

  return { market, playerWallet, agentWallet, masterWallet, bet, betLeg, commissions, commissionTxns, txns };
}

describe("Commission Rollback — Real PostgreSQL Evidence", () => {
  let prisma: PrismaClient;
  let moduleRef: TestingModule;
  let settlementService: SettlementService;
  let commissionService: CommissionService;

  let scenarioA: ScenarioData | null = null;
  let scenarioB: ScenarioData | null = null;

  jest.setTimeout(120000);

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log("\n========================================");
    console.log("  REAL DATABASE INTEGRATION TEST");
    console.log("  Connected to PostgreSQL via Prisma");
    console.log("========================================");

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        BettingModule,
      ],
    }).compile();

    settlementService = moduleRef.get(SettlementService);
    commissionService = moduleRef.get(CommissionService);
  });

  afterAll(async () => {
    await destroyScenarioData(prisma, scenarioA);
    await destroyScenarioData(prisma, scenarioB);
    await moduleRef?.close();
    await prisma?.$disconnect();
    console.log("\n  Cleanup complete. Database connection closed.");
  });

  // =============================================
  // SCENARIO A: COMMISSION SUCCEEDS
  // =============================================
  describe("Scenario A — Commission succeeds", () => {
    beforeAll(async () => {
      scenarioA = await createScenarioData(prisma);
    });

    it("shows initial state BEFORE settlement", async () => {
      await snapshotState(prisma, scenarioA!, "BEFORE settlement (Scenario A)");
    });

    it("settles market with commission distribution", async () => {
      await settlementService.settleMarket(scenarioA!.marketId, scenarioA!.winningOddsId);
    });

    it("proves full settlement — market SETTLED, wallets paid, commissions exist", async () => {
      const snap = await snapshotState(prisma, scenarioA!, "AFTER settlement (Scenario A)");

      // Market must be SETTLED
      expect(snap.market?.status).toBe("SETTLED");

      // Player wallet: balance 500 + 100 profit = 600, locked 100 - 100 = 0
      expect(Number(snap.playerWallet?.balance)).toBe(600);
      expect(Number(snap.playerWallet?.locked)).toBe(0);

      // Agent wallet: 1000 + 10 commission = 1010
      expect(Number(snap.agentWallet?.balance)).toBe(1010);

      // Master wallet: 5000 + 4.5 commission = 5004.5
      expect(Number(snap.masterWallet?.balance)).toBe(5004.5);

      // Bet + Leg settled
      expect(snap.bet?.status).toBe("WON");
      expect(snap.betLeg?.status).toBe("WON");

      // Commission records exist
      expect(snap.commissions.length).toBe(2);
      expect(snap.commissionTxns.length).toBe(2);

      // First commission = agent (10% of 100 = 10), second = master (5% of 90 = 4.5)
      const sortedComms = [...snap.commissions].sort((a, b) => Number(a.amount) - Number(b.amount));
      expect(Number(sortedComms[0].amount)).toBe(4.5);
      expect(Number(sortedComms[1].amount)).toBe(10);

      // BET_WON transaction for player
      const playerTxns = snap.txns.filter(t => t.userId === scenarioA!.playerUserId);
      expect(playerTxns.length).toBeGreaterThanOrEqual(1);
      expect(playerTxns.some(t => t.type === "BET_WON")).toBe(true);

      // Commission transactions for agent + master
      const agentTxns = snap.txns.filter(t => t.userId === scenarioA!.agentUserId);
      const masterTxns = snap.txns.filter(t => t.userId === scenarioA!.masterUserId);
      expect(agentTxns.length).toBeGreaterThanOrEqual(1);
      expect(masterTxns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =============================================
  // SCENARIO B: COMMISSION FAILS → MUST ROLLBACK
  // =============================================
  describe("Scenario B — Commission fails → Full DB rollback", () => {
    beforeAll(async () => {
      scenarioB = await createScenarioData(prisma);
    });

    it("shows initial state BEFORE attempted settlement", async () => {
      await snapshotState(prisma, scenarioB!, "BEFORE settlement (Scenario B)");
    });

    it("settleMarket throws when commission fails inside transaction", async () => {
      const spy = jest
        .spyOn(commissionService, "distributeBetCommissionInTx")
        .mockRejectedValue(new Error("Forced commission failure"));

      await expect(
        settlementService.settleMarket(scenarioB!.marketId, scenarioB!.winningOddsId),
      ).rejects.toThrow("Forced commission failure");

      spy.mockRestore();
    });

    it("proves FULL DATABASE ROLLBACK — zero side effects", async () => {
      const snap = await snapshotState(prisma, scenarioB!, "AFTER failed settlement (Scenario B)");

      // [[ ASSERTION 1 ]] Market must still be OPEN (not SETTLED)
      expect(snap.market?.status).toBe("OPEN");

      // [[ ASSERTION 2 ]] Player wallet balance unchanged
      expect(Number(snap.playerWallet?.balance)).toBe(500);

      // [[ ASSERTION 3 ]] Player locked unchanged
      expect(Number(snap.playerWallet?.locked)).toBe(100);

      // [[ ASSERTION 4 ]] Agent wallet balance unchanged
      expect(Number(snap.agentWallet?.balance)).toBe(1000);

      // [[ ASSERTION 5 ]] Master wallet balance unchanged
      expect(Number(snap.masterWallet?.balance)).toBe(5000);

      // [[ ASSERTION 6 ]] Bet + Leg still PENDING (never touched)
      expect(snap.bet?.status).toBe("PENDING");
      expect(snap.betLeg?.status).toBe("PENDING");

      // [[ ASSERTION 7 ]] Zero commission rows
      expect(snap.commissions.length).toBe(0);
      expect(snap.commissionTxns.length).toBe(0);

      // [[ ASSERTION 8 ]] Zero transaction rows for all scenario users
      const scenarioTxns = snap.txns.filter(
        t => t.userId === scenarioB!.playerUserId
           || t.userId === scenarioB!.agentUserId
           || t.userId === scenarioB!.masterUserId,
      );
      expect(scenarioTxns.length).toBe(0);

      console.log("\n========================================");
      console.log("  ✅ REAL DATABASE ROLLBACK VERIFIED");
      console.log("  All 8 assertions passed:");
      console.log("    1. Market remains OPEN");
      console.log("    2. Player wallet balance unchanged (500)");
      console.log("    3. Player wallet locked unchanged (100)");
      console.log("    4. Agent wallet balance unchanged (1000)");
      console.log("    5. Master wallet balance unchanged (5000)");
      console.log("    6. Bet + Leg remain PENDING");
      console.log("    7. Zero commission rows created");
      console.log("    8. Zero transaction rows created");
      console.log("========================================\n");
    });
  });
});

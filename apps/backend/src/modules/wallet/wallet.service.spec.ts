import { Test, TestingModule } from "@nestjs/testing";
import { WalletService } from "./wallet.service";
import { ExposureService } from "../hierarchy/exposure.service";
import { PrismaService } from "../../prisma/prisma.service";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";

function createMockPrisma() {
  const mock: any = {
    wallet: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    userHierarchy: { findUnique: jest.fn(), findMany: jest.fn() },
    transaction: { create: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    bet: { aggregate: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    market: { update: jest.fn(), findUnique: jest.fn() },
    betLeg: { findMany: jest.fn(), update: jest.fn() },
    commission: { create: jest.fn() },
    commissionTransaction: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation((cb: any) => cb(mock));
  return mock;
}

function createMockExposureService() {
  return {
    getPlayerExposure: jest.fn(),
    getAgentExposure: jest.fn(),
    getMasterExposure: jest.fn(),
  };
}

describe("WalletService", () => {
  let service: WalletService;
  let mockPrisma: any;
  let mockExposureService: any;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockExposureService = createMockExposureService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ExposureService, useValue: mockExposureService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  beforeEach(() => {
    for (const key of Object.keys(mockPrisma)) {
      if (typeof mockPrisma[key] === "function") continue;
      for (const fnKey of Object.keys(mockPrisma[key])) {
        if (jest.isMockFunction(mockPrisma[key][fnKey])) {
          mockPrisma[key][fnKey].mockReset();
        }
      }
    }
    for (const fnKey of Object.keys(mockExposureService)) {
      if (jest.isMockFunction(mockExposureService[fnKey])) {
        mockExposureService[fnKey].mockReset();
      }
    }
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
  });

  describe("addBalance", () => {
    const actorId = "super-admin-id";
    const targetUserId = "master-id";
    const dto = { userId: targetUserId, amount: 1000, description: "Test add" };
    const mockWallet = { id: "w1", userId: targetUserId, balance: 500, locked: 0, version: 1 };

    it("should add balance to a MASTER account", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...mockWallet, balance: 1500, version: 2 });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.addBalance(actorId, dto);
      expect(result.wallet.balance).toBe(1500);
    });

    it("should reject if actor is not SUPER_ADMIN/ADMIN", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: "AGENT" });
      await expect(service.addBalance("agent-id", dto)).rejects.toThrow(ForbiddenException);
    });

    it("should reject if target is not MASTER_ID", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "AGENT" });
      mockPrisma.wallet.findUnique.mockResolvedValue({ id: "w1", userId: targetUserId, balance: 500, locked: 0, version: 1 });
      await expect(service.addBalance(actorId, dto)).rejects.toThrow(BadRequestException);
    });

    it("should reject if target wallet not found", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(null);
      await expect(service.addBalance(actorId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("deductBalance", () => {
    const actorId = "super-admin-id";
    const targetUserId = "master-id";
    const dto = { userId: targetUserId, amount: 200, description: "Test deduct" };
    const mockWallet = { id: "w1", userId: targetUserId, balance: 500, locked: 0, version: 1 };

    it("should deduct balance from a MASTER account", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.userHierarchy.findUnique.mockResolvedValue({ exposureLimit: 1000 });
      mockExposureService.getMasterExposure.mockResolvedValue(200);
      mockPrisma.wallet.update.mockResolvedValue({ ...mockWallet, balance: 300, version: 2 });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.deductBalance(actorId, dto);
      expect(result.wallet.balance).toBe(300);
    });

    it("should reject if amount exceeds balance", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      await expect(service.deductBalance(actorId, { ...dto, amount: 600 })).rejects.toThrow(BadRequestException);
    });

    it("should reject if deduct would leave balance below exposure", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.userHierarchy.findUnique.mockResolvedValue({ exposureLimit: 1000 });
      mockExposureService.getMasterExposure.mockResolvedValue(400);
      await expect(service.deductBalance(actorId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("transfer", () => {
    const masterId = "master-id";
    const agentId = "agent-id";
    const dto = { toUserId: agentId, amount: 500, description: "Transfer to agent" };
    const mockMasterUser = { id: masterId, role: "MASTER_ID" };
    const mockAgentUser = { id: agentId, role: "AGENT" };
    const mockMasterHierarchy = { id: "h1", creditLimit: 2000, exposureLimit: 5000 };
    const mockAgentHierarchy = { id: "h2", parentId: "h1" };
    const mockMasterWallet = { id: "w1", userId: masterId, balance: 2000, locked: 0, version: 1 };
    const mockAgentWallet = { id: "w2", userId: agentId, balance: 300, locked: 0, version: 1 };

    it("should transfer from MASTER to AGENT", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockMasterUser)
        .mockResolvedValueOnce(mockAgentUser);
      mockPrisma.userHierarchy.findUnique
        .mockResolvedValueOnce(mockMasterHierarchy)
        .mockResolvedValueOnce(mockAgentHierarchy)
        .mockResolvedValueOnce({ id: "h1" });
      mockPrisma.wallet.findUnique
        .mockResolvedValueOnce(mockMasterWallet)
        .mockResolvedValueOnce(mockAgentWallet);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });
      mockExposureService.getMasterExposure.mockResolvedValue(1000);
      mockPrisma.wallet.update
        .mockResolvedValueOnce({ ...mockMasterWallet, balance: 1500, version: 2 })
        .mockResolvedValueOnce({ ...mockAgentWallet, balance: 800, version: 2 });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.transfer(masterId, dto);
      expect(result.fromWallet.balance).toBe(1500);
      expect(result.toWallet.balance).toBe(800);
    });

    it("should reject if sender is not MASTER_ID or AGENT", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: "player-id", role: "USER" })
        .mockResolvedValueOnce({ id: "some-agent", role: "AGENT" });
      await expect(service.transfer("player-id", dto)).rejects.toThrow(ForbiddenException);
    });

    it("should reject if credit limit exceeded", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockMasterUser)
        .mockResolvedValueOnce(mockAgentUser);
      mockPrisma.userHierarchy.findUnique
        .mockResolvedValueOnce(mockMasterHierarchy)
        .mockResolvedValueOnce(mockAgentHierarchy)
        .mockResolvedValueOnce({ id: "h1" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockMasterWallet);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1800 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });
      mockExposureService.getMasterExposure.mockResolvedValue(0);
      await expect(service.transfer(masterId, { ...dto, amount: 300 })).rejects.toThrow(BadRequestException);
    });

    it("should reject if recipient is not direct downline", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockMasterUser)
        .mockResolvedValueOnce(mockAgentUser);
      mockPrisma.userHierarchy.findUnique
        .mockResolvedValueOnce(mockMasterHierarchy)
        .mockResolvedValueOnce({ id: "h2", parentId: "other-hierarchy" });
      await expect(service.transfer(masterId, dto)).rejects.toThrow(ForbiddenException);
    });

    it("should reject if insufficient balance", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockMasterUser)
        .mockResolvedValueOnce(mockAgentUser);
      mockPrisma.userHierarchy.findUnique
        .mockResolvedValueOnce(mockMasterHierarchy)
        .mockResolvedValueOnce(mockAgentHierarchy);
      mockPrisma.wallet.findUnique.mockResolvedValue(mockMasterWallet);
      await expect(service.transfer(masterId, { ...dto, amount: 3000 })).rejects.toThrow(BadRequestException);
    });
  });

  describe("credit limit calculation (getCurrentAllocatedCredit)", () => {
    it("should calculate net allocated credit (sent - returned)", async () => {
      mockPrisma.userHierarchy.findUnique.mockResolvedValue({ id: "h1" });
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });

      const result = await (service as any).getCurrentAllocatedCredit("master-id");
      expect(result).toBe(0);
    });

    it("should return 0 if no hierarchy", async () => {
      mockPrisma.userHierarchy.findUnique.mockResolvedValue(null);
      const result = await (service as any).getCurrentAllocatedCredit("unknown-id");
      expect(result).toBe(0);
    });

    it("should return 0 if net is negative", async () => {
      mockPrisma.userHierarchy.findUnique.mockResolvedValue({ id: "h1" });
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 } });

      const result = await (service as any).getCurrentAllocatedCredit("master-id");
      expect(result).toBe(0);
    });
  });

  describe("concurrent wallet operations (optimistic locking)", () => {
    it("should throw BadRequestException on version conflict", async () => {
      const actorId = "admin-id";
      const targetUserId = "master-id";
      const dto = { userId: targetUserId, amount: 100, description: "Test" };
      const mockWallet = { id: "w1", userId: targetUserId, balance: 500, locked: 0, version: 1 };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: "SUPER_ADMIN" })
        .mockResolvedValueOnce({ role: "MASTER_ID" });
      mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockRejectedValue({ code: "P2025" });

      await expect(service.deductBalance(actorId, dto)).rejects.toThrow("Please retry");
    });
  });
});

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface SlotSymbol {
  id: number;
  name: string;
  value: number;
}

interface SlotConfig {
  reels: number[][];
  paylines: number[][][];
  symbols: SlotSymbol[];
  multipliers: number[];
}

@Injectable()
export class CasinoPlayService {
  private readonly logger = new Logger(CasinoPlayService.name);
  private readonly rng = this.createRng();

  private readonly slotConfigs: Record<string, SlotConfig> = {};

  constructor(private readonly prisma: PrismaService) {
    this.initSlotConfigs();
  }

  private initSlotConfigs() {
    const symbols: SlotSymbol[] = [
      { id: 0, name: "star", value: 100 },
      { id: 1, name: "diamond", value: 50 },
      { id: 2, name: "seven", value: 30 },
      { id: 3, name: "bell", value: 20 },
      { id: 4, name: "watermelon", value: 15 },
      { id: 5, name: "cherry", value: 10 },
      { id: 6, name: "lemon", value: 8 },
      { id: 7, name: "plum", value: 6 },
      { id: 8, name: "orange", value: 5 },
      { id: 9, name: "grape", value: 4 },
      { id: 10, name: "wild", value: 200 },
      { id: 11, name: "scatter", value: 0 },
    ];

    const reel1 = [0, 5, 10, 2, 7, 1, 9, 3, 6, 11, 8, 4, 10, 7, 1, 5, 9, 2, 6, 0, 8, 3, 10, 4, 7];
    const reel2 = [1, 6, 11, 3, 8, 0, 9, 4, 10, 5, 7, 2, 8, 6, 0, 3, 10, 9, 1, 7, 4, 11, 5, 2, 8];
    const reel3 = [2, 7, 0, 4, 9, 1, 10, 5, 8, 3, 6, 11, 4, 9, 2, 7, 0, 10, 8, 1, 5, 6, 3, 11, 9];
    const reel4 = [3, 8, 1, 5, 10, 2, 6, 0, 9, 4, 11, 7, 1, 5, 10, 3, 8, 2, 6, 11, 4, 9, 0, 7, 5];
    const reel5 = [4, 9, 2, 6, 1, 10, 3, 7, 11, 5, 0, 8, 2, 6, 10, 4, 9, 1, 7, 11, 3, 8, 0, 5, 6];

    const paylines = [
      [[0,0],[0,1],[0,2],[0,3],[0,4]],
      [[1,0],[1,1],[1,2],[1,3],[1,4]],
      [[2,0],[2,1],[2,2],[2,3],[2,4]],
      [[0,0],[1,1],[2,2],[1,3],[0,4]],
      [[2,0],[1,1],[0,2],[1,3],[2,4]],
      [[0,0],[0,1],[1,2],[2,3],[2,4]],
      [[2,0],[2,1],[1,2],[0,3],[0,4]],
      [[1,0],[0,1],[0,2],[0,3],[1,4]],
      [[1,0],[2,1],[2,2],[2,3],[1,4]],
      [[0,0],[1,1],[1,2],[1,3],[0,4]],
      [[2,0],[1,1],[1,2],[1,3],[2,4]],
      [[0,0],[0,1],[2,2],[0,3],[0,4]],
      [[2,0],[2,1],[0,2],[2,3],[2,4]],
      [[1,0],[1,1],[0,2],[1,3],[1,4]],
      [[1,0],[1,1],[2,2],[1,3],[1,4]],
    ];

    const baseConfig: SlotConfig = {
      reels: [reel1, reel2, reel3, reel4, reel5],
      paylines,
      symbols,
      multipliers: [0, 0, 1, 2, 5, 15],
    };

    const highVolReel1 = [0, 5, 10, 2, 0, 7, 1, 9, 3, 0, 6, 11, 8, 4, 10, 0, 7, 1, 5, 9, 2, 6, 0, 8, 3, 10, 4, 7];

    this.slotConfigs["gates-of-olympus"] = {
      ...baseConfig,
      reels: [highVolReel1, reel2, reel3, reel4, reel5],
      symbols: symbols.map(s => ({ ...s, value: s.value * 1.3 })),
      multipliers: [0, 0, 2, 5, 10, 25],
    };

    this.slotConfigs["sweet-bonanza"] = {
      ...baseConfig,
      symbols: symbols.map(s => ({ ...s, value: s.value * 1.1 })),
      multipliers: [0, 0, 1, 3, 8, 20],
    };

    this.slotConfigs["wolf-gold"] = {
      ...baseConfig,
      symbols: symbols.map(s => ({ ...s, value: s.value * 1.2 })),
      multipliers: [0, 0, 2, 4, 7, 12],
    };

    this.slotConfigs["sugar-rush"] = {
      ...baseConfig,
      symbols: symbols.map(s => ({ ...s, value: s.value * 0.9 })),
      multipliers: [0, 0, 1, 2, 4, 10],
    };

    this.slotConfigs["starburst"] = {
      ...baseConfig,
      reels: [reel1, reel2, reel3, reel4.slice(0, 15), reel5.slice(0, 15)],
      symbols: symbols.map(s => ({ ...s, value: s.value * 1.5 })),
      multipliers: [0, 0, 1, 3, 6, 18],
    };

    this.slotConfigs["mega-moolah"] = {
      ...baseConfig,
      symbols: symbols.map(s => ({ ...s, value: s.value * 1.4 })),
      multipliers: [0, 0, 2, 6, 12, 30],
    };
  }

  private createRng() {
    let seed = Date.now() ^ 0xdeadbeef;
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private spinReels(config: SlotConfig): number[][] {
    return config.reels.map((reel) => {
      const start = Math.floor(this.rng() * reel.length);
      return [reel[start % reel.length], reel[(start + 1) % reel.length], reel[(start + 2) % reel.length]];
    });
  }

  private checkPaylines(grid: number[][], config: SlotConfig): { paylineIndex: number; symbolId: number; count: number; amount: number }[] {
    const results: { paylineIndex: number; symbolId: number; count: number; amount: number }[] = [];
    const symbolMap = new Map(config.symbols.map((s) => [s.id, s]));

    for (let pi = 0; pi < config.paylines.length; pi++) {
      const payline = config.paylines[pi];
      const firstSym = grid[payline[0][1]][payline[0][0]];
      if (firstSym === 11) continue;

      let count = 1;
      for (let i = 1; i < payline.length; i++) {
        const sym = grid[payline[i][1]][payline[i][0]];
        if (sym === firstSym || sym === 10) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 3) {
        const symbol = symbolMap.get(firstSym === 10 ? grid[payline[0][1]][payline[0][0]] : firstSym) || symbolMap.get(0)!;
        const multiplier = config.multipliers[count] || 0;
        const amount = symbol.value * multiplier;
        if (amount > 0) {
          results.push({ paylineIndex: pi, symbolId: firstSym, count, amount });
        }
      }
    }

    return results;
  }

  private checkScatters(grid: number[][]): number {
    let count = 0;
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 3; row++) {
        if (grid[col][row] === 11) count++;
      }
    }
    return count;
  }

  private runSlotRound(gameSlug: string, betAmount: number): {
    grid: number[][];
    paylineResults: { paylineIndex: number; symbolId: number; count: number; amount: number }[];
    scatterCount: number;
    scatterMultiplier: number;
    totalWin: number;
  } {
    const config = this.slotConfigs[gameSlug];
    if (!config) throw new BadRequestException(`Unknown slot game: ${gameSlug}`);

    const grid = this.spinReels(config);
    const paylineResults = this.checkPaylines(grid, config);
    const scatterCount = this.checkScatters(grid);
    const scatterMultiplier = scatterCount >= 3 ? scatterCount * 2 : 0;

    const paylineWin = paylineResults.reduce((sum, r) => sum + r.amount, 0);
    const scatterWin = scatterMultiplier * betAmount * 0.5;
    const totalWin = Math.round((paylineWin + scatterWin) * 100) / 100;

    return { grid, paylineResults, scatterCount, scatterMultiplier, totalWin };
  }

  private playRoulette(betAmount: number, betData?: Record<string, any>): {
    number: number;
    color: string;
    winAmount: number;
    isWin: boolean;
  } {
    const num = Math.floor(this.rng() * 37);
    const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const color = num === 0 ? "green" : reds.includes(num) ? "red" : "black";

    let winAmount = 0;
    const betType = betData?.type || "red";

    if (betType === "red" && color === "red") winAmount = betAmount * 2;
    else if (betType === "black" && color === "black") winAmount = betAmount * 2;
    else if (betType === "even" && num !== 0 && num % 2 === 0) winAmount = betAmount * 2;
    else if (betType === "odd" && num % 2 !== 0) winAmount = betAmount * 2;
    else if (betType === "low" && num >= 1 && num <= 18) winAmount = betAmount * 2;
    else if (betType === "high" && num >= 19 && num <= 36) winAmount = betAmount * 2;
    else if (betType === "number" && betData?.number === num) winAmount = betAmount * 35;
    else if (betType === "dozen" && betData?.dozen === Math.ceil(num / 12)) winAmount = betAmount * 3;
    else if (betType === "column" && betData?.column) {
      const col = betData.column;
      const colNums = [col, col+3, col+6, col+9, col+12, col+15, col+18, col+21, col+24, col+27, col+30, col+33];
      if (colNums.includes(num)) winAmount = betAmount * 3;
    }

    return { number: num, color, winAmount: Math.round(winAmount * 100) / 100, isWin: winAmount > 0 };
  }

  private createDeck(): string[] {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const deck: string[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${rank}-${suit}`);
      }
    }
    return this.shuffleArray(this.shuffleArray(deck));
  }

  private cardValue(rank: string): number {
    if (rank === "A") return 11;
    if (["K", "Q", "J"].includes(rank)) return 10;
    return parseInt(rank);
  }

  private handValue(cards: string[]): number {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
      const rank = card.split("-")[0];
      if (rank === "A") aces++;
      total += this.cardValue(rank);
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  private dealInitialBlackjack(): { playerCards: string[]; dealerCards: string[]; deck: string[] } {
    const deck = this.createDeck();
    const playerCards = [deck.pop()!, deck.pop()!];
    const dealerCards = [deck.pop()!, deck.pop()!];
    return { playerCards, dealerCards, deck };
  }

  private playDealerHand(cards: string[], deck: string[]): { cards: string[]; value: number } {
    let value = this.handValue(cards);
    while (value < 17) {
      cards.push(deck.pop()!);
      value = this.handValue(cards);
    }
    return { cards, value };
  }

  async play(userId: string, dto: { gameSlug: string; betAmount: number; betData?: Record<string, any> }) {
    const game = await this.prisma.casinoGame.findUnique({ where: { slug: dto.gameSlug } });
    if (!game) throw new NotFoundException("Game not found");
    if (!game.active) throw new BadRequestException("Game is not active");

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException("Wallet not found");

    const available = Number(wallet.balance);
    if (dto.betAmount > available) {
      throw new BadRequestException("Insufficient balance");
    }

    const category = await this.prisma.casinoCategory.findUnique({ where: { id: game.categoryId } });
    const categorySlug = category?.slug || "";

    let result: any;
    let winAmount = 0;
    let sessionStatus = "PLAYING";
    let isResumedSession = false;
    let existingSession: any = null;

    if (categorySlug === "slots" || this.slotConfigs[dto.gameSlug]) {
      const slotResult = this.runSlotRound(dto.gameSlug, dto.betAmount);
      winAmount = slotResult.totalWin;
      sessionStatus = winAmount > 0 ? "WON" : "LOST";
      result = {
        type: "slot",
        grid: slotResult.grid,
        paylineResults: slotResult.paylineResults,
        scatterCount: slotResult.scatterCount,
        scatterMultiplier: slotResult.scatterMultiplier,
        totalWin: slotResult.totalWin,
      };
    } else if (categorySlug === "roulette" || categorySlug === "live-casino") {
      const rouletteResult = this.playRoulette(dto.betAmount, dto.betData);
      winAmount = rouletteResult.winAmount;
      sessionStatus = winAmount > 0 ? "WON" : "LOST";
      result = rouletteResult;
    } else if (categorySlug === "blackjack") {
      const blackjack = this.dealInitialBlackjack();
      const playerValue = this.handValue(blackjack.playerCards);

      if (playerValue === 21) {
        const dealerResult = this.playDealerHand(blackjack.dealerCards.slice(1), [...blackjack.deck]);
        const dealerValue = dealerResult.value;
        if (dealerValue === 21) {
          winAmount = dto.betAmount;
          sessionStatus = "WON";
        } else {
          winAmount = dto.betAmount * 1.5;
          sessionStatus = "WON";
        }
        result = {
          type: "blackjack",
          playerCards: blackjack.playerCards,
          dealerCards: blackjack.dealerCards,
          dealerFinalCards: dealerResult.cards,
          playerValue: 21,
          dealerValue: dealerResult.value,
          natural: true,
          winAmount,
        };
      } else {
        result = {
          type: "blackjack",
          playerCards: blackjack.playerCards,
          dealerCards: [blackjack.dealerCards[0], "face-down"],
          dealerHoleCard: blackjack.dealerCards[1],
          playerValue,
          deck: blackjack.deck.slice(0, 40),
          remainingDeck: blackjack.deck.slice(40),
          winAmount: 0,
          isActive: true,
        };
        winAmount = 0;
        sessionStatus = "PLAYING";
      }
    } else if (dto.gameSlug === "dice") {
      const diceResult = this.playDice(dto.betAmount, dto.betData);
      winAmount = diceResult.winAmount;
      sessionStatus = winAmount > 0 ? "WON" : "LOST";
      result = diceResult;
    } else if (dto.gameSlug === "mines") {
      existingSession = await this.prisma.casinoSession.findFirst({
        where: { userId, gameSlug: dto.gameSlug, status: "PLAYING" },
        orderBy: { createdAt: "desc" },
      });

      let minesResult: any;
      if (existingSession) {
        isResumedSession = true;
        const savedResult = existingSession.result as any;
        minesResult = this.playMines(dto.betAmount, dto.betData, savedResult?.minePositions);
        minesResult.minePositions = savedResult?.minePositions;
        const isCashout = dto.betData?.action === "cashout";
        if (minesResult.exploded || isCashout || (minesResult.revealed?.length || 0) >= 24 - (savedResult?.mineCount || 3)) {
          sessionStatus = minesResult.exploded ? "LOST" : "WON";
          winAmount = minesResult.winAmount;
        } else {
          winAmount = 0;
          sessionStatus = "PLAYING";
        }
      } else {
        minesResult = this.playMines(dto.betAmount, dto.betData);
        if (minesResult.exploded) {
          winAmount = 0;
          sessionStatus = "LOST";
        } else {
          winAmount = minesResult.winAmount;
          sessionStatus = "PLAYING";
        }
      }
      result = minesResult;
      if (!existingSession) winAmount = 0;
    } else if (dto.gameSlug === "plinko") {
      const plinkoResult = this.playPlinko(dto.betAmount, dto.betData);
      winAmount = plinkoResult.winAmount;
      sessionStatus = winAmount > 0 ? "WON" : "LOST";
      result = plinkoResult;
    } else if (dto.gameSlug === "crash") {
      existingSession = await this.prisma.casinoSession.findFirst({
        where: { userId, gameSlug: dto.gameSlug, status: "PLAYING" },
        orderBy: { createdAt: "desc" },
      });

      let crashResult: any;
      if (existingSession) {
        isResumedSession = true;
        const savedResult = existingSession.result as any;
        crashResult = this.playCrash(dto.betAmount, { ...dto.betData, existingCrashPoint: savedResult?.crashPoint });
        winAmount = crashResult.winAmount;
        sessionStatus = winAmount > 0 ? "WON" : "LOST";
      } else {
        crashResult = this.playCrash(dto.betAmount, dto.betData);
        const hasAutoCashOut = dto.betData?.autoCashOut !== undefined;
        if (hasAutoCashOut && crashResult.isWin) {
          winAmount = crashResult.winAmount;
          sessionStatus = "WON";
        } else if (hasAutoCashOut && !crashResult.isWin) {
          winAmount = 0;
          sessionStatus = "LOST";
        } else {
          winAmount = 0;
          sessionStatus = "PLAYING";
        }
      }
      result = crashResult;
    } else if (categorySlug === "table-games") {
      const slotResult = this.runSlotRound(dto.gameSlug, dto.betAmount);
      winAmount = slotResult.totalWin;
      sessionStatus = winAmount > 0 ? "WON" : "LOST";
      result = {
        type: "slot",
        grid: slotResult.grid,
        paylineResults: slotResult.paylineResults,
        scatterCount: slotResult.scatterCount,
        scatterMultiplier: slotResult.scatterMultiplier,
        totalWin: slotResult.totalWin,
      };
    } else {
      throw new BadRequestException(`Unsupported game category: ${categorySlug}`);
    }

    const balanceChange = isResumedSession ? winAmount : winAmount - dto.betAmount;

    const session = await this.prisma.$transaction(async (tx: any) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: { increment: balanceChange },
          version: { increment: 1 },
        },
      });

      if (!isResumedSession) {
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: "BET_PLACED",
            amount: dto.betAmount,
            balanceBefore: Number(wallet.balance),
            balanceAfter: Number(wallet.balance) - dto.betAmount,
            status: "COMPLETED",
            description: `Casino bet on ${game.name}`,
          },
        });
      }

      if (winAmount > 0) {
        const wonBalanceBefore = isResumedSession
          ? Number(wallet.balance)
          : Number(wallet.balance) - dto.betAmount;
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: "BET_WON",
            amount: winAmount,
            balanceBefore: wonBalanceBefore,
            balanceAfter: updatedWallet.balance,
            status: "COMPLETED",
            description: `Casino win on ${game.name}`,
          },
        });
      }

      const session = await (isResumedSession && existingSession
        ? tx.casinoSession.update({
            where: { id: existingSession.id },
            data: { status: sessionStatus, winAmount, result },
          })
        : tx.casinoSession.create({
            data: {
              userId,
              gameId: game.id,
              gameSlug: dto.gameSlug,
              betAmount: dto.betAmount,
              winAmount,
              status: sessionStatus,
              result,
            },
          })
      );

      return { session, balance: Number(updatedWallet.balance) };
    });

    this.logger.log(`Casino play: user=${userId} game=${dto.gameSlug} bet=${dto.betAmount} win=${winAmount}`);

    return {
      sessionId: session.session.id,
      result,
      winAmount,
      balance: session.balance,
      status: sessionStatus,
    };
  }

  async blackjackHit(userId: string, sessionId: string) {
    const session = await this.prisma.casinoSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new ForbiddenException("Not your session");
    if (session.status !== "PLAYING") throw new BadRequestException("Session is not active");

    const result = session.result as any;
    if (!result || result.type !== "blackjack") throw new BadRequestException("Not a blackjack session");

    const deck = result.remainingDeck || [];
    result.playerCards.push(deck.pop()!);
    result.playerValue = this.handValue(result.playerCards);

    if (result.playerValue > 21) {
      result.winAmount = 0;
      result.final = true;
      result.message = "Bust";

      const wallet = (await this.prisma.wallet.findUnique({ where: { userId } }))!;

      await this.prisma.casinoSession.update({
        where: { id: sessionId },
        data: {
          status: "LOST",
          winAmount: 0,
          result,
        },
      });

      return {
        type: "blackjack",
        playerCards: result.playerCards,
        dealerCards: result.dealerCards,
        playerValue: result.playerValue,
        dealerValue: result.dealerValue || 0,
        winAmount: 0,
        balance: Number(wallet?.balance || 0),
        status: "LOST",
        message: "Bust",
      };
    }

    await this.prisma.casinoSession.update({
      where: { id: sessionId },
      data: { result },
    });

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } })!;

    return {
      type: "blackjack",
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerValue: result.playerValue,
      winAmount: 0,
      balance: Number(wallet?.balance || 0),
      status: "PLAYING",
    };
  }

  async blackjackStand(userId: string, sessionId: string) {
    const session = await this.prisma.casinoSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new ForbiddenException("Not your session");
    if (session.status !== "PLAYING") throw new BadRequestException("Session is not active");

    const result = session.result as any;
    if (!result || result.type !== "blackjack") throw new BadRequestException("Not a blackjack session");

    const deck = result.remainingDeck || [];
    const dealerCards = [result.dealerCards[0], result.dealerHoleCard];
    const fullDeck = [...deck, ...(result.remainingDeck || [])];

    let dealerValue = this.handValue(dealerCards);
    while (dealerValue < 17) {
      dealerCards.push(fullDeck.pop()!);
      dealerValue = this.handValue(dealerCards);
    }

    let winAmount = 0;
    let status = "LOST";

    if (dealerValue > 21) {
      winAmount = Number(session.betAmount) * 2;
      status = "WON";
    } else if (result.playerValue > dealerValue) {
      winAmount = Number(session.betAmount) * 2;
      status = "WON";
    } else if (result.playerValue === dealerValue) {
      winAmount = Number(session.betAmount);
      status = "WON";
    }

    if (winAmount > 0) {
      await this.prisma.$transaction(async (tx: any) => {
        const w = await tx.wallet.findUnique({ where: { userId } });
        await tx.wallet.update({
          where: { id: w.id, version: w.version },
          data: {
            balance: { increment: winAmount },
            version: { increment: 1 },
          },
        });
        await tx.transaction.create({
          data: {
            walletId: w.id,
            userId,
            type: "BET_WON",
            amount: winAmount,
            balanceBefore: w.balance,
            balanceAfter: w.balance + winAmount,
            status: "COMPLETED",
            description: `Blackjack win`,
          },
        });
      });
    }

    result.dealerCards = dealerCards;
    result.dealerValue = dealerValue;
    result.winAmount = winAmount;
    result.final = true;
    result.message = winAmount > Number(session.betAmount) ? "Win" : winAmount === Number(session.betAmount) ? "Push" : "Loss";

    await this.prisma.casinoSession.update({
      where: { id: sessionId },
      data: { status, winAmount, result },
    });

    const updatedWallet = await this.prisma.wallet.findUnique({ where: { userId } });

    return {
      type: "blackjack",
      playerCards: result.playerCards,
      dealerCards,
      playerValue: result.playerValue,
      dealerValue,
      winAmount,
      balance: Number(updatedWallet?.balance || 0),
      status,
      message: result.message,
    };
  }

  private playDice(betAmount: number, betData?: Record<string, any>): {
    dice1: number; dice2: number; total: number; prediction: string; winAmount: number; isWin: boolean;
  } {
    const dice1 = Math.floor(this.rng() * 6) + 1;
    const dice2 = Math.floor(this.rng() * 6) + 1;
    const total = dice1 + dice2;
    const prediction = betData?.prediction || "over";
    const target = betData?.target || 7;

    let winAmount = 0;
    if (prediction === "over" && total > target) winAmount = betAmount * 2;
    else if (prediction === "under" && total < target) winAmount = betAmount * 2;
    else if (prediction === "exact" && total === target) winAmount = betAmount * (target <= 7 ? target * 2 : (13 - target) * 2);

    return { dice1, dice2, total, prediction, winAmount: Math.round(winAmount * 100) / 100, isWin: winAmount > 0 };
  }

  private playMines(betAmount: number, betData?: Record<string, any>, existingMines?: number[]): {
    mineCount: number; revealed: number[]; exploded: boolean; winAmount: number; multiplier: number; minePositions?: number[];
  } {
    const gridSize = 25;
    const mineCount = betData?.mineCount || 3;
    const revealPositions = (betData?.revealPositions as number[]) || [];

    const minePositions = new Set<number>();
    if (existingMines && existingMines.length > 0) {
      existingMines.forEach((m) => minePositions.add(m));
    } else {
      while (minePositions.size < Math.min(mineCount, gridSize)) {
        minePositions.add(Math.floor(this.rng() * gridSize));
      }
    }

    let exploded = false;
    const revealed: number[] = [];
    let multiplier = 1;

    for (const pos of revealPositions) {
      if (minePositions.has(pos)) {
        exploded = true;
        break;
      }
      revealed.push(pos);
    }

    if (!exploded) {
      const safeCount = gridSize - mineCount;
      const revealedCount = revealed.length;
      for (let i = 0; i < revealedCount; i++) {
        multiplier *= (safeCount - i) / (gridSize - i);
      }
      multiplier = (1 / multiplier) * 0.97;
      multiplier = Math.round(multiplier * 100) / 100;
    }

    const winAmount = exploded ? 0 : Math.round(betAmount * multiplier * 100) / 100;

    return { mineCount, revealed, exploded, winAmount, multiplier, minePositions: Array.from(minePositions) };
  }

  private playPlinko(betAmount: number, betData?: Record<string, any>): {
    path: number[]; slot: number; multiplier: number; winAmount: number;
  } {
    const rows = betData?.rows || 12;
    const risk = betData?.risk || "medium";

    const multipliers: Record<string, number[]> = {
      low: [5, 3, 1.5, 0.5, 0.3, 0.2, 0.3, 0.5, 1.5, 3, 5],
      medium: [10, 5, 2, 0.4, 0.2, 0.1, 0.2, 0.4, 2, 5, 10],
      high: [20, 8, 3, 0.2, 0.1, 0.05, 0.1, 0.2, 3, 8, 20],
    };

    const mults = multipliers[risk] || multipliers.medium;
    const path: number[] = [];
    let position = Math.floor(rows / 2);

    for (let i = 0; i < rows; i++) {
      const dir = this.rng() > 0.5 ? 1 : -1;
      position += dir;
      if (position < 0) position = 0;
      if (position >= mults.length) position = mults.length - 1;
      path.push(position);
    }

    const slot = Math.max(0, Math.min(position, mults.length - 1));
    const multiplier = mults[slot];
    const winAmount = Math.round(betAmount * multiplier * 100) / 100;

    return { path, slot, multiplier, winAmount };
  }

  private playCrash(betAmount: number, betData?: Record<string, any>): {
    crashPoint: number; cashedOutAt: number | null; winAmount: number; isWin: boolean;
  } {
    const existingCrashPoint = betData?.existingCrashPoint as number | undefined;
    const houseEdge = 0.03;
    const crashPoint = existingCrashPoint || Math.round((1 / (1 - houseEdge - Math.sqrt(this.rng()) * (1 - houseEdge))) * 100) / 100;
    const autoCashOut = betData?.autoCashOut as number | undefined;
    const manualCashOut = betData?.cashOutAt as number | undefined;

    const cashOutAt = manualCashOut || autoCashOut || null;
    const isWin = cashOutAt !== null && cashOutAt <= crashPoint;
    const winAmount = isWin ? Math.round(betAmount * (cashOutAt!) * 100) / 100 : 0;

    return { crashPoint, cashedOutAt: isWin ? cashOutAt : null, winAmount, isWin };
  }

  async getSessions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.casinoSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { game: { select: { name: true, slug: true, image: true } } },
      }),
      this.prisma.casinoSession.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.casinoSession.findUnique({
      where: { id: sessionId },
      include: { game: { select: { name: true, slug: true, image: true } } },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new ForbiddenException("Not your session");
    return session;
  }
}

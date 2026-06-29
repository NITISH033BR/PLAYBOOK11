import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SettlementService } from "../betting/settlement.service";

@Injectable()
export class LiveSimulatorService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(LiveSimulatorService.name);
  private intervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementService: SettlementService,
  ) {}

  async onModuleInit() {
    await this.startAllSimulations();
  }

  onModuleDestroy() {
    this.intervals.forEach((interval) => clearInterval(interval));
  }

  async startAllSimulations() {
    const liveMatches = await this.prisma.match.findMany({
      where: { status: "LIVE" },
      select: { id: true },
    });
    for (const match of liveMatches) {
      this.startSimulation(match.id);
    }
  }

  startSimulation(matchId: string) {
    if (this.intervals.has(matchId)) return;

    this.logger.log(`Starting live simulation for match ${matchId}`);
    const interval = setInterval(async () => {
      try {
        await this.simulateTick(matchId);
      } catch (err) {
        this.logger.error(`Simulation error for ${matchId}: ${(err as Error).message}`);
      }
    }, 4000);

    this.intervals.set(matchId, interval);
  }

  stopSimulation(matchId: string) {
    const interval = this.intervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(matchId);
    }
  }

  private teamNameCache = new Map<string, string>();

  private async getTeamName(teamId: string): Promise<string> {
    if (this.teamNameCache.has(teamId)) return this.teamNameCache.get(teamId)!;
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    const name = team?.name || "Unknown";
    this.teamNameCache.set(teamId, name);
    return name;
  }

  private async simulateTick(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== "LIVE") {
      this.stopSimulation(matchId);
      return;
    }

    const isCricket = match.homeWickets !== null || match.awayWickets !== null;
    const isFootball = match.homeWickets === null && match.awayWickets === null;

    // Decide which team is batting (innings 1 = home, innings 2 = away)
    const battingIsHome = match.innings === 1 || !match.innings;

    const currentRuns = battingIsHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const currentWickets = battingIsHome ? (match.homeWickets || 0) : (match.awayWickets || 0);
    const currentOvers = Number(battingIsHome ? (match.homeOvers || 0) : (match.awayOvers || 0));

    if (isCricket) {
      // Simulate a cricket delivery (a tick happens every 4 seconds but we advance by a ball)
      // Each 6 ticks = 1 over
      if (currentWickets < 10) {
        // Simulate runs scored this delivery
        const rand = Math.random();
        let runsAdded = 0;
        let wicket = false;

        if (rand < 0.03) { // 3% wicket
          wicket = true;
          runsAdded = 0;
        } else if (rand < 0.08) { // 5% dot ball
          runsAdded = 0;
        } else if (rand < 0.20) { // 12% single
          runsAdded = 1;
        } else if (rand < 0.28) { // 8% double
          runsAdded = 2;
        } else if (rand < 0.30) { // 2% three
          runsAdded = 3;
        } else if (rand < 0.45) { // 15% boundary (4)
          runsAdded = 4;
        } else if (rand < 0.50) { // 5% six
          runsAdded = 6;
        } else { // ~50% single
          runsAdded = 1;
        }

        // Advance overs (1/6th of an over per tick)
        const newOvers = Math.round((currentOvers + 0.1667) * 10) / 10;
        const newRuns = currentRuns + runsAdded;
        const newWickets = wicket ? currentWickets + 1 : currentWickets;

        // Build batsmen data
        let batData = (match.batsmen || []) as any[];
        if (!Array.isArray(batData)) batData = [batData];
        const bowlerObj = (match.bowler || {}) as any;

        // Check if wicket - swap batsman
        if (wicket && batData.length > 1) {
          batData = [batData[1], batData[0]];
        }

        // Update striker's runs
        if (batData.length > 0 && !wicket) {
          batData[0] = {
            ...batData[0],
            runs: (batData[0].runs || 0) + runsAdded,
            balls: (batData[0].balls || 0) + 1,
            fours: (batData[0].fours || 0) + (runsAdded === 4 ? 1 : 0),
            sixes: (batData[0].sixes || 0) + (runsAdded === 6 ? 1 : 0),
          };
        }

        // Update bowler figures
        const updatedBowler = {
          ...bowlerObj,
          overs: newOvers.toFixed(1),
          runs: (bowlerObj.runs || 0) + runsAdded,
          wickets: (bowlerObj.wickets || 0) + (wicket ? 1 : 0),
        };

        // Partnership
        const partnershipData = (match.partnership || { runs: 0, balls: 0 }) as any;
        if (wicket) {
          partnershipData.runs = 0;
          partnershipData.balls = 0;
        } else {
          partnershipData.runs = (partnershipData.runs || 0) + runsAdded;
          partnershipData.balls = (partnershipData.balls || 0) + 1;
        }

        const update: any = {};
        if (battingIsHome) {
          update.homeScore = newRuns;
          update.homeWickets = newWickets;
          update.homeOvers = newOvers;
        } else {
          update.awayScore = newRuns;
          update.awayWickets = newWickets;
          update.awayOvers = newOvers;
        }

        // Calculate CRR
        const rr = newOvers > 0 ? newRuns / newOvers : 0;
        update.currentRr = Math.round(rr * 100) / 100;
        update.batsmen = batData;
        update.bowler = updatedBowler;
        update.partnership = partnershipData;

        // Match end: if overs >= 20 or all out
        if (newWickets >= 10 || newOvers >= 20) {
            // Switch innings or finish
          if (match.innings === 1) {
            update.innings = 2;
            update.battingTeam = "Away";
            update.bowlingTeam = "Home";
            // Reset batting data for next innings
            update.homeScore = battingIsHome ? newRuns : 0;
            update.homeWickets = battingIsHome ? newWickets : 0;
            update.homeOvers = 0;
            update.awayScore = battingIsHome ? 0 : newRuns;
            update.awayWickets = battingIsHome ? 0 : newWickets;
            update.awayOvers = 0;
            update.batsmen = [];
            update.bowler = { name: "", overs: "0.0", maidens: 0, runs: 0, wickets: 0 };
            update.partnership = { runs: 0, balls: 0 };
            // Required run rate for second innings
            const target = battingIsHome ? newRuns + 1 : (Number(match.homeScore) || 0) + 1;
            update.requiredRr = Math.round((target / 20) * 100) / 100;
          } else {
            update.status = "FINISHED";
          }
        }

        await this.prisma.match.update({ where: { id: matchId }, data: update });
      }
    } else if (isFootball) {
      // Football: randomly add goals (much rarer)
      if (Math.random() < 0.08) { // 8% chance per tick
        const homeGoal = Math.random() < 0.5;
        if (homeGoal) {
          await this.prisma.match.update({
            where: { id: matchId },
            data: { homeScore: { increment: 1 } },
          });
        } else {
          await this.prisma.match.update({
            where: { id: matchId },
            data: { awayScore: { increment: 1 } },
          });
        }
        this.logger.log(`Goal scored in match ${matchId}!`);
      }

      // End football match after some simulated time
      if (Math.random() < 0.005) { // 0.5% chance per tick to end
        const finalMatch = await this.prisma.match.update({
          where: { id: matchId },
          data: { status: "FINISHED" },
          include: { markets: { where: { status: "OPEN" } } },
        });
        for (const market of finalMatch.markets) {
          const hHome = finalMatch.homeScore || 0;
          const hAway = finalMatch.awayScore || 0;
          let winningOddsId: string | null = null;
          if (market.type === "MATCH_ODDS") {
            const winner = hHome > hAway ? finalMatch.homeTeamId : hAway > hHome ? finalMatch.awayTeamId : null;
            const homeName = await this.getTeamName(finalMatch.homeTeamId);
            const awayName = await this.getTeamName(finalMatch.awayTeamId);
            const winnerName = hHome > hAway ? homeName : hAway > hHome ? awayName : null;
            if (winnerName) {
              const odds = await this.prisma.odds.findFirst({
                where: { marketId: market.id, label: winnerName, active: true },
              });
              if (odds) winningOddsId = odds.id;
            }
          }
          if (winningOddsId) {
            await this.settlementService.settleMarket(market.id, winningOddsId);
          }
        }
        this.stopSimulation(matchId);
      }
    }
  }
}

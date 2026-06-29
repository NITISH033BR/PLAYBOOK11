import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllTime(limit: number = 100) {
    const results = (await this.prisma.$queryRawUnsafe(
      `SELECT
        u.id AS user_id,
        u.username,
        u.display_name,
        COUNT(b.id)::int AS total_bets,
        COUNT(CASE WHEN b.status = 'WON' THEN 1 END)::int AS total_wins,
        COALESCE(SUM(CASE WHEN b.status = 'WON' THEN b.potential_win ELSE 0 END), 0) AS total_winnings
      FROM users u
      LEFT JOIN bets b ON b.user_id = u.id
      WHERE u.status = 'ACTIVE'
      GROUP BY u.id, u.username, u.display_name
      ORDER BY total_winnings DESC
      LIMIT $1`,
      limit,
    )) as {
      user_id: string;
      username: string;
      display_name: string;
      total_bets: number;
      total_wins: number;
      total_winnings: string;
    }[];

    return results.map((row: { user_id: string; username: string; display_name: string; total_bets: number; total_wins: number; total_winnings: string }, index: number) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.display_name || row.username,
      totalBets: Number(row.total_bets),
      totalWins: Number(row.total_wins),
      totalWinnings: Number(row.total_winnings),
    }));
  }

  async getWeekly(limit: number = 100) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const results = (await this.prisma.$queryRawUnsafe(
      `SELECT
        u.id AS user_id,
        u.username,
        u.display_name,
        COUNT(b.id)::int AS total_wins,
        COALESCE(SUM(b.potential_win), 0) AS total_winnings
      FROM bets b
      JOIN users u ON u.id = b.user_id
      WHERE b.created_at >= $1 AND b.status = 'WON'
      GROUP BY u.id, u.username, u.display_name
      ORDER BY total_winnings DESC
      LIMIT $2`,
      weekAgo,
      limit,
    )) as {
      user_id: string;
      username: string;
      display_name: string;
      total_wins: number;
      total_winnings: string;
    }[];

    return results.map((row: { user_id: string; username: string; display_name: string; total_wins: number; total_winnings: string }, index: number) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.display_name || row.username,
      totalWins: Number(row.total_wins),
      totalWinnings: Number(row.total_winnings),
    }));
  }
}

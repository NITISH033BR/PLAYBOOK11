import { PrismaClient, OddsType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================
// DATA DEFINITIONS
// ============================================================

const SPORTS = [
  { name: "Cricket", slug: "cricket", icon: "🏏" },
  { name: "Football", slug: "football", icon: "⚽" },
  { name: "Tennis", slug: "tennis", icon: "🎾" },
  { name: "Basketball", slug: "basketball", icon: "🏀" },
  { name: "Baseball", slug: "baseball", icon: "⚾" },
  { name: "Hockey", slug: "hockey", icon: "🏒" },
  { name: "Rugby", slug: "rugby", icon: "🏉" },
  { name: "Boxing", slug: "boxing", icon: "🥊" },
  { name: "MMA", slug: "mma", icon: "🥋" },
  { name: "Golf", slug: "golf", icon: "⛳" },
];

const LEAGUES: Array<{ name: string; sportIdx: number; country: string }> = [
  // Cricket
  { name: "Indian Premier League", sportIdx: 0, country: "India" },
  { name: "Big Bash League", sportIdx: 0, country: "Australia" },
  { name: "The Hundred", sportIdx: 0, country: "England" },
  // Football
  { name: "English Premier League", sportIdx: 1, country: "England" },
  { name: "La Liga", sportIdx: 1, country: "Spain" },
  { name: "Serie A", sportIdx: 1, country: "Italy" },
  { name: "UEFA Champions League", sportIdx: 1, country: "Europe" },
  // Tennis
  { name: "Wimbledon", sportIdx: 2, country: "England" },
  { name: "US Open", sportIdx: 2, country: "USA" },
  { name: "Australian Open", sportIdx: 2, country: "Australia" },
  // Basketball
  { name: "NBA", sportIdx: 3, country: "USA" },
  { name: "EuroLeague", sportIdx: 3, country: "Europe" },
  // Baseball
  { name: "MLB", sportIdx: 4, country: "USA" },
  { name: "NPB", sportIdx: 4, country: "Japan" },
  // Hockey
  { name: "NHL", sportIdx: 5, country: "USA" },
  { name: "KHL", sportIdx: 5, country: "Russia" },
  // Rugby
  { name: "Six Nations", sportIdx: 6, country: "Europe" },
  { name: "Rugby World Cup", sportIdx: 6, country: "International" },
  // Boxing
  { name: "WBC", sportIdx: 7, country: "International" },
  // MMA
  { name: "UFC", sportIdx: 8, country: "International" },
  // Golf
  { name: "PGA Tour", sportIdx: 9, country: "USA" },
];

const TEAMS: Array<{ name: string; short: string; leagueIdx: number }> = [
  // IPL (0)
  { name: "Mumbai Indians", short: "MI", leagueIdx: 0 },
  { name: "Chennai Super Kings", short: "CSK", leagueIdx: 0 },
  { name: "Royal Challengers Bangalore", short: "RCB", leagueIdx: 0 },
  { name: "Kolkata Knight Riders", short: "KKR", leagueIdx: 0 },
  { name: "Sunrisers Hyderabad", short: "SRH", leagueIdx: 0 },
  { name: "Delhi Capitals", short: "DC", leagueIdx: 0 },
  { name: "Punjab Kings", short: "PBKS", leagueIdx: 0 },
  { name: "Rajasthan Royals", short: "RR", leagueIdx: 0 },
  { name: "Lucknow Super Giants", short: "LSG", leagueIdx: 0 },
  { name: "Gujarat Titans", short: "GT", leagueIdx: 0 },
  // BBL (1)
  { name: "Sydney Sixers", short: "SIX", leagueIdx: 1 },
  { name: "Melbourne Stars", short: "STA", leagueIdx: 1 },
  { name: "Brisbane Heat", short: "HEA", leagueIdx: 1 },
  { name: "Perth Scorchers", short: "SCO", leagueIdx: 1 },
  // The Hundred (2)
  { name: "Southern Brave", short: "SB", leagueIdx: 2 },
  { name: "Welsh Fire", short: "WF", leagueIdx: 2 },
  // EPL (3)
  { name: "Manchester City", short: "MCI", leagueIdx: 3 },
  { name: "Arsenal", short: "ARS", leagueIdx: 3 },
  { name: "Liverpool", short: "LIV", leagueIdx: 3 },
  { name: "Chelsea", short: "CHE", leagueIdx: 3 },
  { name: "Manchester United", short: "MUN", leagueIdx: 3 },
  { name: "Tottenham Hotspur", short: "TOT", leagueIdx: 3 },
  // La Liga (4)
  { name: "Real Madrid", short: "RMA", leagueIdx: 4 },
  { name: "Barcelona", short: "BAR", leagueIdx: 4 },
  { name: "Atletico Madrid", short: "ATM", leagueIdx: 4 },
  // Serie A (5)
  { name: "Inter Milan", short: "INT", leagueIdx: 5 },
  { name: "AC Milan", short: "ACM", leagueIdx: 5 },
  { name: "Juventus", short: "JUV", leagueIdx: 5 },
  // UCL (6)
  { name: "Bayern Munich", short: "BAY", leagueIdx: 6 },
  { name: "Paris Saint-Germain", short: "PSG", leagueIdx: 6 },
  // Tennis - Wimbledon (7)
  { name: "Carlos Alcaraz", short: "ALC", leagueIdx: 7 },
  { name: "Novak Djokovic", short: "DJO", leagueIdx: 7 },
  { name: "Jannik Sinner", short: "SIN", leagueIdx: 7 },
  // US Open (8)
  { name: "Daniil Medvedev", short: "MED", leagueIdx: 8 },
  { name: "Alexander Zverev", short: "ZVE", leagueIdx: 8 },
  // AO (9)
  { name: "Stefanos Tsitsipas", short: "TSI", leagueIdx: 9 },
  { name: "Andrey Rublev", short: "RUB", leagueIdx: 9 },
  // NBA (10)
  { name: "Los Angeles Lakers", short: "LAL", leagueIdx: 10 },
  { name: "Boston Celtics", short: "BOS", leagueIdx: 10 },
  { name: "Golden State Warriors", short: "GSW", leagueIdx: 10 },
  { name: "Miami Heat", short: "MIA", leagueIdx: 10 },
  // EuroLeague (11)
  { name: "Real Madrid Baloncesto", short: "RMB", leagueIdx: 11 },
  { name: "Fenerbahce Beko", short: "FEN", leagueIdx: 11 },
  // MLB (12)
  { name: "New York Yankees", short: "NYY", leagueIdx: 12 },
  { name: "Los Angeles Dodgers", short: "LAD", leagueIdx: 12 },
  { name: "Boston Red Sox", short: "BOS", leagueIdx: 12 },
  // NPB (13)
  { name: "Yomiuri Giants", short: "YG", leagueIdx: 13 },
  { name: "Hanshin Tigers", short: "HT", leagueIdx: 13 },
  // NHL (14)
  { name: "Toronto Maple Leafs", short: "TML", leagueIdx: 14 },
  { name: "Montreal Canadiens", short: "MHC", leagueIdx: 14 },
  // KHL (15)
  { name: "CSKA Moscow", short: "CSKA", leagueIdx: 15 },
  { name: "SKA Saint Petersburg", short: "SKA", leagueIdx: 15 },
  // Six Nations (16)
  { name: "England", short: "ENG", leagueIdx: 16 },
  { name: "France", short: "FRA", leagueIdx: 16 },
  { name: "Ireland", short: "IRE", leagueIdx: 16 },
  // RWC (17)
  { name: "New Zealand All Blacks", short: "NZL", leagueIdx: 17 },
  { name: "South Africa Springboks", short: "RSA", leagueIdx: 17 },
  // WBC (18) -- individual boxers
  // UFC (19) -- individual fighters
  // PGA (20) -- individual golfers
];

const matchSchedules: Array<{
  home: number; away: number; leagueIdx: number; status: string;
  hScore?: number; aScore?: number; hWickets?: number; aWickets?: number;
  hOvers?: number; aOvers?: number; startOffsetHrs: number;
}> = [];

function hoursFromNow(h: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d;
}

// IP panel: 3 live matches, 3 upcoming, 2 finished
matchSchedules.push(
  // LIVE Cricket
  { home: 0, away: 2, leagueIdx: 0, status: "LIVE", hScore: 178, hWickets: 4, hOvers: 17.2, aScore: 0, aWickets: 0, aOvers: 0, startOffsetHrs: -2 },
  { home: 1, away: 3, leagueIdx: 0, status: "LIVE", hScore: 134, hWickets: 6, hOvers: 19.1, aScore: 0, aWickets: 0, aOvers: 0, startOffsetHrs: -1.5 },
  { home: 4, away: 6, leagueIdx: 0, status: "LIVE", hScore: 89, hWickets: 2, hOvers: 11.3, aScore: 0, aWickets: 0, aOvers: 0, startOffsetHrs: -0.75 },
  // Scheduled Cricket
  { home: 5, away: 7, leagueIdx: 0, status: "SCHEDULED", startOffsetHrs: 2 },
  { home: 0, away: 1, leagueIdx: 0, status: "SCHEDULED", startOffsetHrs: 6 },
  { home: 8, away: 9, leagueIdx: 0, status: "SCHEDULED", startOffsetHrs: 12 },
  { home: 3, away: 4, leagueIdx: 0, status: "SCHEDULED", startOffsetHrs: 24 },
  { home: 2, away: 6, leagueIdx: 0, status: "SCHEDULED", startOffsetHrs: 36 },
  // Finished Cricket
  { home: 10, away: 11, leagueIdx: 1, status: "FINISHED", hScore: 165, hWickets: 5, hOvers: 20, aScore: 142, aWickets: 8, aOvers: 20, startOffsetHrs: -48 },
  { home: 12, away: 13, leagueIdx: 1, status: "FINISHED", hScore: 189, hWickets: 3, hOvers: 20, aScore: 172, aWickets: 6, aOvers: 20, startOffsetHrs: -72 },
  // BBL
  { home: 10, away: 12, leagueIdx: 1, status: "LIVE", hScore: 87, hWickets: 1, hOvers: 8.2, aScore: 0, aWickets: 0, aOvers: 0, startOffsetHrs: -0.5 },
  { home: 11, away: 13, leagueIdx: 1, status: "SCHEDULED", startOffsetHrs: 4 },
  // The Hundred
  { home: 14, away: 15, leagueIdx: 2, status: "SCHEDULED", startOffsetHrs: 8 },
  // Football - LIVE
  { home: 16, away: 18, leagueIdx: 3, status: "LIVE", hScore: 2, aScore: 1, startOffsetHrs: -1.25 },
  { home: 19, away: 20, leagueIdx: 3, status: "LIVE", hScore: 0, aScore: 0, startOffsetHrs: -0.5 },
  // Football - scheduled
  { home: 17, away: 21, leagueIdx: 3, status: "SCHEDULED", startOffsetHrs: 3 },
  { home: 16, away: 19, leagueIdx: 3, status: "SCHEDULED", startOffsetHrs: 10 },
  { home: 18, away: 20, leagueIdx: 3, status: "SCHEDULED", startOffsetHrs: 48 },
  // La Liga
  { home: 22, away: 23, leagueIdx: 4, status: "LIVE", hScore: 1, aScore: 1, startOffsetHrs: -0.75 },
  { home: 24, away: 22, leagueIdx: 4, status: "SCHEDULED", startOffsetHrs: 5 },
  { home: 23, away: 24, leagueIdx: 4, status: "SCHEDULED", startOffsetHrs: 28 },
  // Serie A
  { home: 25, away: 26, leagueIdx: 5, status: "FINISHED", hScore: 3, aScore: 0, startOffsetHrs: -96 },
  { home: 27, away: 25, leagueIdx: 5, status: "SCHEDULED", startOffsetHrs: 7 },
  // UCL
  { home: 28, away: 29, leagueIdx: 6, status: "SCHEDULED", startOffsetHrs: 14 },
  { home: 29, away: 28, leagueIdx: 6, status: "SCHEDULED", startOffsetHrs: 72 },
  // Tennis
  { home: 30, away: 31, leagueIdx: 7, status: "LIVE", hScore: 2, aScore: 1, startOffsetHrs: -1 },
  { home: 32, away: 30, leagueIdx: 7, status: "SCHEDULED", startOffsetHrs: 6 },
  { home: 33, away: 34, leagueIdx: 8, status: "SCHEDULED", startOffsetHrs: 9 },
  { home: 35, away: 36, leagueIdx: 9, status: "SCHEDULED", startOffsetHrs: 20 },
  // Basketball
  { home: 37, away: 38, leagueIdx: 10, status: "LIVE", hScore: 78, aScore: 72, startOffsetHrs: -1.5 },
  { home: 39, away: 40, leagueIdx: 10, status: "SCHEDULED", startOffsetHrs: 4 },
  { home: 38, away: 39, leagueIdx: 10, status: "SCHEDULED", startOffsetHrs: 16 },
  { home: 41, away: 42, leagueIdx: 11, status: "SCHEDULED", startOffsetHrs: 11 },
  // Baseball
  { home: 43, away: 44, leagueIdx: 12, status: "LIVE", hScore: 5, aScore: 3, startOffsetHrs: -2 },
  { home: 45, away: 43, leagueIdx: 12, status: "SCHEDULED", startOffsetHrs: 7 },
  { home: 46, away: 47, leagueIdx: 13, status: "SCHEDULED", startOffsetHrs: 14 },
  // Hockey
  { home: 48, away: 49, leagueIdx: 14, status: "SCHEDULED", startOffsetHrs: 5 },
  { home: 50, away: 51, leagueIdx: 15, status: "FINISHED", hScore: 3, aScore: 2, startOffsetHrs: -120 },
  // Rugby
  { home: 52, away: 53, leagueIdx: 16, status: "SCHEDULED", startOffsetHrs: 30 },
  { home: 54, away: 52, leagueIdx: 16, status: "SCHEDULED", startOffsetHrs: 56 },
  { home: 55, away: 56, leagueIdx: 17, status: "FINISHED", hScore: 27, aScore: 23, startOffsetHrs: -168 },
);

const batsmen_data = [
  [  // Match 0 - MI vs RCB
    { name: "Rohit Sharma", runs: 52, balls: 38, fours: 6, sixes: 2 },
    { name: "Ishan Kishan", runs: 41, balls: 29, fours: 4, sixes: 1 },
    { name: "Suryakumar Yadav", runs: 68, balls: 42, fours: 8, sixes: 3 },
  ],
  [  // Match 1 - CSK vs KKR
    { name: "Ruturaj Gaikwad", runs: 45, balls: 34, fours: 5, sixes: 1 },
    { name: "Shivam Dube", runs: 38, balls: 28, fours: 3, sixes: 2 },
  ],
  [  // Match 2 - SRH vs PBKS
    { name: "Travis Head", runs: 34, balls: 22, fours: 4, sixes: 1 },
    { name: "Abhishek Sharma", runs: 28, balls: 18, fours: 3, sixes: 2 },
  ],
  [  // Match 10 - BBL
    { name: "Josh Philippe", runs: 47, balls: 33, fours: 5, sixes: 1 },
    { name: "Moises Henriques", runs: 22, balls: 18, fours: 2, sixes: 0 },
  ],
];

const bowler_data = [
  { name: "Mohammed Siraj", overs: "3.2", maidens: 0, runs: 24, wickets: 1 },
  { name: "T Natarajan", overs: "3.0", maidens: 0, runs: 18, wickets: 2 },
  { name: "Kagiso Rabada", overs: "2.3", maidens: 0, runs: 14, wickets: 1 },
  { name: "Mitchell Starc", overs: "2.0", maidens: 0, runs: 12, wickets: 0 },
];

const partnership_data = [
  { runs: 78, balls: 52 },
  { runs: 56, balls: 38 },
  { runs: 42, balls: 28 },
  { runs: 45, balls: 30 },
];

// Market definitions per sport
function getMarketsForMatch(matchId: string, sportName: string): Array<{ name: string; type: string }> {
  const common = [
    { name: "Match Winner", type: "MATCH_ODDS" },
    { name: "Total Runs/Goals Over/Under", type: "OVER_UNDER" },
  ];
  if (sportName === "Cricket") {
    return [
      ...common,
      { name: "Top Batsman - Team 1", type: "TOP_BATSMAN" },
      { name: "Top Batsman - Team 2", type: "TOP_BATSMAN" },
      { name: "Top Bowler - Team 1", type: "TOP_BOWLER" },
      { name: "Top Bowler - Team 2", type: "TOP_BOWLER" },
      { name: "Session 1 (First 6 Overs) Runs", type: "SESSION" },
      { name: "Fall of First Wicket - Team 1", type: "FALL_OF_WICKET" },
      { name: "Player Boundaries - Virat Kohli", type: "PLAYER_BOUNDARIES" },
      { name: "Total Sixes", type: "TOTAL_RUNS" },
    ];
  }
  if (sportName === "Football") {
    return [
      ...common,
      { name: "Both Teams to Score", type: "BOTH_TEAMS_SCORE" },
      { name: "Correct Score", type: "CORRECT_SCORE" },
      { name: "First Goalscorer", type: "FANCY" },
      { name: "Double Chance", type: "WIN_DRAW_WIN" },
      { name: "Over/Under 1.5 Goals", type: "OVER_UNDER" },
    ];
  }
  if (sportName === "Tennis") {
    return [
      { name: "Match Winner", type: "MATCH_ODDS" },
      { name: "Set Winner", type: "FANCY" },
      { name: "Total Games Over/Under", type: "OVER_UNDER" },
      { name: "Correct Score", type: "CORRECT_SCORE" },
    ];
  }
  if (sportName === "Basketball") {
    return [
      ...common,
      { name: "Handicap", type: "HANDICAP" },
      { name: "Quarter Winner", type: "FANCY" },
      { name: "Player Points Over/Under", type: "PLAYER_RUNS" },
    ];
  }
  return common;
}

function getOddsForSelection(
  marketIdx: number, marketName: string, matchSport: string,
  homeTeam: string, awayTeam: string
): Array<{ label: string; type: OddsType; value: number; liquidity: number }> {
  if (marketIdx === 0 || marketName === "Match Winner") {
    return [
      { label: homeTeam, type: "BACK", value: parseFloat((1.5 + Math.random() * 1.5).toFixed(2)), liquidity: Math.floor(5000 + Math.random() * 15000) },
      { label: homeTeam, type: "LAY", value: parseFloat((1.6 + Math.random() * 1.5).toFixed(2)), liquidity: Math.floor(3000 + Math.random() * 10000) },
      { label: awayTeam, type: "BACK", value: parseFloat((1.8 + Math.random() * 2.5).toFixed(2)), liquidity: Math.floor(5000 + Math.random() * 15000) },
      { label: awayTeam, type: "LAY", value: parseFloat((1.9 + Math.random() * 2.5).toFixed(2)), liquidity: Math.floor(3000 + Math.random() * 10000) },
    ];
  }
  if (marketName.includes("Over/Under")) {
    const line = matchSport === "Cricket" ? 300.5 : matchSport === "Football" ? 2.5 : matchSport === "Basketball" ? 200.5 : 20.5;
    return [
      { label: `Over ${line}`, type: "BACK", value: parseFloat((1.7 + Math.random() * 0.6).toFixed(2)), liquidity: Math.floor(4000 + Math.random() * 10000) },
      { label: `Over ${line}`, type: "LAY", value: parseFloat((1.8 + Math.random() * 0.6).toFixed(2)), liquidity: Math.floor(2000 + Math.random() * 8000) },
      { label: `Under ${line}`, type: "BACK", value: parseFloat((1.7 + Math.random() * 0.6).toFixed(2)), liquidity: Math.floor(4000 + Math.random() * 10000) },
      { label: `Under ${line}`, type: "LAY", value: parseFloat((1.8 + Math.random() * 0.6).toFixed(2)), liquidity: Math.floor(2000 + Math.random() * 8000) },
    ];
  }
  if (marketName.includes("Top Batsman")) {
    const isTeam1 = marketName.includes("Team 1");
    const names = isTeam1
      ? ["Rohit Sharma", "Ishan Kishan", "Suryakumar Yadav", "Tim David"]
      : ["Virat Kohli", "Faf du Plessis", "Glenn Maxwell", "Dinesh Karthik"];
    return names.flatMap(n => [
      { label: n, type: "BACK", value: parseFloat((2 + Math.random() * 4).toFixed(2)), liquidity: Math.floor(2000 + Math.random() * 5000) },
      { label: n, type: "LAY", value: parseFloat((2.2 + Math.random() * 4).toFixed(2)), liquidity: Math.floor(1000 + Math.random() * 3000) },
    ]);
  }
  if (marketName.includes("Top Bowler")) {
    const isTeam1 = marketName.includes("Team 1");
    const names = isTeam1
      ? ["Jasprit Bumrah", "Piyush Chawla", "Akash Madhwal"]
      : ["Mohammed Siraj", "Karn Sharma", "Yash Dayal"];
    return names.flatMap(n => [
      { label: n, type: "BACK", value: parseFloat((2.5 + Math.random() * 4).toFixed(2)), liquidity: Math.floor(2000 + Math.random() * 5000) },
      { label: n, type: "LAY", value: parseFloat((2.8 + Math.random() * 4).toFixed(2)), liquidity: Math.floor(1000 + Math.random() * 3000) },
    ]);
  }
  if (marketName === "Both Teams to Score") {
    return [
      { label: "Yes", type: "BACK", value: 1.65, liquidity: 8000 },
      { label: "Yes", type: "LAY", value: 1.72, liquidity: 5000 },
      { label: "No", type: "BACK", value: 2.15, liquidity: 6000 },
      { label: "No", type: "LAY", value: 2.25, liquidity: 4000 },
    ];
  }
  if (marketName === "Correct Score") {
    const outcomes = matchSport === "Football"
      ? ["1-0", "2-0", "2-1", "0-0", "1-1", "3-0"]
      : ["3-0", "3-1", "3-2", "2-0", "2-1", "2-3"];
    return outcomes.flatMap(o => [
      { label: o, type: "BACK", value: parseFloat((5 + Math.random() * 10).toFixed(2)), liquidity: Math.floor(1000 + Math.random() * 3000) },
      { label: o, type: "LAY", value: parseFloat((5.5 + Math.random() * 10).toFixed(2)), liquidity: Math.floor(500 + Math.random() * 1500) },
    ]);
  }
  if (marketName === "Handicap") {
    return [
      { label: `${homeTeam} -2.5`, type: "BACK", value: 1.85, liquidity: 5000 },
      { label: `${homeTeam} -2.5`, type: "LAY", value: 1.92, liquidity: 3000 },
      { label: `${awayTeam} +2.5`, type: "BACK", value: 1.95, liquidity: 5000 },
      { label: `${awayTeam} +2.5`, type: "LAY", value: 2.02, liquidity: 3000 },
    ];
  }
  // Default generic odds
  return [
    { label: "Yes", type: "BACK", value: 1.85, liquidity: 5000 },
    { label: "Yes", type: "LAY", value: 1.92, liquidity: 3000 },
    { label: "No", type: "BACK", value: 1.95, liquidity: 5000 },
    { label: "No", type: "LAY", value: 2.02, liquidity: 3000 },
  ];
}

async function main() {
  console.log("Seeding database...");
  const startTime = Date.now();

  // Clean
  await prisma.casinoSession.deleteMany();
  await prisma.casinoGame.deleteMany();
  await prisma.casinoCategory.deleteMany();
  await prisma.casinoProvider.deleteMany();
  await prisma.casinoPromotion.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.betLeg.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.odds.deleteMany();
  await prisma.market.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.league.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ========================================
  // USERS
  // ========================================
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@ipl.com",
      username: "admin",
      passwordHash: adminPassword,
      displayName: "Admin",
      role: "SUPER_ADMIN",
      referralCode: "ADMIN001",
    },
  });

  await prisma.wallet.create({
    data: { userId: admin.id, balance: 100000, bonus: 5000, locked: 0 },
  });

  await prisma.userHierarchy.create({
    data: {
      userId: admin.id,
      level: 'LEVEL_1_ADMIN',
      commissionRate: 0,
    },
  });

  const userPassword = await bcrypt.hash("password123", 12);
  const demoUser = await prisma.user.create({
    data: {
      email: "user@demo.com",
      username: "demo",
      passwordHash: userPassword,
      displayName: "Demo User",
      role: "USER",
      referralCode: "DEMO001",
      referredById: admin.id,
    },
  });

  await prisma.wallet.create({
    data: { userId: demoUser.id, balance: 10000, bonus: 200, locked: 0 },
  });

  // Create 10 additional users for leaderboard data
  const extraUsers: Array<{ id: string; wallet: any }> = [];
  for (let i = 1; i <= 10; i++) {
    const pwd = await bcrypt.hash("userpass123", 12);
    const u = await prisma.user.create({
      data: {
        email: `user${i}@demo.com`,
        username: `user${i}`,
        passwordHash: pwd,
        displayName: `Player ${i}`,
        role: "USER",
        referralCode: `USER00${i}`,
      },
    });
    const w = await prisma.wallet.create({
      data: { userId: u.id, balance: 5000 + Math.floor(Math.random() * 20000), bonus: 100, locked: 0 },
    });
    extraUsers.push({ id: u.id, wallet: w });
  }

  // ========================================
  // SPORTS, LEAGUES, TEAMS
  // ========================================
  const sports: any[] = [];
  for (const s of SPORTS) {
    sports.push(await prisma.sport.create({ data: s }));
  }

  const leagues: any[] = [];
  const leagueMap: Record<number, any> = {};
  for (let i = 0; i < LEAGUES.length; i++) {
    const l = LEAGUES[i];
    const league = await prisma.league.create({
      data: { name: l.name, sportId: sports[l.sportIdx].id, country: l.country },
    });
    leagues.push(league);
    leagueMap[i] = league;
  }

  const teams: any[] = [];
  const teamMap: Record<number, any> = {};
  for (let i = 0; i < TEAMS.length; i++) {
    const t = TEAMS[i];
    const team = await prisma.team.create({
      data: {
        name: t.name,
        shortName: t.short,
        sportId: leagues[t.leagueIdx] ? leagues[t.leagueIdx].sportId : sports[0].id,
      },
    });
    teams.push(team);
    teamMap[i] = team;
  }

  // ========================================
  // MATCHES + MARKETS + ODDS
  // ========================================
  const allMatches: any[] = [];

  for (let mi = 0; mi < matchSchedules.length; mi++) {
    const ms = matchSchedules[mi];
    const league = leagueMap[ms.leagueIdx];
    if (!league) continue;
    const homeId = teamMap[ms.home]?.id;
    const awayId = teamMap[ms.away]?.id;
    if (!homeId || !awayId) continue;

    // Use the correct sport index
    let sportIdx = 0;
    for (let si = 0; si < sports.length; si++) {
      if (sports[si].id === league.sportId) { sportIdx = si; break; }
    }

    const matchData: any = {
      leagueId: league.id,
      homeTeamId: homeId,
      awayTeamId: awayId,
      startTime: hoursFromNow(ms.startOffsetHrs),
      status: ms.status,
    };

    if (ms.hScore !== undefined) matchData.homeScore = ms.hScore;
    if (ms.aScore !== undefined) matchData.awayScore = ms.aScore;
    if (ms.hWickets !== undefined) matchData.homeWickets = ms.hWickets;
    if (ms.aWickets !== undefined) matchData.awayWickets = ms.aWickets;
    if (ms.hOvers !== undefined) matchData.homeOvers = ms.hOvers;
    if (ms.aOvers !== undefined) matchData.awayOvers = ms.aOvers;

    if (ms.status === "LIVE" && SPORTS[sportIdx].slug === "cricket") {
      const batsmenIdx = mi < batsmen_data.length ? mi : 0;
      matchData.batsmen = batsmen_data[batsmenIdx] || batsmen_data[0];
      matchData.bowler = bowler_data[mi % bowler_data.length];
      matchData.partnership = partnership_data[mi % partnership_data.length];
      matchData.innings = 1;
      matchData.battingTeam = teamMap[ms.home]?.name || "Home";
      matchData.bowlingTeam = teamMap[ms.away]?.name || "Away";
      const totalRuns = ms.hScore || 0;
      const overs = ms.hOvers || 1;
      const rr = overs > 0 ? (totalRuns / overs).toFixed(2) : "0.00";
      matchData.currentRr = parseFloat(rr);
      matchData.requiredRr = 0;
    }

    if (ms.status === "LIVE" && SPORTS[sportIdx].slug === "football") {
      matchData.innings = 2;
      matchData.currentRr = 0;
      matchData.requiredRr = 0;
    }

    const match = await prisma.match.create({ data: matchData });
    allMatches.push(match);

    // Create markets
    const markets = getMarketsForMatch(match.id, SPORTS[sportIdx].name);
    for (let mki = 0; mki < markets.length; mki++) {
      const mk = markets[mki];
      const market = await prisma.market.create({
        data: {
          matchId: match.id,
          name: mk.name,
          type: mk.type as any,
          status: ms.status === "FINISHED" ? "SETTLED" : ms.status === "LIVE" ? "OPEN" : "OPEN",
        },
      });

      // Create odds (BACK + LAY for each selection)
      const oddsSelections = getOddsForSelection(
        mki, mk.name, SPORTS[sportIdx].name,
        teamMap[ms.home]?.name || "Home",
        teamMap[ms.away]?.name || "Away"
      );

      for (const o of oddsSelections) {
        await prisma.odds.create({
          data: {
            marketId: market.id,
            label: o.label,
            type: o.type,
            value: o.value,
            liquidity: o.liquidity,
            active: ms.status !== "FINISHED",
          },
        });
      }
    }
  }

  // ========================================
  // BETS & BET HISTORY (for leaderboard)
  // ========================================
  const settledMatchIds = allMatches.filter(m => m.status === "FINISHED").map(m => m.id);
  const liveMatchIds = allMatches.filter(m => m.status === "LIVE").map(m => m.id);

  // Create historical settled bets
  for (const userId of extraUsers.map(u => u.id)) {
    for (let bi = 0; bi < settledMatchIds.length; bi++) {
      const matchId = settledMatchIds[bi];
      const match = allMatches.find(m => m.id === matchId);
      if (!match) continue;
      const marketsForMatch = await prisma.market.findMany({
        where: { matchId },
        include: { odds: true },
      });
      if (marketsForMatch.length === 0) continue;

      const market = marketsForMatch[0];
      const oddsOptions = market.odds.filter(o => o.type === "BACK");
      if (oddsOptions.length === 0) continue;
      const selectedOdds = oddsOptions[Math.floor(Math.random() * oddsOptions.length)];

      const stake = 100 + Math.floor(Math.random() * 900);
      const oddsVal = Number(selectedOdds.value);
      const potentialWin = Math.round(stake * oddsVal * 100) / 100;
      const isWon = Math.random() > 0.45;

      const bet = await prisma.bet.create({
        data: {
          userId,
          type: "SINGLE",
          stake,
          totalOdds: oddsVal,
          potentialWin,
          status: isWon ? "WON" : "LOST",
          settledAt: new Date(Date.now() - Math.floor(Math.random() * 96 * 60 * 60 * 1000)),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 120 * 60 * 60 * 1000)),
          legs: {
            create: [{
              marketId: market.id,
              oddsId: selectedOdds.id,
              oddsValue: oddsVal,
              status: isWon ? "WON" : "LOST",
              settledAt: new Date(),
            }],
          },
        },
      });

      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (wallet) {
        if (isWon) {
          const profit = potentialWin - stake;
          await prisma.wallet.update({
            where: { id: wallet.id, version: wallet.version },
            data: {
              balance: { increment: profit },
              locked: { decrement: stake },
              version: { increment: 1 },
            },
          });
          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              userId,
              type: "BET_WON",
              amount: potentialWin,
              balanceBefore: wallet.balance,
              balanceAfter: Number(wallet.balance) + profit,
              status: "COMPLETED",
              description: `Bet won: ${bet.id}`,
            },
          });
        } else {
          await prisma.wallet.update({
            where: { id: wallet.id, version: wallet.version },
            data: {
              balance: { decrement: stake },
              locked: { decrement: stake },
              version: { increment: 1 },
            },
          });
          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              userId,
              type: "BET_LOST",
              amount: stake,
              balanceBefore: wallet.balance,
              balanceAfter: Number(wallet.balance) - stake,
              status: "COMPLETED",
              description: `Bet lost: ${bet.id}`,
            },
          });
        }
      }
    }
  }

  // Create active PENDING bets for demo user
  for (const matchId of liveMatchIds) {
    const marketsForMatch = await prisma.market.findMany({
      where: { matchId, status: "OPEN" },
      include: { odds: true },
    });
    if (marketsForMatch.length === 0) continue;

    const market = marketsForMatch[0];
    const oddsOptions = market.odds.filter(o => o.type === "BACK");
    if (oddsOptions.length === 0) continue;
    const selectedOdds = oddsOptions[Math.floor(Math.random() * oddsOptions.length)];

    const stake = 200 + Math.floor(Math.random() * 800);
    const oddsVal = Number(selectedOdds.value);
    const potentialWin = Math.round(stake * oddsVal * 100) / 100;

    await prisma.bet.create({
      data: {
        userId: demoUser.id,
        type: "SINGLE",
        stake,
        totalOdds: oddsVal,
        potentialWin,
        status: "PENDING",
        legs: {
          create: [{
            marketId: market.id,
            oddsId: selectedOdds.id,
            oddsValue: oddsVal,
            status: "PENDING",
          }],
        },
      },
    });

    // Lock the stake
    const wallet = await prisma.wallet.findUnique({ where: { userId: demoUser.id } });
    if (wallet) {
      await prisma.wallet.update({
        where: { id: wallet.id, version: wallet.version },
        data: {
          locked: { increment: stake },
          version: { increment: 1 },
        },
      });
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId: demoUser.id,
          type: "BET_PLACED",
          amount: stake,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          status: "COMPLETED",
          description: `Bet placed on live match: ${matchId}`,
        },
      });
    }
  }

  // ========================================
  // CASINO CATEGORIES
  // ========================================
  const casinoCategories = await Promise.all([
    prisma.casinoCategory.create({ data: { name: "Slots", slug: "slots", icon: "🎰", sortOrder: 1 } }),
    prisma.casinoCategory.create({ data: { name: "Live Casino", slug: "live-casino", icon: "📺", sortOrder: 2 } }),
    prisma.casinoCategory.create({ data: { name: "Blackjack", slug: "blackjack", icon: "🃏", sortOrder: 3 } }),
    prisma.casinoCategory.create({ data: { name: "Roulette", slug: "roulette", icon: "🎡", sortOrder: 4 } }),
    prisma.casinoCategory.create({ data: { name: "Poker", slug: "poker", icon: "♠️", sortOrder: 5 } }),
    prisma.casinoCategory.create({ data: { name: "Baccarat", slug: "baccarat", icon: "💎", sortOrder: 6 } }),
    prisma.casinoCategory.create({ data: { name: "Table Games", slug: "table-games", icon: "🎲", sortOrder: 7 } }),
    prisma.casinoCategory.create({ data: { name: "Crash Games", slug: "crash-games", icon: "🚀", sortOrder: 8 } }),
  ]);

  // Casino Providers
  const casinoProviders = await Promise.all([
    prisma.casinoProvider.create({ data: { name: "Pragmatic Play", slug: "pragmatic-play", active: true } }),
    prisma.casinoProvider.create({ data: { name: "Evolution Gaming", slug: "evolution", active: true } }),
    prisma.casinoProvider.create({ data: { name: "NetEnt", slug: "netent", active: true } }),
    prisma.casinoProvider.create({ data: { name: "Microgaming", slug: "microgaming", active: true } }),
    prisma.casinoProvider.create({ data: { name: "Playtech", slug: "playtech", active: true } }),
    prisma.casinoProvider.create({ data: { name: "BetSoft", slug: "betsoft", active: true } }),
    prisma.casinoProvider.create({ data: { name: "Yggdrasil", slug: "yggdrasil", active: true } }),
    prisma.casinoProvider.create({ data: { name: "Hacksaw Gaming", slug: "hacksaw-gaming", active: true } }),
  ]);

  // Casino Games
  const pg = (slug: string) => casinoProviders.find(p => p.slug === slug)!;
  const cat = (slug: string) => casinoCategories.find(c => c.slug === slug)!;

  const casinoGames = [
    // SLOTS
    { name: "Gates of Olympus", slug: "gates-of-olympus", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.50, minBet: 0.10, maxBet: 100, featured: true, popular: true, sortOrder: 1 },
    { name: "Sweet Bonanza", slug: "sweet-bonanza", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.48, minBet: 0.10, maxBet: 100, featured: true, popular: true, sortOrder: 2 },
    { name: "Wolf Gold", slug: "wolf-gold", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.01, minBet: 0.25, maxBet: 125, featured: true, popular: true, sortOrder: 3 },
    { name: "Sugar Rush", slug: "sugar-rush", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.45, minBet: 0.10, maxBet: 100, featured: true, sortOrder: 4 },
    { name: "The Dog House Megaways", slug: "dog-house-megaways", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.15, minBet: 0.20, maxBet: 100, popular: true, sortOrder: 5 },
    { name: "Big Bass Bonanza", slug: "big-bass-bonanza", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.71, minBet: 0.10, maxBet: 100, popular: true, sortOrder: 6 },
    { name: "Starburst", slug: "starburst", providerId: pg("netent").id, categoryId: cat("slots").id, rtp: 96.09, minBet: 0.10, maxBet: 100, featured: true, popular: true, sortOrder: 7 },
    { name: "Mega Moolah", slug: "mega-moolah", providerId: pg("microgaming").id, categoryId: cat("slots").id, rtp: 88.12, minBet: 0.25, maxBet: 25, featured: true, popular: true, sortOrder: 8 },
    { name: "Dead or Alive 2", slug: "dead-or-alive-2", providerId: pg("netent").id, categoryId: cat("slots").id, rtp: 96.82, minBet: 0.10, maxBet: 100, sortOrder: 9 },
    { name: "Book of Dead", slug: "book-of-dead", providerId: pg("playtech").id, categoryId: cat("slots").id, rtp: 96.21, minBet: 0.10, maxBet: 100, popular: true, sortOrder: 10 },
    { name: "Aztec Gems", slug: "aztec-gems", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.68, minBet: 0.10, maxBet: 100, sortOrder: 11 },
    { name: "Buffalo King", slug: "buffalo-king", providerId: pg("pragmatic-play").id, categoryId: cat("slots").id, rtp: 96.06, minBet: 0.25, maxBet: 125, sortOrder: 12 },
    // LIVE CASINO
    { name: "Live Roulette", slug: "live-roulette", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 97.30, minBet: 1, maxBet: 10000, featured: true, popular: true, sortOrder: 13 },
    { name: "Live Blackjack", slug: "live-blackjack", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 99.28, minBet: 5, maxBet: 10000, featured: true, popular: true, sortOrder: 14 },
    { name: "Live Baccarat", slug: "live-baccarat", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 98.94, minBet: 1, maxBet: 10000, featured: true, sortOrder: 15 },
    { name: "Crazy Time", slug: "crazy-time", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 96.08, minBet: 0.10, maxBet: 5000, featured: true, popular: true, sortOrder: 16 },
    { name: "Dream Catcher", slug: "dream-catcher", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 96.58, minBet: 0.10, maxBet: 5000, sortOrder: 17 },
    { name: "Monopoly Live", slug: "monopoly-live", providerId: pg("evolution").id, categoryId: cat("live-casino").id, rtp: 96.23, minBet: 0.10, maxBet: 5000, popular: true, sortOrder: 18 },
    // BLACKJACK
    { name: "Classic Blackjack", slug: "classic-blackjack", providerId: pg("netent").id, categoryId: cat("blackjack").id, rtp: 99.57, minBet: 1, maxBet: 5000, featured: true, popular: true, sortOrder: 19 },
    { name: "Infinite Blackjack", slug: "infinite-blackjack", providerId: pg("evolution").id, categoryId: cat("blackjack").id, rtp: 99.47, minBet: 1, maxBet: 10000, featured: true, sortOrder: 20 },
    { name: "VIP Blackjack", slug: "vip-blackjack", providerId: pg("evolution").id, categoryId: cat("blackjack").id, rtp: 99.49, minBet: 25, maxBet: 25000, sortOrder: 21 },
    { name: "Blackjack Party", slug: "blackjack-party", providerId: pg("evolution").id, categoryId: cat("blackjack").id, rtp: 99.37, minBet: 1, maxBet: 5000, popular: true, sortOrder: 22 },
    // ROULETTE
    { name: "European Roulette", slug: "european-roulette", providerId: pg("netent").id, categoryId: cat("roulette").id, rtp: 97.30, minBet: 0.10, maxBet: 5000, featured: true, popular: true, sortOrder: 23 },
    { name: "American Roulette", slug: "american-roulette", providerId: pg("microgaming").id, categoryId: cat("roulette").id, rtp: 94.74, minBet: 0.50, maxBet: 2500, sortOrder: 24 },
    { name: "French Roulette", slug: "french-roulette", providerId: pg("playtech").id, categoryId: cat("roulette").id, rtp: 98.65, minBet: 0.20, maxBet: 5000, featured: true, sortOrder: 25 },
    { name: "Lightning Roulette", slug: "lightning-roulette", providerId: pg("evolution").id, categoryId: cat("roulette").id, rtp: 97.10, minBet: 0.20, maxBet: 5000, popular: true, sortOrder: 26 },
    // POKER
    { name: "Texas Hold'em", slug: "texas-holdem", providerId: pg("evolution").id, categoryId: cat("poker").id, rtp: 99.0, minBet: 1, maxBet: 10000, featured: true, sortOrder: 27 },
    { name: "Casino Hold'em", slug: "casino-holdem", providerId: pg("playtech").id, categoryId: cat("poker").id, rtp: 99.18, minBet: 1, maxBet: 5000, sortOrder: 28 },
    { name: "Three Card Poker", slug: "three-card-poker", providerId: pg("microgaming").id, categoryId: cat("poker").id, rtp: 98.65, minBet: 1, maxBet: 5000, popular: true, sortOrder: 29 },
    // BACCARAT
    { name: "Speed Baccarat", slug: "speed-baccarat", providerId: pg("evolution").id, categoryId: cat("baccarat").id, rtp: 98.94, minBet: 1, maxBet: 10000, featured: true, popular: true, sortOrder: 30 },
    { name: "No Commission Baccarat", slug: "no-commission-baccarat", providerId: pg("playtech").id, categoryId: cat("baccarat").id, rtp: 98.82, minBet: 1, maxBet: 10000, sortOrder: 31 },
    // TABLE GAMES
    { name: "Sic Bo", slug: "sic-bo", providerId: pg("evolution").id, categoryId: cat("table-games").id, rtp: 97.22, minBet: 0.50, maxBet: 5000, sortOrder: 32 },
    { name: "Dragon Tiger", slug: "dragon-tiger", providerId: pg("evolution").id, categoryId: cat("table-games").id, rtp: 96.27, minBet: 0.50, maxBet: 5000, sortOrder: 33 },
    { name: "Craps", slug: "craps", providerId: pg("playtech").id, categoryId: cat("table-games").id, rtp: 98.64, minBet: 1, maxBet: 5000, sortOrder: 34 },
    { name: "Dice", slug: "dice", providerId: pg("pragmatic-play").id, categoryId: cat("table-games").id, rtp: 98.50, minBet: 0.10, maxBet: 10000, featured: true, popular: true, sortOrder: 35 },
    { name: "Mines", slug: "mines", providerId: pg("pragmatic-play").id, categoryId: cat("table-games").id, rtp: 97.00, minBet: 0.10, maxBet: 5000, featured: true, popular: true, sortOrder: 36 },
    { name: "Plinko", slug: "plinko", providerId: pg("pragmatic-play").id, categoryId: cat("table-games").id, rtp: 96.50, minBet: 0.10, maxBet: 5000, featured: true, popular: true, sortOrder: 37 },
    // CRASH GAMES
    { name: "Aviator", slug: "aviator", providerId: pg("betsoft").id, categoryId: cat("crash-games").id, rtp: 97.00, minBet: 0.10, maxBet: 10000, featured: true, popular: true, sortOrder: 38 },
    { name: "Space XY", slug: "space-xy", providerId: pg("betsoft").id, categoryId: cat("crash-games").id, rtp: 96.80, minBet: 0.10, maxBet: 10000, popular: true, sortOrder: 39 },
    { name: "JetX", slug: "jetx", providerId: pg("betsoft").id, categoryId: cat("crash-games").id, rtp: 97.10, minBet: 0.10, maxBet: 5000, sortOrder: 40 },
    { name: "Crash", slug: "crash", providerId: pg("betsoft").id, categoryId: cat("crash-games").id, rtp: 97.50, minBet: 0.10, maxBet: 10000, featured: true, popular: true, sortOrder: 41 },
  ];

  for (const game of casinoGames) {
    await prisma.casinoGame.create({ data: game });
  }

  // Casino Promotions
  await prisma.casinoPromotion.create({
    data: { title: "Welcome Casino Bonus", description: "100% up to $5,000 + 200 Free Spins on your first deposit", badge: "NEW", startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), sortOrder: 1 },
  });
  await prisma.casinoPromotion.create({
    data: { title: "Live Casino Cashback", description: "Get 15% cashback on all live casino losses every week", badge: "HOT", startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), sortOrder: 2 },
  });
  await prisma.casinoPromotion.create({
    data: { title: "Weekend Reload Bonus", description: "50% reload bonus every weekend up to $1,000", badge: "WEEKEND", startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), sortOrder: 3 },
  });
  await prisma.casinoPromotion.create({
    data: { title: "Slots Tournament", description: "Win a share of $50,000 in our weekly slots tournament", badge: "TOURNAMENT", startDate: new Date(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), sortOrder: 4 },
  });
  await prisma.casinoPromotion.create({
    data: { title: "VIP Rewards Program", description: "Exclusive benefits, personal account manager, higher limits", badge: "VIP", startDate: new Date(), sortOrder: 5 },
  });

  // Create demo user transactions
  const dWallet = await prisma.wallet.findUnique({ where: { userId: demoUser.id } });
  if (dWallet) {
    const txTypes = ["DEPOSIT", "DEPOSIT", "WITHDRAWAL", "DEPOSIT", "BET_WON", "BET_PLACED"];
    let bal = Number(dWallet.balance) + Number(dWallet.locked);
    for (let i = 0; i < 15; i++) {
      const tType = txTypes[i % txTypes.length];
      const amt = tType === "WITHDRAWAL" ? -(200 + Math.floor(Math.random() * 1000)) : (500 + Math.floor(Math.random() * 5000));
      const newBal = Math.max(0, bal + amt);
      await prisma.transaction.create({
        data: {
          walletId: dWallet.id,
          userId: demoUser.id,
          type: tType as any,
          amount: Math.abs(amt),
          balanceBefore: bal,
          balanceAfter: newBal,
          status: "COMPLETED",
          description: `${tType} - ${Math.abs(amt)}`,
          createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        },
      });
      bal = newBal;
    }
  }

  // Referral
  await prisma.referral.create({
    data: { referrerId: admin.id, referredId: demoUser.id, commissionEarned: 10 },
  });

  // Notifications
  await prisma.notification.create({
    data: { userId: demoUser.id, title: "Welcome!", message: "Welcome to IPL Betting Platform. Start betting now!", type: "SYSTEM" },
  });
  await prisma.notification.create({
    data: { userId: demoUser.id, title: "Deposit Bonus", message: "Get 100% bonus on your first deposit up to $1000!", type: "PROMOTION" },
  });
  await prisma.notification.create({
    data: { userId: demoUser.id, title: "Bet Settled", message: "Your bet on Mumbai Indians has been settled.", type: "BET_SETTLED" },
  });
  for (const u of extraUsers) {
    await prisma.notification.create({
      data: { userId: u.id, title: "Welcome!", message: "Welcome to IPL Betting Platform!", type: "SYSTEM" },
    });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s!`);
  console.log(`Created: ${allMatches.length} matches`);
  console.log("Admin login: admin@ipl.com / admin123");
  console.log("User login:  user@demo.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

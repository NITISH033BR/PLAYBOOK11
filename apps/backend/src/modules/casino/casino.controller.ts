import { Controller, Get, Post, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CasinoService } from "./casino.service";
import { CasinoPlayService } from "./casino-play.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CasinoPlayDto, CasinoHitDto, CasinoStandDto } from "./dto/casino-play.dto";

@ApiTags("Casino")
@Controller("casino")
export class CasinoController {
  constructor(
    private readonly casinoService: CasinoService,
    private readonly casinoPlayService: CasinoPlayService,
  ) {}

  @Get("categories")
  @ApiOperation({ summary: "Get all casino categories" })
  async getCategories() {
    return this.casinoService.getCategories();
  }

  @Get("games")
  @ApiOperation({ summary: "Get casino games" })
  async getGames(
    @Query("category") category?: string,
    @Query("featured") featured?: string,
    @Query("popular") popular?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
  ) {
    return this.casinoService.getGames({
      categorySlug: category,
      featured: featured === "true",
      popular: popular === "true",
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("games/:slug")
  @ApiOperation({ summary: "Get casino game by slug" })
  async getGameBySlug(@Param("slug") slug: string) {
    return this.casinoService.getGameBySlug(slug);
  }

  @Get("promotions")
  @ApiOperation({ summary: "Get active casino promotions" })
  async getPromotions() {
    return this.casinoService.getPromotions();
  }

  @Get("featured")
  @ApiOperation({ summary: "Get featured casino games" })
  async getFeatured(@Query("limit") limit?: string) {
    return this.casinoService.getFeatured(limit ? parseInt(limit, 10) : 8);
  }

  @UseGuards(JwtAuthGuard)
  @Post("play")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Play a casino game (spin/bet)" })
  async play(@CurrentUser("sub") userId: string, @Body() dto: CasinoPlayDto) {
    return this.casinoPlayService.play(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("blackjack/hit")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Hit in blackjack" })
  async blackjackHit(@CurrentUser("sub") userId: string, @Body() dto: CasinoHitDto) {
    return this.casinoPlayService.blackjackHit(userId, dto.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("blackjack/stand")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Stand in blackjack" })
  async blackjackStand(@CurrentUser("sub") userId: string, @Body() dto: CasinoStandDto) {
    return this.casinoPlayService.blackjackStand(userId, dto.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get casino session history" })
  async getSessions(
    @CurrentUser("sub") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.casinoPlayService.getSessions(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get casino session by ID" })
  async getSession(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.casinoPlayService.getSession(userId, id);
  }

  @Get("winners")
  @ApiOperation({ summary: "Get recent winners" })
  async getWinners(@Query("limit") limit?: string) {
    return this.casinoService.getRecentWinners(limit ? parseInt(limit, 10) : 10);
  }

  @Get("trending")
  @ApiOperation({ summary: "Get trending games" })
  async getTrending(@Query("limit") limit?: string) {
    return this.casinoService.getTrendingGames(limit ? parseInt(limit, 10) : 8);
  }

  @Get("new-releases")
  @ApiOperation({ summary: "Get new game releases" })
  async getNewReleases(@Query("limit") limit?: string) {
    return this.casinoService.getNewReleases(limit ? parseInt(limit, 10) : 8);
  }

  @UseGuards(JwtAuthGuard)
  @Get("recently-played")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's recently played games" })
  async getRecentlyPlayed(@CurrentUser("sub") userId: string, @Query("limit") limit?: string) {
    return this.casinoService.getRecentlyPlayed(userId, limit ? parseInt(limit, 10) : 8);
  }

  @Get("leaderboard")
  @ApiOperation({ summary: "Get leaderboard" })
  async getLeaderboard(@Query("limit") limit?: string, @Query("period") period?: string) {
    return this.casinoService.getLeaderboard(limit ? parseInt(limit, 10) : 10, period || "all");
  }

  @Get("stats")
  @ApiOperation({ summary: "Get casino stats" })
  async getStats() {
    return this.casinoService.getStats();
  }
}

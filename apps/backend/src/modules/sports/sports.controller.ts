import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SportsService } from "./sports.service";

@ApiTags("Sports")
@Controller("sports")
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get()
  @ApiOperation({ summary: "List all sports" })
  async findAll() {
    return this.sportsService.findAll();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get sport by slug" })
  async findBySlug(@Param("slug") slug: string) {
    return this.sportsService.findBySlug(slug);
  }

  @Get(":slug/leagues")
  @ApiOperation({ summary: "List leagues for a sport" })
  async getLeagues(@Param("slug") slug: string) {
    return this.sportsService.getLeagues(slug);
  }

  @Get(":slug/matches")
  @ApiOperation({ summary: "List matches for a sport" })
  async getMatches(@Param("slug") slug: string) {
    return this.sportsService.getMatches(slug);
  }
}

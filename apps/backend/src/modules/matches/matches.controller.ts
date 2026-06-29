import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MatchesService } from "./matches.service";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("Matches")
@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: "List all matches" })
  async findAll(@Query() pagination: PaginationDto) {
    return this.matchesService.findAll(pagination);
  }

  @Get("live")
  @ApiOperation({ summary: "List live matches" })
  async getLive() {
    return this.matchesService.getLive();
  }

  @Get("upcoming")
  @ApiOperation({ summary: "List upcoming matches" })
  async getUpcoming(@Query() pagination: PaginationDto) {
    return this.matchesService.getUpcoming(pagination);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get match details with markets" })
  async findById(@Param("id") id: string) {
    return this.matchesService.findById(id);
  }
}

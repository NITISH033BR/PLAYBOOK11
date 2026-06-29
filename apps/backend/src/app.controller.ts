import { Controller, Get } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "API root" })
  root() {
    return {
      name: "IPL Betting API",
      version: "1.0",
      docs: "/api/docs",
      health: "/api/v1/health",
    };
  }
}

import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check endpoint" })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch {
      return { status: "error", timestamp: new Date().toISOString() };
    }
  }
}

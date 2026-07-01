import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log: ["error", "warn"],
      errorFormat: "pretty",
    });
  }

  async onModuleInit() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log("Connected to database");
        return;
      } catch (error: any) {
        this.logger.error(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error(
            "All database connection attempts failed. The server may still start, but queries will fail.",
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Disconnected from database");
  }
}

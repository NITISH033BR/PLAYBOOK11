import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    const rawUrl = process.env.DATABASE_URL || "";
    let finalUrl = rawUrl;
    if (rawUrl && !rawUrl.includes("pgbouncer=true")) {
      const separator = rawUrl.includes("?") ? "&" : "?";
      finalUrl = `${rawUrl}${separator}pgbouncer=true`;
    }
    super({
      log: ["error", "warn"],
      errorFormat: "pretty",
      datasourceUrl: finalUrl,
    });
    this.logger.log("PrismaClient instantiated with config: log=[error,warn]");
    const maskedUrl = rawUrl ? rawUrl.replace(/\/\/[^:]+:[^@]+@/, "//****:****@") : "not set";
    this.logger.log(`DATABASE_URL: ${maskedUrl}`);
    this.logger.log(`DATABASE_URL has sslmode=require: ${rawUrl.includes("sslmode=require")}`);
    this.logger.log(`pgbouncer=true: ${finalUrl.includes("pgbouncer=true")} (${rawUrl.includes("pgbouncer=true") ? "from env" : "injected by PrismaService"})`);
    if (rawUrl && !rawUrl.includes("pgbouncer=true")) {
      this.logger.log("pgbouncer=true was NOT present in DATABASE_URL - injected by PrismaService to ensure Neon pooler compatibility");
    }
  }

  async onModuleInit() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.isConnected) {
          this.logger.log("Already connected to database, skipping reconnection");
          return;
        }
        await this.$connect();
        this.isConnected = true;
        this.logger.log("Connected to database");
        return;
      } catch (error: any) {
        this.logger.error(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );
        if (error.code) this.logger.error(`Prisma error code: ${error.code}`);
        if (error.meta) this.logger.error(`Prisma error meta: ${JSON.stringify(error.meta)}`);
        this.logger.error(`error.constructor.name: ${error.constructor?.name}`);
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
    this.logger.log("onModuleDestroy called - disconnecting from database");
    await this.$disconnect();
    this.isConnected = false;
    this.logger.log("Disconnected from database");
  }
}

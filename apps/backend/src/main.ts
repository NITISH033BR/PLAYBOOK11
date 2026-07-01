import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
  PrismaExceptionFilter,
} from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { PrismaService } from "./prisma/prisma.service";

async function validateEnvironment(logger: Logger) {
  const requiredEnvVars = [
    { name: "DATABASE_URL", desc: "PostgreSQL connection string" },
    { name: "JWT_SECRET", desc: "JWT signing secret" },
    { name: "JWT_REFRESH_SECRET", desc: "JWT refresh token secret" },
  ];

  let hasErrors = false;
  for (const env of requiredEnvVars) {
    if (!process.env[env.name]) {
      logger.error(`MISSING ENV: ${env.name} (${env.desc})`);
      hasErrors = true;
    } else {
      logger.log(`ENV OK: ${env.name}`);
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.includes("sslmode=require")) {
      logger.log("DATABASE_URL: sslmode=require is set (correct for Neon)");
    } else {
      logger.warn("DATABASE_URL: sslmode=require is MISSING (Neon requires SSL). Add ?sslmode=require");
    }
    if (dbUrl.includes("pgbouncer=true")) {
      logger.log("DATABASE_URL: pgbouncer=true is set (correct for Neon pooler)");
    } else {
      logger.warn("DATABASE_URL: pgbouncer=true is MISSING (recommended for Neon pooler). Add &pgbouncer=true");
    }
  }

  if (hasErrors) {
    logger.warn("Server will start but may fail at runtime due to missing environment variables");
  }
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  await validateEnvironment(logger);

  app.setGlobalPrefix("api/v1", { exclude: ["/"] });

  app.enableCors({
    origin: [
      "https://playbook11.online",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get("/api/v1/health", async (req, res) => {
    let dbStatus = "unknown";
    try {
      const prisma = app.get(PrismaService);
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
    res.status(200).json({
      status: "ok",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new AllExceptionsFilter(),
  );

  app.useGlobalInterceptors(
    new TimeoutInterceptor(),
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle("IPL Betting API")
    .setDescription("Sports betting platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || "0.0.0.0";
  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
  logger.log(`API docs at http://${host}:${port}/api/docs`);
  logger.log(
    `CORS origin: ${process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL || "https://playbook11.online" : "localhost:3000"}`,
  );
  logger.log(`Database: ${process.env.DATABASE_URL ? "configured" : "MISSING"}`);
}

bootstrap().catch((err) => {
  const logger = new Logger("Bootstrap");
  logger.error("Failed to start server", err.stack);
  process.exit(1);
});

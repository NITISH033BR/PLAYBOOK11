import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      success: false,
      statusCode: status,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      errors:
        typeof exceptionResponse === "object"
          ? (exceptionResponse as any).errors
          : undefined,
    };

    if (status >= 500) {
      this.logger.error(`[${status}] ${exception.message}`, exception.stack);
    }

    if (!response.headersSent) {
      response.status(status).json(errorBody);
    }
  }
}

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Database error";

    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = "A record with this value already exists";
        break;
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Record not found";
        break;
      case "P1000":
      case "P1001":
      case "P1012":
        message = "Database connection failed";
        break;
    }

    if (!response.headersSent) {
      response.status(status).json({
        success: false,
        statusCode: status,
        message,
      });
    }
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorName = (exception as any)?.name || "UnknownError";
    const errorMessage = (exception as any)?.message || "Internal server error";
    this.logger.error(`[Unhandled ${errorName}] ${errorMessage}`, (exception as any)?.stack);

    if (!response.headersSent) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
      });
    }
  }
}

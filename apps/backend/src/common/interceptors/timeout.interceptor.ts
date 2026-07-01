import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly timeoutMs = parseInt(process.env.REQUEST_TIMEOUT || "30000", 10);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.logger.error(`Request timed out after ${this.timeoutMs}ms`);
          return throwError(
            () =>
              new HttpException(
                "Request processing failed due to upstream timeout",
                HttpStatus.INTERNAL_SERVER_ERROR,
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}

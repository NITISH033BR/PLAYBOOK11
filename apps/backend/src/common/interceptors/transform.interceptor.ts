import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }
        if (
          data &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          "data" in data &&
          Array.isArray(data.data) &&
          "meta" in data &&
          data.meta &&
          typeof data.meta === "object"
        ) {
          return { success: true, ...data };
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = uuidv4();
    
    // Store requestId in request for logging
    request.requestId = requestId;

    return next.handle().pipe(
      map((data) => {
        // Handle different response types
        if (data && typeof data === 'object' && 'success' in data) {
          // Already formatted response
          return {
            ...data,
            requestId,
            timestamp: new Date().toISOString(),
          };
        }

        // Standard transformation
        return {
          success: true,
          data,
          message: this.getSuccessMessage(context),
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }

  private getSuccessMessage(context: ExecutionContext): string {
    const method = context.switchToHttp().getRequest().method;
    const handler = context.getHandler().name;

    // Default messages based on HTTP method
    switch (method) {
      case 'GET':
        return 'Data retrieved successfully';
      case 'POST':
        return 'Resource created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Operation completed successfully';
    }
  }
}
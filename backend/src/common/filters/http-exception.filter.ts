import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        code = (exceptionResponse as any).code || this.getErrorCode(status);
        details = (exceptionResponse as any).details || null;
      } else {
        message = exceptionResponse as string;
        code = this.getErrorCode(status);
      }
    } else {
      // Handle Prisma errors
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Record already exists';
        code = 'DUPLICATE_RECORD';
        details = {
          field: exception.meta?.target || 'unknown',
          constraint: 'unique_constraint_violation',
        };
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        code = 'RECORD_NOT_FOUND';
      } else if (exception.code?.startsWith('P')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database operation failed';
        code = 'DATABASE_ERROR';
        details = { prismaCode: exception.code };
      }
    }

    // Log the error
    const errorContext = {
      requestId,
      method: request.method,
      url: request.url,
      status,
      message,
      code,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      userId: (request as any).user?.id || null,
      stack: exception.stack,
    };

    if (status >= 500) {
      this.logger.error('Internal server error', errorContext);
    } else {
      this.logger.warn('Client error', errorContext);
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
      requestId,
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
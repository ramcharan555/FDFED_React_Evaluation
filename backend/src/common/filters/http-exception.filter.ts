import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileLogService } from '../logging/file-log.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /*
   * NestJS uses exception filters as its framework-native centralized
   * error-handling mechanism. This global filter captures both expected
   * HttpException errors and unexpected server errors, then writes details
   * to logs/error.log while returning a clean JSON response to the client.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';
    const message = this.getMessage(exceptionResponse);
    const stack = exception instanceof Error ? exception.stack : undefined;

    FileLogService.writeError(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          method: request.method,
          url: request.originalUrl,
          statusCode: status,
          message,
          stack,
        },
        null,
        2,
      ),
    );

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      statusCode: status,
      message,
    });
  }

  private getMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const responseBody = exceptionResponse as { message?: string | string[]; error?: string };
    return responseBody.message || responseBody.error || 'Request failed';
  }
}

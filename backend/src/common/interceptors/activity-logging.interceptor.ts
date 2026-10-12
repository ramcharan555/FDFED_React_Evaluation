import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { ActivityLogService } from '../../modules/activity-log/activity-log.service';

/**
 * Activity logging interceptor
 * Logs all CREATE, UPDATE, DELETE operations
 */
@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(private activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;
    const role = (request as any).userRole;

    // Only log non-GET requests
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        this.activityLogService.logActivity({
          action: method,
          resource: path,
          role: role || 'unknown',
          timestamp: new Date(),
          status: 'success',
          details: data,
        });
      }),
    );
  }
}

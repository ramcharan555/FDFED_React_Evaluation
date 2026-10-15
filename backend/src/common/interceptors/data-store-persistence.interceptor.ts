import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { tap } from 'rxjs/operators';
import { DataStore } from '../data-store';

@Injectable()
export class DataStorePersistenceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    // Finance mutations persist inside their rollback boundary.
    if (request.originalUrl?.startsWith('/api/finance/')) return next.handle();
    if (request.originalUrl?.startsWith('/api/workspace/')) return next.handle();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return next.handle();

    return next.handle().pipe(tap(() => DataStore.getInstance().persist()));
  }
}

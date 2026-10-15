import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { tap } from 'rxjs/operators';
import { DataStore } from '../data-store';

@Injectable()
export class DataStorePersistenceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return next.handle();

    return next.handle().pipe(tap(() => DataStore.getInstance().persist()));
  }
}

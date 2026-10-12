import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { FileLogService } from '../logging/file-log.service';

@Injectable()
export class EventsAuditMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const role = (req as any).user?.userRole || 'anonymous';

    FileLogService.writeAccess(
      `${new Date().toISOString()} EVENT_ROUTE role=${role} ${req.method} ${req.originalUrl}`,
    );

    next();
  }
}

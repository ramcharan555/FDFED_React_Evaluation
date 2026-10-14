import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ActivityLogService } from '../../modules/activity-log/activity-log.service';
/**
 * Activity logging interceptor
 * Logs all CREATE, UPDATE, DELETE operations
 */
export declare class ActivityLoggingInterceptor implements NestInterceptor {
    private activityLogService;
    constructor(activityLogService: ActivityLogService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=activity-logging.interceptor.d.ts.map
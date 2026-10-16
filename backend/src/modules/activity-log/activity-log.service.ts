import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataStore, ActivityLog } from '../../common/data-store';
import { UserRole } from '../../common/constants';

@Injectable()
export class ActivityLogService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  logActivity(logEntry: Omit<ActivityLog, 'id'>): ActivityLog {
    const log: ActivityLog = {
      id: this.dataStore.generateId('log'),
      ...logEntry,
    };

    this.dataStore.activityLogs.push(log);
    return log;
  }

  findAll(
    limit = 100,
    offset = 0,
  ): {
    logs: ActivityLog[];
    total: number;
  } {
    const allLogs = this.dataStore.activityLogs.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return {
      logs: allLogs.slice(offset, offset + limit),
      total: allLogs.length,
    };
  }

  findByRole(role: string): ActivityLog[] {
    return this.dataStore.activityLogs
      .filter((log) => log.role === role)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByAction(action: string): ActivityLog[] {
    return this.dataStore.activityLogs
      .filter((log) => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findForClient(userId: string, role: UserRole, limit = 5): ActivityLog[] {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can view client activity');
    }

    const client = this.dataStore.clients.find(
      (item) => item.userId === userId || item.clientId === userId,
    );
    const clientIdentifiers = new Set(
      [userId, client?.clientId].filter(Boolean).map(String),
    );

    return this.dataStore.activityLogs
      .filter((log) => this.belongsToClient(log, clientIdentifiers))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, Math.min(Math.max(limit, 1), 20));
  }

  private belongsToClient(log: ActivityLog, clientIdentifiers: Set<string>): boolean {
    if (log.actorUserId && clientIdentifiers.has(String(log.actorUserId))) {
      return true;
    }

    return this.containsClientIdentifier(log.details, clientIdentifiers);
  }

  private containsClientIdentifier(value: unknown, clientIdentifiers: Set<string>): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
      const normalizedKey = key.toLowerCase();
      if (
        ['clientid', 'userid', 'performedby'].includes(normalizedKey) &&
        typeof nestedValue !== 'object' &&
        clientIdentifiers.has(String(nestedValue))
      ) {
        return true;
      }

      return this.containsClientIdentifier(nestedValue, clientIdentifiers);
    });
  }

  getStatistics(): {
    totalActions: number;
    actionCounts: { [key: string]: number };
    roleCounts: { [key: string]: number };
  } {
    const logs = this.dataStore.activityLogs;

    const actionCounts: { [key: string]: number } = {};
    const roleCounts: { [key: string]: number } = {};

    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      roleCounts[log.role] = (roleCounts[log.role] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      roleCounts,
    };
  }

  clearLogs(): { message: string } {
    this.dataStore.activityLogs = [];
    return { message: 'All activity logs cleared' };
  }
}

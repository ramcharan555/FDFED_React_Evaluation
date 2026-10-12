import { Injectable } from '@nestjs/common';
import { DataStore, ActivityLog } from '../../common/data-store';

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

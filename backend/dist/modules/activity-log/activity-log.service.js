"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
let ActivityLogService = class ActivityLogService {
    constructor() {
        this.dataStore = data_store_1.DataStore.getInstance();
    }
    logActivity(logEntry) {
        const log = {
            id: this.dataStore.generateId('log'),
            ...logEntry,
        };
        this.dataStore.activityLogs.push(log);
        return log;
    }
    findAll(limit = 100, offset = 0) {
        const allLogs = this.dataStore.activityLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return {
            logs: allLogs.slice(offset, offset + limit),
            total: allLogs.length,
        };
    }
    findByRole(role) {
        return this.dataStore.activityLogs
            .filter((log) => log.role === role)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    findByAction(action) {
        return this.dataStore.activityLogs
            .filter((log) => log.action === action)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getStatistics() {
        const logs = this.dataStore.activityLogs;
        const actionCounts = {};
        const roleCounts = {};
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
    clearLogs() {
        this.dataStore.activityLogs = [];
        return { message: 'All activity logs cleared' };
    }
};
exports.ActivityLogService = ActivityLogService;
exports.ActivityLogService = ActivityLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ActivityLogService);
//# sourceMappingURL=activity-log.service.js.map
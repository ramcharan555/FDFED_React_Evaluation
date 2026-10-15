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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const role_guard_1 = require("../../common/guards/role.guard");
const finance_service_1 = require("./finance.service");
const finance_exports_1 = require("./finance.exports");
const data_store_1 = require("../../common/data-store");
let FinanceController = class FinanceController {
    constructor(service) {
        this.service = service;
    }
    auth(req) { this.service.actor(req.user.userId); return req.user.userId; }
    // Synchronous mutations are serialized within the existing single-process store.
    // Restore all touched collections if writing the atomic snapshot fails.
    mutate(req, operation) {
        const id = this.auth(req), db = data_store_1.DataStore.getInstance();
        const saved = { users: structuredClone(db.users), refunds: structuredClone(db.refunds), financeSettlements: structuredClone(db.financeSettlements), commissionPolicies: structuredClone(db.commissionPolicies), financeAudit: structuredClone(db.financeAudit), financeGrants: structuredClone(db.financeGrants), financeReportSubmissions: structuredClone(db.financeReportSubmissions), notifications: structuredClone(db.notifications) };
        try {
            const result = operation(id);
            db.persist();
            return result;
        }
        catch (error) {
            Object.assign(db, saved);
            throw error;
        }
    }
    config(req) { return this.service.config(this.auth(req)); }
    account(req) { return this.service.account(this.auth(req)); }
    updateAccount(req, body) { return this.mutate(req, actor => this.service.updateAccount(actor, body)); }
    password(req, body) { return this.mutate(req, actor => this.service.password(actor, body)); }
    dashboard(req, q) { this.auth(req); return this.service.dashboard(q); }
    transactions(req, q) { this.auth(req); return this.service.transactions(q); }
    transaction(req, id) { this.auth(req); return this.service.detail('transactions', id); }
    refunds(req, q) { this.auth(req); return this.service.refunds(q); }
    refund(req, id) { this.auth(req); return this.service.detail('refunds', id); }
    review(req, id, body) { return this.mutate(req, actor => this.service.reviewRefund(id, actor, body)); }
    settlements(req, q) { this.auth(req); return this.service.settlements(q); }
    settlement(req, id) { this.auth(req); return this.service.detail('settlements', id); }
    calculate(req, body) { return this.mutate(req, actor => this.service.createSettlement(actor, body)); }
    settlementAction(req, id, body) { return this.mutate(req, actor => this.service.settlementAction(id, actor, body)); }
    revenue(req, q) { this.auth(req); this.service.filters(q); return this.service.revenue(q); }
    policies(req) { return this.service.config(this.auth(req)).policies; }
    policy(req, body) { return this.mutate(req, actor => this.service.addPolicy(actor, body)); }
    grant(req, body) { return this.mutate(req, actor => this.service.grant(actor, body)); }
    reconciliation(req, q) { this.auth(req); this.service.filters(q); return { available: false, reason: 'No trusted gateway API or reconciliation file integration is configured. Internal demo records cannot be independently reconciled.', records: [] }; }
    report(req, q) { this.auth(req); const { allRecords, ...report } = this.service.report(q); return report; }
    submitReport(req, body) { return this.mutate(req, actor => this.service.submitReport(actor, body)); }
    submittedReports(req, q) { return this.service.submittedReports(this.auth(req), q); }
    submittedReport(req, id) { return this.service.submittedReport(this.auth(req), id); }
    reviewSubmittedReport(req, id, body) { return this.mutate(req, actor => this.service.reviewSubmittedReport(actor, id, body)); }
    exportSubmittedReport(req, id, format, res) {
        const report = this.service.submittedReport(this.auth(req), id);
        if (!['csv', 'pdf'].includes(format))
            throw new common_1.BadRequestException('Use CSV or PDF');
        const snapshot = report.snapshot;
        if (format === 'pdf' && snapshot.records.length > 2000)
            throw new common_1.BadRequestException('This report exceeds the PDF limit; download CSV instead');
        const payload = format === 'csv' ? (0, finance_exports_1.csv)(snapshot.records) : (0, finance_exports_1.pdf)(report.title, [`Submitted by: ${report.submittedByName}`, `Submitted: ${new Date(report.submittedAt).toISOString()}`, `Generated: ${new Date(snapshot.generatedAt).toISOString()}`, `Filters: ${JSON.stringify(snapshot.filters)}`, `Totals: ${JSON.stringify(snapshot.totals)}`, `Notes: ${report.notes}`], snapshot.records);
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="eventflow-${report.id}.${format}"`);
        res.send(payload);
    }
    export(req, q, res) {
        this.auth(req);
        if (!['csv', 'pdf'].includes(q.format))
            throw new common_1.BadRequestException('Use CSV or PDF');
        const report = this.service.report(q);
        if (report.allRecords.length > (q.format === 'pdf' ? 2000 : 20000))
            throw new common_1.BadRequestException('Report is too large; narrow the date range');
        const payload = q.format === 'csv' ? (0, finance_exports_1.csv)(report.allRecords) : (0, finance_exports_1.pdf)(`${report.type} report`, [`Generated: ${report.generatedAt.toISOString()}`, `Filters: ${JSON.stringify(q)}`, `Filtered report totals: ${JSON.stringify(report.totals)}`, report.unavailable || ''], report.allRecords);
        res.setHeader('Content-Type', q.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="eventflow-${report.type}.${q.format}"`);
        res.send(payload);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "config", null);
__decorate([
    (0, common_1.Get)('account'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "account", null);
__decorate([
    (0, common_1.Post)('account'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Post)('account/password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "password", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "transactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "transaction", null);
__decorate([
    (0, common_1.Get)('refunds'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "refunds", null);
__decorate([
    (0, common_1.Get)('refunds/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "refund", null);
__decorate([
    (0, common_1.Post)('refunds/:id/review'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "review", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "settlements", null);
__decorate([
    (0, common_1.Get)('settlements/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "settlement", null);
__decorate([
    (0, common_1.Post)('settlements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)('settlements/:id/action'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "settlementAction", null);
__decorate([
    (0, common_1.Get)('revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "revenue", null);
__decorate([
    (0, common_1.Get)('commission-policies'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "policies", null);
__decorate([
    (0, common_1.Post)('commission-policies'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "policy", null);
__decorate([
    (0, common_1.Post)('permissions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "grant", null);
__decorate([
    (0, common_1.Get)('reconciliation'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reconciliation", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "report", null);
__decorate([
    (0, common_1.Post)('submitted-reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Get)('submitted-reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "submittedReports", null);
__decorate([
    (0, common_1.Get)('submitted-reports/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "submittedReport", null);
__decorate([
    (0, common_1.Post)('submitted-reports/:id/review'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reviewSubmittedReport", null);
__decorate([
    (0, common_1.Get)('submitted-reports/:id/export'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "exportSubmittedReport", null);
__decorate([
    (0, common_1.Get)('reports/export'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "export", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('api/finance'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map
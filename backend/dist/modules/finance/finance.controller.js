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
const swagger_1 = require("@nestjs/swagger");
const role_guard_1 = require("../../common/guards/role.guard");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
const common_2 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
let FinanceController = class FinanceController {
    constructor(service) {
        this.service = service;
    }
    dashboard(userId, role, query) { return this.service.dashboard(userId, role, query); }
    transactions(userId, role, query) { return this.service.transactions(userId, role, query); }
    exportTransactions(userId, role, query) { return this.service.exportTransactions(userId, role, query); }
    transaction(id, userId, role) { return this.service.transaction(userId, role, id); }
    refunds(userId, role, query) { return this.service.refunds(userId, role, query); }
    refund(id, userId, role) { return this.service.refund(userId, role, id); }
    reviewRefund(id, userId, role, body) { return this.service.reviewRefund(userId, role, id, body); }
    overview(userId, role, query) { return this.service.overview(userId, role, query); }
    reconciliation(userId, role) { return this.service.reconciliation(userId, role); }
    reports(userId, role, query) { return this.service.report(userId, role, query); }
    submissions(userId, role) { return this.service.submissions(userId, role); }
    submitReport(userId, role, body) { return this.service.submitReport(userId, role, body); }
    reviewReport(id, userId, role, body) { return this.service.reviewReport(id, userId, role, body); }
    reportCsv(userId, role, query) { return this.service.reportCsv(userId, role, query); }
    reportPdf(userId, role, query, response) {
        const pdf = this.service.reportPdf(userId, role, query);
        response.type('application/pdf').setHeader('Content-Disposition', 'attachment; filename="eventflow-finance-report.pdf"');
        response.send(pdf);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "transactions", null);
__decorate([
    (0, common_1.Get)('transactions.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="eventflow-payment-transactions.csv"'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "exportTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "transaction", null);
__decorate([
    (0, common_1.Get)('refunds'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "refunds", null);
__decorate([
    (0, common_1.Get)('refunds/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "refund", null);
__decorate([
    (0, common_1.Post)('refunds/:id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reviewRefund", null);
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('reconciliation'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reconciliation", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reports", null);
__decorate([
    (0, common_1.Get)('submissions'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "submissions", null);
__decorate([
    (0, common_1.Post)('submissions'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Patch)('submissions/:id/review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reviewReport", null);
__decorate([
    (0, common_1.Get)('reports.csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="eventflow-finance-report.csv"'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reportCsv", null);
__decorate([
    (0, common_1.Get)('reports.pdf'),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_2.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reportPdf", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('finance'),
    (0, common_1.Controller)('api/finance'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'Authorization', description: 'Bearer access token', required: true }),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map
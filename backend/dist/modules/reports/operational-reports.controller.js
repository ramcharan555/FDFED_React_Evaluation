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
exports.OperationalReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const role_guard_1 = require("../../common/guards/role.guard");
const constants_1 = require("../../common/constants");
const support_report_dto_1 = require("./dto/support-report.dto");
const support_reports_service_1 = require("./support-reports.service");
let OperationalReportsController = class OperationalReportsController {
    constructor(reports) {
        this.reports = reports;
    }
    list(userId, role) {
        return this.reports.list(userId, role, true);
    }
    create(dto, userId, role) {
        return this.reports.create(dto, undefined, userId, role, true);
    }
    submit(id, userId, role) {
        return this.reports.submit(id, userId, role, true);
    }
};
exports.OperationalReportsController = OperationalReportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OperationalReportsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_report_dto_1.CreateOperationalReportDto, String, String]),
    __metadata("design:returntype", void 0)
], OperationalReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OperationalReportsController.prototype, "submit", null);
exports.OperationalReportsController = OperationalReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('api/reports/operational'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [support_reports_service_1.SupportReportsService])
], OperationalReportsController);
//# sourceMappingURL=operational-reports.controller.js.map
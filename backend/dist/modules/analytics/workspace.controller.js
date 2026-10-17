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
exports.WorkspaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const role_guard_1 = require("../../common/guards/role.guard");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
const workspace_service_1 = require("./workspace.service");
const user_dto_1 = require("../users/dto/user.dto");
const event_dto_1 = require("../events/dtos/event.dto");
let WorkspaceController = class WorkspaceController {
    constructor(workspace) {
        this.workspace = workspace;
    }
    snapshot(role, userId) {
        return this.workspace.snapshot(role, userId);
    }
    updateCustomer(id, dto, role, userId) {
        return this.workspace.updateCustomer(id, dto, role, userId);
    }
    removeCustomer(id, role, userId) {
        return this.workspace.removeCustomer(id, role, userId);
    }
    updateEvent(id, dto, role, userId) {
        return this.workspace.updateEvent(id, dto, role, userId);
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Patch)('customers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto, String, String]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "updateCustomer", null);
__decorate([
    (0, common_1.Delete)('customers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "removeCustomer", null);
__decorate([
    (0, common_1.Patch)('events/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_dto_1.UpdateEventDto, String, String]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "updateEvent", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, swagger_1.ApiTags)('workspace'),
    (0, common_1.Controller)('api/workspace'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [workspace_service_1.WorkspaceService])
], WorkspaceController);
//# sourceMappingURL=workspace.controller.js.map
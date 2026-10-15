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
const role_guard_1 = require("../../common/guards/role.guard");
const workspace_service_1 = require("./workspace.service");
const data_store_1 = require("../../common/data-store");
const event_dto_1 = require("../events/dtos/event.dto");
let WorkspaceController = class WorkspaceController {
    constructor(service) {
        this.service = service;
    }
    mutate(operation) {
        const db = data_store_1.DataStore.getInstance();
        const snapshot = Object.fromEntries(Object.entries(db).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, structuredClone(value)]));
        try {
            const result = operation();
            db.persist();
            return result;
        }
        catch (error) {
            Object.assign(db, snapshot);
            throw error;
        }
    }
    snapshot(req) { return this.service.snapshot(req.user.userId); }
    account(req, body) { return this.mutate(() => this.service.account(req.user.userId, body)); }
    password(req, body) { return this.mutate(() => this.service.password(req.user.userId, body)); }
    registration(req, id, body) { return this.mutate(() => this.service.reviewRegistration(req.user.userId, id, body)); }
    event(req, id, body) { return this.mutate(() => this.service.eventAction(req.user.userId, id, body)); }
    editEvent(req, id, body) { return this.mutate(() => this.service.editEvent(req.user.userId, id, body)); }
    editUser(req, id, body) { return this.mutate(() => this.service.editUser(req.user.userId, id, body)); }
    user(req, id, body) { return this.mutate(() => this.service.userStatus(req.user.userId, id, body)); }
    task(req, body) { return this.mutate(() => this.service.task(req.user.userId, undefined, body)); }
    updateTask(req, id, body) { return this.mutate(() => this.service.task(req.user.userId, id, body)); }
    report(req, body) { return this.mutate(() => this.service.submitReport(req.user.userId, body)); }
    review(req, id, body) { return this.mutate(() => this.service.reviewReport(req.user.userId, id, body)); }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Patch)('account'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "account", null);
__decorate([
    (0, common_1.Post)('password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "password", null);
__decorate([
    (0, common_1.Patch)('registrations/:id/review'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "registration", null);
__decorate([
    (0, common_1.Patch)('events/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "event", null);
__decorate([
    (0, common_1.Put)('events/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "editEvent", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "editUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "user", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "task", null);
__decorate([
    (0, common_1.Patch)('tasks/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Post)('reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "report", null);
__decorate([
    (0, common_1.Post)('reports/:id/review'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "review", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, common_1.Controller)('api/workspace'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [workspace_service_1.WorkspaceService])
], WorkspaceController);
//# sourceMappingURL=workspace.controller.js.map
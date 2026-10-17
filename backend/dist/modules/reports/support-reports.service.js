"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportReportsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const constants_1 = require("../../common/constants");
const data_store_1 = require("../../common/data-store");
let SupportReportsService = class SupportReportsService {
    constructor() {
        this.db = data_store_1.DataStore.getInstance();
        this.uploadDirectory = path.join(process.cwd(), 'uploads', 'support-reports');
    }
    requireExecutive(userId, role, operational = false) {
        const user = this.db.findUserById(userId);
        const type = String(user?.employeeType || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        const allowed = operational ? ['SUPPORT_FINANCE', 'FINANCE_EXECUTIVE'] : ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS'];
        if (role !== constants_1.UserRole.EVENT_STAFF || !allowed.includes(type)) {
            throw new common_1.ForbiddenException('Only support executives can submit support reports');
        }
    }
    visibleReport(reportId, userId, role, operational = false) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            this.requireExecutive(userId, role, operational);
        const report = this.db.supportExecutiveReports.find(item => item.reportId === reportId &&
            (role === constants_1.UserRole.SUPER_ADMIN ? item.status !== 'draft' : item.submittedBy === userId));
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    present(report) {
        const { documentFileName, ...details } = report;
        return { ...details, author: this.db.findUserById(report.submittedBy)?.name || 'Support Executive',
            authorEmail: this.db.findUserById(report.submittedBy)?.email || '', hasDocument: !!documentFileName };
    }
    list(userId, role, operational = false) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            this.requireExecutive(userId, role, operational);
        return this.db.supportExecutiveReports
            .filter(report => role === constants_1.UserRole.SUPER_ADMIN ? report.status !== 'draft' : report.submittedBy === userId)
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map(report => this.present(report));
    }
    get(reportId, userId, role) {
        return this.present(this.visibleReport(reportId, userId, role));
    }
    create(dto, file, userId, role, operational = false) {
        this.requireExecutive(userId, role, operational);
        for (const field of ['title', 'scope', 'period', 'summary']) {
            if (!dto[field].trim())
                throw new common_1.BadRequestException(`${field} is required`);
        }
        if (dto.sourceReference) {
            const existing = this.db.supportExecutiveReports.find(report => report.submittedBy === userId && report.sourceReference === dto.sourceReference);
            if (existing)
                return dto.status === 'submitted' ? this.submit(existing.reportId, userId, role, operational) : this.present(existing);
        }
        const now = new Date();
        const report = {
            reportId: `SER-${(0, crypto_1.randomUUID)()}`, submittedBy: userId, sourceReference: dto.sourceReference,
            title: dto.title.trim(), category: dto.category, scope: dto.scope.trim(), period: dto.period.trim(),
            summary: dto.summary.trim(), status: dto.status || 'draft', createdAt: now, updatedAt: now,
            ...(dto.status === 'submitted' ? { submittedAt: now } : {}),
        };
        if (file) {
            const fileName = `${(0, crypto_1.randomUUID)()}${path.extname(file.originalname).toLowerCase()}`;
            (0, fs_1.mkdirSync)(this.uploadDirectory, { recursive: true });
            (0, fs_1.writeFileSync)(path.join(this.uploadDirectory, fileName), file.buffer);
            Object.assign(report, { documentName: path.basename(file.originalname), documentFileName: fileName,
                documentMimeType: file.mimetype, documentSize: file.size });
        }
        this.db.supportExecutiveReports.unshift(report);
        if (report.status === 'submitted')
            this.notifyAdmins(report);
        this.db.persist();
        return this.present(report);
    }
    submit(reportId, userId, role, operational = false) {
        this.requireExecutive(userId, role, operational);
        const report = this.visibleReport(reportId, userId, role, operational);
        if (report.status === 'draft') {
            report.status = 'submitted';
            report.submittedAt = new Date();
            report.updatedAt = report.submittedAt;
            this.notifyAdmins(report);
            this.db.persist();
        }
        return this.present(report);
    }
    review(reportId, dto, userId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only admins can review support reports');
        const report = this.visibleReport(reportId, userId, role);
        const feedback = dto.feedback?.trim() || 'Reviewed by admin';
        if (report.status !== 'reviewed' || report.reviewFeedback !== feedback) {
            report.status = 'reviewed';
            report.reviewFeedback = feedback;
            report.reviewedBy = userId;
            report.reviewedAt = new Date();
            report.updatedAt = report.reviewedAt;
            this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: report.submittedBy,
                supportReportId: report.reportId, message: `Your report "${report.title}" was reviewed: ${feedback}`,
                type: 'support_report_reviewed', read: false, dateTime: report.reviewedAt, createdAt: report.reviewedAt });
            this.db.persist();
        }
        return this.present(report);
    }
    download(reportId, userId, role) {
        const report = this.visibleReport(reportId, userId, role);
        if (!report.documentFileName)
            throw new common_1.NotFoundException('This report has no attached document');
        const filePath = path.join(this.uploadDirectory, path.basename(report.documentFileName));
        if (!(0, fs_1.existsSync)(filePath))
            throw new common_1.NotFoundException('The report document is unavailable');
        return { stream: (0, fs_1.createReadStream)(filePath), name: report.documentName || 'report.pdf', mimeType: report.documentMimeType || 'application/octet-stream' };
    }
    notifyAdmins(report) {
        this.db.users.filter(user => user.userRole === constants_1.UserRole.SUPER_ADMIN && user.status === 'active').forEach(admin => {
            this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: admin.userId,
                supportReportId: report.reportId, message: `Support report submitted: "${report.title}"`,
                type: 'support_report_submitted', read: false, dateTime: new Date(), createdAt: new Date() });
        });
    }
};
exports.SupportReportsService = SupportReportsService;
exports.SupportReportsService = SupportReportsService = __decorate([
    (0, common_1.Injectable)()
], SupportReportsService);
//# sourceMappingURL=support-reports.service.js.map
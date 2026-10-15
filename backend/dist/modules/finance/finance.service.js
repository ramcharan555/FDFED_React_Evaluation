"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
exports.minor = minor;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const password_1 = require("../../common/utils/password");
const crypto_1 = require("crypto");
function minor(value) {
    const result = Math.round(value * 100);
    if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(result) || Math.abs(value * 100 - result) > 0.00001)
        throw new common_1.ConflictException('Invalid stored monetary amount');
    return result;
}
const sum = (rows, key) => rows.reduce((n, r) => { const value = n + (r[key] ?? 0); if (!Number.isSafeInteger(value))
    throw new common_1.ConflictException('Financial total exceeds supported precision'); return value; }, 0);
let FinanceService = class FinanceService {
    constructor() {
        this.db = data_store_1.DataStore.getInstance();
    }
    actor(id, permission) {
        const user = this.db.users.find(u => u.userId === id && u.status === 'active');
        if (!user || !(user.userRole === constants_1.UserRole.SUPER_ADMIN || (user.userRole === constants_1.UserRole.EVENT_STAFF && [constants_1.EmployeeType.FINANCE_EXECUTIVE, constants_1.EmployeeType.SUPPORT_FINANCE].includes(user.employeeType))))
            throw new common_1.ForbiddenException('Finance access required');
        if (permission && user.userRole !== constants_1.UserRole.SUPER_ADMIN && !this.db.financeGrants.some(g => g.userId === id && g.permission === permission))
            throw new common_1.ForbiddenException(`Explicit ${permission} permission required`);
        return user;
    }
    admin(id) { const u = this.actor(id); if (u.userRole !== constants_1.UserRole.SUPER_ADMIN)
        throw new common_1.ForbiddenException('Administrator required'); return u; }
    account(id) { const u = this.actor(id); return { name: u.name, email: u.email, phoneNo: u.phoneNo || '', bio: u.bio || '', preferences: u.preferences || { emailNotifications: true, smsReminders: false, eventRecommendations: true } }; }
    updateAccount(id, body) {
        const u = this.actor(id);
        if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || typeof body.phoneNo !== 'string' || (body.phoneNo && !/^[6-9]\d{9}$/.test(body.phoneNo)) || typeof body.bio !== 'string' || body.bio.length > 2000)
            throw new common_1.BadRequestException('Enter a valid name, email, Indian mobile number, and bio');
        if (this.db.users.some(x => x.userId !== id && (x.email || '').toLowerCase() === body.email.trim().toLowerCase()))
            throw new common_1.ConflictException('Email already registered');
        const prefs = body.preferences;
        if (!prefs || ['emailNotifications', 'smsReminders', 'eventRecommendations'].some(k => typeof prefs[k] !== 'boolean'))
            throw new common_1.BadRequestException('Invalid preferences');
        const reauthenticate = u.email !== body.email.trim();
        Object.assign(u, { name: body.name.trim(), email: body.email.trim(), phoneNo: body.phoneNo, bio: body.bio, preferences: { emailNotifications: prefs.emailNotifications, smsReminders: prefs.smsReminders, eventRecommendations: prefs.eventRecommendations }, updatedAt: new Date() });
        this.audit(id, id, 'account.update', '', 'saved');
        return { ...this.account(id), reauthenticate };
    }
    password(id, body) {
        const u = this.actor(id);
        if (typeof body.currentPassword !== 'string' || body.currentPassword.length > 200 || !(0, password_1.verifyPassword)(body.currentPassword, u.password))
            throw new common_1.ForbiddenException('Current password is incorrect');
        if (typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 200 || body.newPassword.trim() !== body.newPassword)
            throw new common_1.BadRequestException('Use 8–200 characters without leading or trailing spaces');
        u.password = (0, password_1.hashPassword)(body.newPassword);
        u.updatedAt = new Date();
        this.audit(id, id, 'account.password', '', 'updated');
        return { success: true };
    }
    audit(actorId, entityId, action, previousStatus, newStatus, metadata = {}) {
        this.db.financeAudit.push({ id: this.db.generateId('fa'), actorId, entityId, action, previousStatus, newStatus, metadata, timestamp: new Date() });
    }
    filters(q) {
        const date = (v, end = false) => {
            if (!v)
                return undefined;
            if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(+new Date(v)) || new Date(v).toISOString().slice(0, 10) !== v)
                throw new common_1.BadRequestException('Dates must be valid YYYY-MM-DD');
            return new Date(`${v}T${end ? '23:59:59.999' : '00:00:00.000'}+05:30`).getTime();
        };
        const start = date(q.from), end = date(q.to, true);
        if (start !== undefined && end !== undefined && start > end)
            throw new common_1.BadRequestException('Start date must precede end date');
        const page = Number(q.page || 1), pageSize = Number(q.pageSize || 20);
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
            throw new common_1.BadRequestException('Invalid pagination');
        if (q.sort && !['date_desc', 'date_asc', 'amount_desc', 'amount_asc'].includes(q.sort))
            throw new common_1.BadRequestException('Invalid sort');
        if (q.interval && !['daily', 'weekly', 'monthly', 'yearly'].includes(q.interval))
            throw new common_1.BadRequestException('Invalid interval');
        if (q.eventId && !this.db.events.some(e => e.eventId === q.eventId))
            throw new common_1.BadRequestException('Event not found');
        if (q.organizerId && !this.db.organizers.some(o => o.organizerId === q.organizerId))
            throw new common_1.BadRequestException('Organizer not found');
        if (q.search && (typeof q.search !== 'string' || q.search.length > 200))
            throw new common_1.BadRequestException('Invalid search');
        return { start, end, page, pageSize };
    }
    context(registrationId) {
        const r = this.db.registrations.find(r => r.registrationId === registrationId);
        const e = this.db.events.find(e => e.eventId === r?.eventId);
        const a = this.db.attendees.find(a => a.attendeeId === r?.attendeeId);
        const u = this.db.users.find(u => u.userId === a?.userId);
        const o = this.db.organizers.find(o => o.organizerId === e?.organizerId);
        return { bookingId: registrationId, eventId: e?.eventId, eventName: e?.name || 'Unavailable event', organizerId: o?.organizerId, organizerName: this.db.users.find(u => u.userId === o?.userId)?.name || o?.businessName, attendeeName: u?.name || 'Unavailable attendee', bookingStatus: r?.status, cancellationReason: r?.cancellationReason, cancellationDeadline: e?.cancellationDeadline, eventStatus: e?.status };
    }
    paymentRows() {
        return this.db.payments.map(p => ({ id: p.paymentId, ...this.context(p.registrationId), amount: minor(p.amount), currency: 'INR', method: p.paymentMethod, gateway: p.paymentMethod === 'DEMO_PROVIDER' ? 'Demo provider (simulated)' : 'Legacy / unverified', status: p.status, date: p.paymentDate || p.createdAt, createdAt: p.createdAt, gatewayPaymentId: null, reconciliationStatus: 'unavailable' }));
    }
    refundRows() {
        return this.db.refunds.map(r => ({ id: r.refundId, paymentId: r.paymentId, ...this.context(r.registrationId), amount: minor(r.amount), originalAmount: minor(this.db.payments.find(p => p.paymentId === r.paymentId)?.amount || 0), currency: 'INR', status: r.status, reason: r.reason, date: r.requestedAt, processedAt: r.processedAt }));
    }
    select(rows, q, statuses) {
        const { start, end } = this.filters(q);
        if (q.status && statuses && !statuses.includes(q.status))
            throw new common_1.BadRequestException('Invalid status');
        return rows.filter(r => {
            const t = new Date(r.date).getTime();
            return (start === undefined || t >= start) && (end === undefined || t <= end) && (!q.eventId || r.eventId === q.eventId) && (!q.organizerId || r.organizerId === q.organizerId) && (!q.status || r.status === q.status) && (!q.method || r.method === q.method) && (!q.search || [r.id, r.bookingId, r.attendeeName, r.eventName, r.organizerName].some(v => String(v || '').toLowerCase().includes(q.search.toLowerCase())));
        }).sort((a, b) => q.sort?.startsWith('amount') ? (a.amount - b.amount) * (q.sort.endsWith('asc') ? 1 : -1) : (new Date(a.date).getTime() - new Date(b.date).getTime()) * (q.sort === 'date_asc' ? 1 : -1));
    }
    page(rows, q) { const { page, pageSize } = this.filters(q); return { records: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length, totalPages: Math.ceil(rows.length / pageSize) }; }
    transactions(q) { return this.page(this.select(this.paymentRows(), q, ['pending', 'completed', 'failed', 'refunded']), q); }
    refunds(q) { return this.page(this.select(this.refundRows(), q, ['pending', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed', 'not_applicable']), q); }
    settlements(q) { return this.page(this.select(this.db.financeSettlements, q, ['pending_review', 'approved', 'completed', 'on_hold']), q); }
    detail(kind, id) {
        const rows = kind === 'transactions' ? this.paymentRows() : kind === 'refunds' ? this.refundRows() : this.db.financeSettlements;
        const row = rows.find(r => r.id === id);
        if (!row)
            throw new common_1.NotFoundException('Financial record not found');
        return { ...row, refunds: this.refundRows().filter(r => r.paymentId === (kind === 'transactions' ? id : row.paymentId)), audit: this.db.financeAudit.filter(a => a.entityId === id) };
    }
    policy(eventId, when) {
        return this.db.commissionPolicies.filter(p => (!p.eventId || p.eventId === eventId) && p.effectiveDate <= new Date(when).toISOString().slice(0, 10)).sort((a, b) => Number(!!b.eventId) - Number(!!a.eventId) || b.effectiveDate.localeCompare(a.effectiveDate))[0];
    }
    captured() {
        const seen = new Set();
        return this.paymentRows().filter(p => ['completed', 'refunded'].includes(p.status)).sort((a, b) => +new Date(a.date) - +new Date(b.date)).filter(p => { if (seen.has(p.bookingId))
            return false; seen.add(p.bookingId); return true; });
    }
    revenue(q) {
        const payments = this.select(this.captured(), { ...q, status: undefined });
        return this.db.events.filter(e => (!q.eventId || e.eventId === q.eventId) && (!q.organizerId || e.organizerId === q.organizerId)).map(e => {
            const rows = payments.filter(p => p.eventId === e.eventId);
            const gross = sum(rows, 'amount');
            const refunded = this.refundRows().filter(r => r.status === 'completed' && rows.some(p => p.id === r.paymentId));
            const refunds = sum(refunded, 'amount');
            const allocated = rows.map(p => {
                const frozen = this.db.financeSettlements.flatMap(s => s.lines).find(l => l.paymentId === p.id);
                const policy = this.policy(e.eventId, p.date);
                const refund = sum(refunded.filter(r => r.paymentId === p.id), 'amount');
                return frozen ? frozen.commission : policy ? Number((BigInt(Math.max(0, p.amount - refund)) * BigInt(policy.basisPoints) + 5000n) / 10000n) : null;
            });
            const commission = allocated.some(a => a === null) ? null : allocated.reduce((n, a) => n + a, 0);
            return { id: e.eventId, eventId: e.eventId, eventName: e.name, organizerId: e.organizerId, organizerName: this.context(this.db.registrations.find(r => r.eventId === e.eventId)?.registrationId || '').organizerName || this.db.organizers.find(o => o.organizerId === e.organizerId)?.businessName, tickets: rows.length, gross, refunds, net: gross - refunds, commission, payable: commission === null ? null : gross - refunds - commission, currency: 'INR' };
        });
    }
    bucket(value, interval) {
        const d = new Date(new Date(value).getTime() + 330 * 60000);
        if (interval === 'yearly')
            return String(d.getUTCFullYear());
        if (interval === 'monthly')
            return d.toISOString().slice(0, 7);
        if (interval === 'weekly')
            d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
        return d.toISOString().slice(0, 10);
    }
    dashboard(q) {
        const tx = this.select(this.paymentRows(), { ...q, status: undefined });
        const captured = this.select(this.captured(), { ...q, status: undefined });
        const refunds = this.select(this.refundRows(), { ...q, status: undefined });
        const events = this.revenue(q);
        const settlements = this.select(this.db.financeSettlements, { ...q, status: undefined });
        const commission = events.some(e => e.commission === null) ? null : sum(events, 'commission');
        const trends = new Map();
        const get = (date) => { const label = this.bucket(date, q.interval || 'daily'); if (!trends.has(label))
            trends.set(label, { label, revenue: 0, commission: 0, requested: 0, completed: 0 }); return trends.get(label); };
        for (const p of captured) {
            const bucket = get(p.date);
            bucket.revenue += p.amount;
            const policy = this.policy(p.eventId, p.date);
            const frozen = this.db.financeSettlements.flatMap(s => s.lines).find(l => l.paymentId === p.id);
            const refunded = sum(this.refundRows().filter(r => r.paymentId === p.id && r.status === 'completed'), 'amount');
            if (!frozen && !policy)
                bucket.commission = null;
            else if (bucket.commission !== null)
                bucket.commission += frozen?.commission ?? Number((BigInt(Math.max(0, p.amount - refunded)) * BigInt(policy.basisPoints) + 5000n) / 10000n);
        }
        for (const r of refunds)
            get(r.date).requested += r.amount;
        const completed = this.select(this.refundRows().filter(r => r.status === 'completed').map(r => ({ ...r, date: r.processedAt || r.date })), { ...q, status: undefined });
        for (const r of completed)
            get(r.date).completed += r.amount;
        const gross = sum(captured, 'amount'), refunded = sum(completed, 'amount');
        return { generatedAt: new Date(), currency: 'INR', summary: { gross, refunded, net: gross - refunded, successful: tx.filter(p => p.status === 'completed').length, failed: tx.filter(p => p.status === 'failed').length, pending: tx.filter(p => p.status === 'pending').length, commission, pendingRefunds: refunds.filter(r => ['pending', 'under_review', 'approved', 'processing'].includes(r.status)).length, pendingSettlements: settlements.filter(s => s.status !== 'completed').length, completedSettlements: sum(settlements.filter(s => s.status === 'completed'), 'amount'), tickets: captured.length, organizerPayables: commission === null ? null : sum(events, 'payable'), outstanding: commission === null ? null : sum(events, 'payable') - sum(settlements.filter(s => s.status === 'completed'), 'amount') }, trends: [...trends.values()].sort((a, b) => a.label.localeCompare(b.label)), paymentStatus: ['completed', 'pending', 'failed', 'refunded'].map(label => ({ label, value: tx.filter(p => p.status === label).length })), events, activity: [...tx.map(p => ({ ...p, kind: 'transactions' })), ...refunds.map(r => ({ ...r, kind: 'refunds' })), ...settlements.map(s => ({ ...s, kind: 'settlements' }))].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 12) };
    }
    config(id) {
        const user = this.actor(id);
        return { currency: 'INR', timezone: 'Asia/Kolkata', provider: 'Demo provider only; all existing payments are unverified or simulated.', reconciliationAvailable: false, payoutAvailable: false, policies: this.db.commissionPolicies, canApproveRefund: user.userRole === constants_1.UserRole.SUPER_ADMIN || this.db.financeGrants.some(g => g.userId === id && g.permission === 'refund.approve'), canApproveSettlement: user.userRole === constants_1.UserRole.SUPER_ADMIN || this.db.financeGrants.some(g => g.userId === id && g.permission === 'settlement.approve'), isAdmin: user.userRole === constants_1.UserRole.SUPER_ADMIN, events: this.db.events.map(e => ({ id: e.eventId, name: e.name })), organizers: this.db.organizers.map(o => ({ id: o.organizerId, name: this.db.users.find(u => u.userId === o.userId)?.name || o.businessName })) };
    }
    reviewRefund(id, actorId, body) {
        this.actor(actorId, body.action === 'review' ? undefined : 'refund.approve');
        if (!['review', 'approve', 'reject'].includes(body.action))
            throw new common_1.BadRequestException('Unsupported refund action');
        const r = this.db.refunds.find(r => r.refundId === id);
        if (!r)
            throw new common_1.NotFoundException('Refund not found');
        if (!['pending', 'under_review'].includes(r.status))
            throw new common_1.ConflictException('Refund has already been reviewed');
        if (body.action === 'reject' && (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 2000))
            throw new common_1.BadRequestException('Rejection reason required');
        if (body.action === 'approve') {
            const p = this.db.payments.find(p => p.paymentId === r.paymentId);
            const reg = this.db.registrations.find(reg => reg.registrationId === r.registrationId);
            const e = this.db.events.find(e => e.eventId === reg?.eventId);
            if (!p || p.registrationId !== r.registrationId || p.status !== 'completed' || !reg || reg.status !== 'cancelled' || !e)
                throw new common_1.ConflictException('Cancelled booking with completed payment required');
            const reserved = this.db.refunds.filter(x => x.paymentId === p.paymentId && x.refundId !== id && ['approved', 'processing', 'completed'].includes(x.status)).reduce((n, x) => n + minor(x.amount), 0);
            if (!minor(r.amount) || minor(r.amount) > minor(p.amount) - reserved)
                throw new common_1.ConflictException('Refund exceeds remaining captured balance');
            if (e.status !== 'cancelled' && e.cancellationDeadline && +new Date(r.requestedAt) > +new Date(`${e.cancellationDeadline}T23:59:59.999+05:30`))
                throw new common_1.ConflictException('Cancellation policy deadline exceeded');
            if (this.db.financeSettlements.some(s => s.lines.some((l) => l.paymentId === p.paymentId)))
                throw new common_1.ConflictException('Payment allocated to a settlement; an adjustment policy is required before approval');
        }
        const previous = r.status;
        r.status = body.action === 'review' ? 'under_review' : body.action === 'approve' ? 'approved' : 'rejected';
        this.audit(actorId, id, `refund.${body.action}`, previous, r.status, { reason: body.reason?.trim(), amount: minor(r.amount), providerStatus: 'No live refund integration configured' });
        return this.detail('refunds', id);
    }
    createSettlement(actorId, body) {
        this.actor(actorId);
        if (typeof body.eventId !== 'string' || !body.from || !body.to)
            throw new common_1.BadRequestException('Event and settlement date range required');
        this.filters(body);
        const event = this.db.events.find(e => e.eventId === body.eventId);
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const payments = this.select(this.captured(), { from: body.from, to: body.to, eventId: event.eventId }).filter(p => !this.db.financeSettlements.some(s => s.lines.some((l) => l.paymentId === p.id)));
        if (!payments.length)
            throw new common_1.ConflictException('No unallocated captured payments in this period');
        const lines = payments.map(p => {
            const refunds = this.refundRows().filter(r => r.paymentId === p.id);
            if (refunds.some(r => ['pending', 'under_review', 'approved', 'processing'].includes(r.status)))
                throw new common_1.ConflictException('Resolve pending refunds before settlement');
            const policy = this.policy(event.eventId, p.date);
            if (!policy)
                throw new common_1.ConflictException('Administrator must configure an applicable commission policy first');
            const refunded = sum(refunds.filter(r => r.status === 'completed'), 'amount');
            const net = p.amount - refunded;
            if (net < 0)
                throw new common_1.ConflictException('Refunds exceed captured value');
            const commission = Number((BigInt(net) * BigInt(policy.basisPoints) + 5000n) / 10000n);
            return { paymentId: p.id, gross: p.amount, refunds: refunded, commission, policyId: policy.id, basisPoints: policy.basisPoints, payable: net - commission };
        });
        const row = { id: this.db.generateId('set'), eventId: event.eventId, eventName: event.name, organizerId: event.organizerId, organizerName: this.db.users.find(u => u.userId === this.db.organizers.find(o => o.organizerId === event.organizerId)?.userId)?.name, from: body.from, to: body.to, lines, gross: sum(lines, 'gross'), refunds: sum(lines, 'refunds'), commission: sum(lines, 'commission'), amount: sum(lines, 'payable'), currency: 'INR', status: 'pending_review', date: new Date(), simulatedSource: true };
        this.db.financeSettlements.push(row);
        this.audit(actorId, row.id, 'settlement.calculate', '', row.status);
        return row;
    }
    settlementAction(id, actorId, body) {
        this.actor(actorId, 'settlement.approve');
        const s = this.db.financeSettlements.find(s => s.id === id);
        if (!s)
            throw new common_1.NotFoundException('Settlement not found');
        if (body.action === 'approve') {
            if (s.status !== 'pending_review')
                throw new common_1.ConflictException('Settlement is not pending review');
            s.status = 'approved';
            s.approvedBy = actorId;
            s.approvedAt = new Date();
        }
        else if (body.action === 'record_external') {
            this.admin(actorId);
            if (s.status !== 'approved')
                throw new common_1.ConflictException('Approved settlement required');
            if (s.simulatedSource)
                throw new common_1.ConflictException('Demo / unverified payments cannot be recorded as real payouts');
            if (typeof body.reference !== 'string' || !body.reference.trim() || body.reference.length > 200)
                throw new common_1.BadRequestException('External reference required');
            if (this.db.financeSettlements.some(x => x.externalReference === body.reference.trim()))
                throw new common_1.ConflictException('External reference already used');
            s.status = 'completed';
            s.externalReference = body.reference.trim();
            s.paidAt = new Date();
        }
        else
            throw new common_1.BadRequestException('Unsupported settlement action');
        this.audit(actorId, id, `settlement.${body.action}`, body.action === 'approve' ? 'pending_review' : 'approved', s.status, { externalReference: s.externalReference });
        return s;
    }
    addPolicy(actorId, body) {
        this.admin(actorId);
        if (!Number.isInteger(body.basisPoints) || body.basisPoints < 0 || body.basisPoints > 10000 || !body.effectiveDate)
            throw new common_1.BadRequestException('Rate must be 0–10000 basis points with an effective date');
        this.filters({ from: body.effectiveDate, eventId: body.eventId });
        if (this.db.commissionPolicies.some(p => (p.eventId || '') === (body.eventId || '') && p.effectiveDate === body.effectiveDate))
            throw new common_1.ConflictException('Policy already exists for this scope and date');
        const row = { id: this.db.generateId('cp'), eventId: body.eventId || null, basisPoints: body.basisPoints, effectiveDate: body.effectiveDate, createdBy: actorId, createdAt: new Date() };
        this.db.commissionPolicies.push(row);
        this.audit(actorId, row.id, 'commission.create', '', 'active', row);
        return row;
    }
    grant(actorId, body) {
        this.admin(actorId);
        if (!['refund.approve', 'settlement.approve'].includes(body.permission) || typeof body.enabled !== 'boolean')
            throw new common_1.BadRequestException('Invalid permission');
        const user = this.actor(body.userId);
        if (user.userRole === constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.BadRequestException('Administrators already have permissions');
        this.db.financeGrants = this.db.financeGrants.filter(g => !(g.userId === body.userId && g.permission === body.permission));
        if (body.enabled)
            this.db.financeGrants.push({ userId: body.userId, permission: body.permission });
        this.audit(actorId, body.userId, 'permission.update', '', String(body.enabled), { permission: body.permission });
        return { success: true };
    }
    submissionSummary(row) {
        const { snapshot, requestHash, idempotencyKey, ...summary } = row;
        return { ...summary, type: snapshot.type, filters: snapshot.filters, totals: snapshot.totals };
    }
    submitReport(actorId, body) {
        const actor = this.actor(actorId);
        if (actor.userRole !== constants_1.UserRole.EVENT_STAFF)
            throw new common_1.ForbiddenException('Only Finance Executives may submit finance reports');
        if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160 || (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 2000)) || typeof body.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(body.idempotencyKey) || !body.filters || typeof body.filters !== 'object' || Array.isArray(body.filters))
            throw new common_1.BadRequestException('A report title, valid filters, and submission key are required');
        const filters = {};
        for (const key of ['type', 'from', 'to', 'eventId', 'organizerId', 'status', 'method', 'search', 'sort', 'interval']) {
            const value = body.filters[key];
            if (value !== undefined && value !== '') {
                if (typeof value !== 'string')
                    throw new common_1.BadRequestException('Invalid report filters');
                filters[key] = value;
            }
        }
        const requestHash = (0, crypto_1.createHash)('sha256').update(JSON.stringify({ title: body.title.trim(), notes: body.notes?.trim() || '', filters })).digest('hex');
        const previous = this.db.financeReportSubmissions.find(r => r.submittedBy === actorId && r.idempotencyKey === body.idempotencyKey);
        if (previous) {
            if (previous.requestHash !== requestHash)
                throw new common_1.ConflictException('Submission key already used for a different report');
            return this.submissionSummary(previous);
        }
        const recipients = this.db.users.filter(u => u.userRole === constants_1.UserRole.SUPER_ADMIN && u.status === 'active');
        if (!recipients.length)
            throw new common_1.ConflictException('No active Super Admin is available to receive this report');
        const report = this.report(filters);
        if (report.unavailable)
            throw new common_1.ConflictException(report.unavailable);
        if (report.allRecords.length > 5000)
            throw new common_1.BadRequestException('Narrow the filters to at most 5,000 report records before sending');
        const { records, page, pageSize, totalPages, allRecords, summary, ...metadata } = report;
        const snapshot = structuredClone({ ...metadata, records: allRecords });
        if (Buffer.byteLength(JSON.stringify(snapshot)) > 5 * 1024 * 1024)
            throw new common_1.BadRequestException('Report is too large; narrow the filters before sending');
        const now = new Date();
        const row = { id: this.db.generateId('fin-rpt'), title: body.title.trim(), notes: body.notes?.trim() || '', submittedBy: actorId, submittedByName: actor.name, submittedAt: now, recipientIds: recipients.map(u => u.userId), status: 'submitted', idempotencyKey: body.idempotencyKey, requestHash, snapshot };
        this.db.financeReportSubmissions.push(row);
        for (const recipient of recipients)
            this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: recipient.userId, message: `Finance report received: "${row.title}" from ${actor.name}. Open Revenue Reports → Received Finance Reports (${row.id}).`, type: 'finance_report_submitted', read: false, dateTime: now, createdAt: now });
        this.audit(actorId, row.id, 'report.submit', '', 'submitted', { type: report.type, recordCount: allRecords.length, recipientIds: row.recipientIds });
        return this.submissionSummary(row);
    }
    submittedReports(actorId, q) {
        const actor = this.actor(actorId);
        const rows = this.db.financeReportSubmissions.filter(r => actor.userRole === constants_1.UserRole.SUPER_ADMIN || r.submittedBy === actorId).map(r => ({ ...this.submissionSummary(r), date: r.submittedAt }));
        return this.page(this.select(rows.map(r => ({ ...r, eventName: r.title, attendeeName: r.submittedByName })), q, ['submitted', 'reviewed']), q);
    }
    submittedReport(actorId, id) {
        const actor = this.actor(actorId), row = this.db.financeReportSubmissions.find(r => r.id === id);
        if (!row || (actor.userRole !== constants_1.UserRole.SUPER_ADMIN && row.submittedBy !== actorId))
            throw new common_1.NotFoundException('Submitted report not found');
        return { ...this.submissionSummary(row), snapshot: structuredClone(row.snapshot) };
    }
    reviewSubmittedReport(actorId, id, body) {
        const actor = this.admin(actorId);
        if (!body || (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 2000)))
            throw new common_1.BadRequestException('Review notes must be at most 2,000 characters');
        const row = this.db.financeReportSubmissions.find(r => r.id === id);
        if (!row)
            throw new common_1.NotFoundException('Submitted report not found');
        if (row.status !== 'submitted')
            throw new common_1.ConflictException('This report has already been reviewed');
        Object.assign(row, { status: 'reviewed', reviewedBy: actorId, reviewedByName: actor.name, reviewedAt: new Date(), reviewNotes: body.notes?.trim() || '' });
        this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: row.submittedBy, message: `Super Admin reviewed your finance report "${row.title}" (${row.id}). Open Reports → Sent Reports to view feedback.`, type: 'finance_report_reviewed', read: false, dateTime: new Date(), createdAt: new Date() });
        this.audit(actorId, id, 'report.review', 'submitted', 'reviewed', { notes: row.reviewNotes });
        return this.submissionSummary(row);
    }
    report(q) {
        const type = q.type || 'transactions';
        let records;
        if (type === 'transactions')
            records = this.select(this.paymentRows(), q, ['pending', 'completed', 'failed', 'refunded']);
        else if (type === 'refunds')
            records = this.select(this.refundRows(), q, ['pending', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed', 'not_applicable']);
        else if (type === 'settlements')
            records = this.select(this.db.financeSettlements, q, ['pending_review', 'approved', 'completed', 'on_hold']).map(({ lines, ...s }) => s);
        else if (['events', 'commission'].includes(type)) {
            this.filters(q);
            records = this.revenue(q);
        }
        else if (['daily', 'monthly'].includes(type))
            records = this.dashboard({ ...q, interval: type === 'daily' ? 'daily' : 'monthly' }).trends;
        else if (type === 'reconciliation') {
            this.filters(q);
            records = [];
        }
        else
            throw new common_1.BadRequestException('Unsupported report type');
        const totals = { recordCount: records.length, amount: type === 'commission' && records.some(r => r.commission === null) ? null : sum(records, type === 'commission' ? 'commission' : type === 'events' ? 'gross' : ['daily', 'monthly'].includes(type) ? 'revenue' : 'amount') };
        const chart = ['events', 'commission'].includes(type) ? records.map(r => ({ label: r.eventName, value: type === 'commission' ? r.commission : r.gross })) : ['daily', 'monthly'].includes(type) ? records.map(r => ({ label: r.label, value: r.revenue })) : Object.values(records.reduce((acc, r) => { const key = r.status; acc[key] ||= { label: key, value: 0 }; acc[key].value += r.amount; return acc; }, {}));
        return { type, generatedAt: new Date(), filters: q, totals, chart, summary: this.dashboard(q).summary, ...this.page(records, q), allRecords: records, unavailable: type === 'reconciliation' ? 'No trusted gateway API or reconciliation file integration is configured.' : undefined };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)()
], FinanceService);
//# sourceMappingURL=finance.service.js.map
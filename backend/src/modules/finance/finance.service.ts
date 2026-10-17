import { BadRequestException, ForbiddenException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { financePdf } from './finance-pdf';

@Injectable()
export class FinanceService {
  private readonly db = DataStore.getInstance();
  private assertFinanceEmployee(userId: string, role: UserRole): void {
    const user = this.db.findUserById(userId);
    const type = String(user && user.employeeType || '').toUpperCase();
    if (role !== UserRole.EVENT_STAFF || !user || user.status !== 'active' || ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].indexOf(type) < 0) throw new ForbiddenException('Finance Executive access is required');
  }
  private enrichPayments() {
    return this.db.payments.map(payment => {
      const registration = this.db.registrations.find(item => item.registrationId === payment.registrationId);
      const event = registration && this.db.events.find(item => item.eventId === registration.eventId);
      const attendee = registration && this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
      const user = attendee && this.db.findUserById(attendee.userId);
      return { ...payment, eventId: event && event.eventId || null, eventName: event && event.name || 'Unknown event', attendeeName: user && user.name || 'Unknown attendee', attendeeEmail: user && user.email || '', currency: 'INR' };
    });
  }
  private enrichRefunds() {
    return this.db.refunds.map(refund => {
      const payment = this.db.payments.find(item => item.paymentId === refund.paymentId);
      const registration = this.db.registrations.find(item => item.registrationId === refund.registrationId);
      const event = registration && this.db.events.find(item => item.eventId === registration.eventId);
      const attendee = registration && this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
      const user = attendee && this.db.findUserById(attendee.userId);
      const organizer = event && this.db.organizers.find(item => item.organizerId === event.organizerId);
      const organizerUser = organizer && this.db.findUserById(organizer.userId);
      return { ...refund, originalPaymentAmount: payment && payment.amount || null, eventId: event && event.eventId || null, organizerId: event && event.organizerId || null, organizerName: organizer && (organizer.businessName || (organizerUser && organizerUser.name)) || 'Unknown organizer', eventName: event && event.name || 'Unknown event', attendeeName: user && user.name || 'Unknown attendee', attendeeEmail: user && user.email || '' };
    });
  }

  dashboard(userId: string, role: UserRole, query: Record<string, unknown> = {}) {
    this.assertFinanceEmployee(userId, role);
    const from = this.readDate(query.from, 'from');
    const to = this.readDate(query.to, 'to');
    if (from && to && from > to) throw new BadRequestException('Start date must not be after end date');
    const inRange = (date: unknown) => { const time = new Date(String(date)).getTime(); return (!from || time >= from.getTime()) && (!to || time <= to.getTime()); };
    const payments = this.enrichPayments().filter(item => inRange(item.createdAt));
    const captured = new Map<string, typeof payments[number]>();
    for (const payment of payments) {
      if (['completed', 'refunded'].indexOf(String(payment.status).toLowerCase()) < 0) continue;
      const previous = captured.get(payment.registrationId);
      if (!previous || new Date(String(payment.createdAt)).getTime() > new Date(String(previous.createdAt)).getTime()) captured.set(payment.registrationId, payment);
    }
    const capturedRows = Array.from(captured.values());
    const refunds = this.db.refunds.filter(item => inRange(item.processedAt || item.requestedAt));
    const grossRevenue = capturedRows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const refundedAmount = refunds.filter(item => item.status === 'completed').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const recentTransactions = payments.slice().sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()).slice(0, 8);
    const recentRefunds = this.enrichRefunds().filter(item => inRange(item.processedAt || item.requestedAt)).sort((a, b) => +new Date(b.processedAt || b.requestedAt) - +new Date(a.processedAt || a.requestedAt)).slice(0, 8);
    const eventRevenueMap = new Map<string, { eventId: string | null; eventName: string; revenue: number; ticketsSold: number }>();
    const dailyRevenueMap = new Map<string, number>();
    for (const item of capturedRows) {
      const event = eventRevenueMap.get(item.eventId || item.eventName) || { eventId: item.eventId, eventName: item.eventName, revenue: 0, ticketsSold: 0 };
      event.revenue += Number(item.amount || 0); event.ticketsSold += 1; eventRevenueMap.set(item.eventId || item.eventName, event);
      const day = new Date(item.createdAt).toISOString().slice(0, 10); dailyRevenueMap.set(day, (dailyRevenueMap.get(day) || 0) + Number(item.amount || 0));
    }
    const eventRevenue = Array.from(eventRevenueMap.values()).sort((a, b) => b.revenue - a.revenue);
    const revenueTrend = Array.from(dailyRevenueMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(entry => ({ date: entry[0], revenue: entry[1] }));
    return { currency: 'INR', eventRevenue, revenueTrend, totals: { grossRevenue, netRevenue: grossRevenue - refundedAmount, successfulPayments: capturedRows.length, failedPayments: payments.filter(item => item.status === 'failed').length, pendingPayments: payments.filter(item => item.status === 'pending').length, refundedAmount, pendingRefundRequests: refunds.filter(item => item.status === 'pending').length, ticketsSold: captured.size, platformCommission: null }, capabilities: { commissionConfigured: false, organizerPayouts: false, gatewayReconciliation: false, paymentProvider: 'DEMO_PROVIDER' }, recentTransactions, recentRefunds };
  }
  transactions(userId: string, role: UserRole, query: Record<string, unknown>) {
    this.assertFinanceEmployee(userId, role);
    const page = this.readInt(query.page, 1, 1, 100000);
    const pageSize = this.readInt(query.pageSize, 25, 1, 100);
    const from = this.readDate(query.from, 'from');
    const to = this.readDate(query.to, 'to');
    if (from && to && from > to) throw new BadRequestException('Start date must not be after end date');
    const search = String(query.search || '').trim().toLowerCase();
    const status = String(query.status || '').trim().toLowerCase();
    const method = String(query.paymentMethod || '').trim().toLowerCase();
    const eventId = String(query.eventId || '').trim();
    const sort = String(query.sort || 'date');
    const direction = String(query.direction || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    if (['date', 'amount'].indexOf(sort) < 0) throw new BadRequestException('Unsupported sort field');
    const all = this.enrichPayments().filter(item => {
      const date = new Date(String(item.createdAt)).getTime();
      const searchable = [item.paymentId, item.registrationId, item.attendeeName, item.attendeeEmail, item.eventName].join(' ').toLowerCase();
      return (!search || searchable.includes(search)) && (!status || String(item.status).toLowerCase() === status) && (!method || String(item.paymentMethod).toLowerCase() === method) && (!eventId || item.eventId === eventId) && (!from || date >= from.getTime()) && (!to || date <= to.getTime());
    }).sort((a, b) => direction * (sort === 'amount' ? Number(a.amount) - Number(b.amount) : new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime()));
    return { data: all.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, total: all.length, totalPages: Math.ceil(all.length / pageSize) }, filters: { events: this.db.events.map(event => ({ eventId: event.eventId, name: event.name })), methods: [...new Set(this.db.payments.map(payment => payment.paymentMethod))] } };
  }
  transaction(userId: string, role: UserRole, id: string) {
    this.assertFinanceEmployee(userId, role);
    const item = this.enrichPayments().find(payment => payment.paymentId === id);
    if (!item) throw new NotFoundException('Payment transaction not found');
    const relatedRefunds = this.enrichRefunds().filter(refund => refund.paymentId === id);
    return { ...item, refunds: relatedRefunds };
  }
  refunds(userId: string, role: UserRole, query: Record<string, unknown> = {}) {
    this.assertFinanceEmployee(userId, role);
    const page = this.readInt(query.page, 1, 1, 100000);
    const pageSize = this.readInt(query.pageSize, 25, 1, 100);
    const range = String(query.range || 'last30');
    let from = this.readDate(query.from, 'from');
    let to = this.readDate(query.to, 'to');
    const now = new Date();
    if (range === 'last7') from = new Date(now.getTime() - 7 * 86400000);
    else if (range === 'last30') from = new Date(now.getTime() - 30 * 86400000);
    else if (range === 'thisMonth') from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (range !== 'all' && range !== 'custom') throw new BadRequestException('Unsupported refund date range');
    if (range !== 'custom') to = undefined;
    if (from && to && from > to) throw new BadRequestException('Start date must not be after end date');
    const eventId = String(query.eventId || '');
    const organizerId = String(query.organizerId || '');
    const status = String(query.status || '').toLowerCase();
    const search = String(query.search || '').trim().toLowerCase();
    const sort = String(query.sort || 'newest');
    if (['newest', 'oldest', 'amountHigh', 'amountLow'].indexOf(sort) < 0) throw new BadRequestException('Unsupported refund sort order');
    const records = this.enrichRefunds().filter(item => {
      const date = new Date(String(item.requestedAt)).getTime();
      const text = [item.refundId, item.registrationId, item.paymentId, item.eventName, item.organizerName, item.attendeeName, item.attendeeEmail, item.reason].join(' ').toLowerCase();
      return (!from || date >= from.getTime()) && (!to || date <= to.getTime()) && (!eventId || item.eventId === eventId) && (!organizerId || item.organizerId === organizerId) && (!status || String(item.status).toLowerCase() === status) && (!search || text.includes(search));
    }).sort((a, b) => sort === 'oldest' ? new Date(String(a.requestedAt)).getTime() - new Date(String(b.requestedAt)).getTime() : sort === 'amountHigh' ? Number(b.amount) - Number(a.amount) : sort === 'amountLow' ? Number(a.amount) - Number(b.amount) : new Date(String(b.requestedAt)).getTime() - new Date(String(a.requestedAt)).getTime());
    const eventIds = new Set(this.db.events.map(item => item.eventId));
    const events = this.db.events.filter(event => eventIds.has(event.eventId)).map(event => ({ eventId: event.eventId, name: event.name }));
    const organizers = this.db.organizers.map(organizer => { const user = this.db.findUserById(organizer.userId); return { organizerId: organizer.organizerId, name: organizer.businessName || user && user.name || 'Organizer' }; });
    return { data: records.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, total: records.length, totalPages: Math.ceil(records.length / pageSize) }, filters: { events, organizers } };
  }

  refund(userId: string, role: UserRole, id: string) {
    this.assertFinanceEmployee(userId, role);
    const item = this.enrichRefunds().find(refund => refund.refundId === id);
    if (!item) throw new NotFoundException('Refund request not found');
    return item;
  }
  reviewRefund(userId: string, role: UserRole, id: string, body: Record<string, unknown>) {
    this.assertFinanceEmployee(userId, role);
    if (Object.keys(body).some(key => key !== 'note') || typeof body.note !== 'string' || body.note.trim().length < 10 || body.note.length > 1000) throw new BadRequestException('Review note must be 10 to 1000 characters');
    const refund = this.db.refunds.find(item => item.refundId === id);
    if (!refund) throw new NotFoundException('Refund request not found');
    if (refund.status !== 'pending') throw new BadRequestException('Only pending refunds can be reviewed');
    const payment = this.db.payments.find(item => item.paymentId === refund.paymentId && item.registrationId === refund.registrationId);
    if (!payment || !['completed', 'refunded'].includes(payment.status) || refund.amount <= 0 || refund.amount > payment.amount) throw new BadRequestException('Refund is not eligible for review');
    refund.reviews = refund.reviews || [];
    refund.reviews.push({ actorUserId: userId, note: body.note.trim(), at: new Date().toISOString() });
    return this.refund(userId, role, id);
  }
  exportTransactions(userId: string, role: UserRole, query: Record<string, unknown>): string {
    this.assertFinanceEmployee(userId, role);
    const first = this.transactions(userId, role, { ...query, page: 1, pageSize: 100 });
    const rows = [...first.data];
    for (let page = 2; page <= Math.ceil(first.pagination.total / 100); page++) rows.push(...this.transactions(userId, role, { ...query, page, pageSize: 100 }).data);
    const columns = ['paymentId', 'registrationId', 'eventName', 'attendeeName', 'amount', 'currency', 'paymentMethod', 'status', 'paymentDate'];
    const cell = (value: unknown) => { let text = String(value == null ? '' : value); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; };
    return [columns.join(','), ...rows.map(row => columns.map(key => cell((row as any)[key])).join(','))].join('\r\n');
  }
  overview(userId: string, role: UserRole, query: Record<string, unknown>) {
    const dashboard = this.dashboard(userId, role, query);
    const from = this.readDate(query.from, 'from');
    const to = this.readDate(query.to, 'to');
    const inRange = (value: unknown) => { const time = +new Date(String(value)); return (!from || time >= +from) && (!to || time <= +to); };
    const paid = new Map<string, ReturnType<FinanceService['enrichPayments']>[number]>();
    for (const payment of this.enrichPayments()) {
      if (!['completed', 'refunded'].includes(payment.status) || !inRange(payment.createdAt)) continue;
      if (!paid.has(payment.registrationId)) paid.set(payment.registrationId, payment);
    }
    const refundedByEvent = new Map<string, number>();
    for (const refund of this.enrichRefunds()) {
      if (refund.status !== 'completed' || !inRange(refund.processedAt)) continue;
      refundedByEvent.set(refund.eventId || '', (refundedByEvent.get(refund.eventId || '') || 0) + refund.amount);
    }
    const events = dashboard.eventRevenue.map(row => ({ ...row, refundedAmount: refundedByEvent.get(row.eventId || '') || 0, netRevenue: row.revenue - (refundedByEvent.get(row.eventId || '') || 0), commissionAmount: null, organizerPayable: null }));
    for (const [eventId, amount] of refundedByEvent) {
      if (events.some(row => row.eventId === eventId)) continue;
      events.push({ eventId, eventName: this.db.events.find(event => event.eventId === eventId)?.name || 'Unknown event', revenue: 0, ticketsSold: 0, refundedAmount: amount, netRevenue: -amount, commissionAmount: null, organizerPayable: null });
    }
    const paymentStatuses = ['completed', 'pending', 'failed', 'refunded'].map(status => ({ status, count: this.enrichPayments().filter(item => item.status === status && inRange(item.createdAt)).length }));
    return { ...dashboard, eventRevenue: events, paymentStatuses, commissionTrend: null, refundTrend: this.refundTrend(inRange), generatedAt: new Date().toISOString() };
  }
  private refundTrend(inRange: (value: unknown) => boolean) {
    const daily = new Map<string, { date: string; requested: number; completed: number }>();
    for (const refund of this.db.refunds) {
      if (inRange(refund.requestedAt)) {
        const key = refund.requestedAt.toISOString().slice(0, 10);
        const row = daily.get(key) || { date: key, requested: 0, completed: 0 };
        row.requested += refund.amount; daily.set(key, row);
      }
      if (refund.status === 'completed' && refund.processedAt && inRange(refund.processedAt)) {
        const key = refund.processedAt.toISOString().slice(0, 10);
        const row = daily.get(key) || { date: key, requested: 0, completed: 0 };
        row.completed += refund.amount; daily.set(key, row);
      }
    }
    return [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  }
  reconciliation(userId: string, role: UserRole) {
    this.assertFinanceEmployee(userId, role);
    return { data: [], available: false, reason: 'The demo payment provider has no independent gateway ledger or reconciliation API.' };
  }
  report(userId: string, role: UserRole, query: Record<string, unknown>) {
    this.assertFinanceEmployee(userId, role);
    const type = String(query.type || 'transactions');
    if (!['transactions', 'refunds', 'events', 'daily', 'monthly'].includes(type)) throw new BadRequestException('Unsupported report type');
    const from = this.readDate(query.from, 'from');
    const to = this.readDate(query.to, 'to');
    if (from && to && from > to) throw new BadRequestException('Start date must not be after end date');
    const inRange = (value: unknown) => { const time = +new Date(String(value)); return (!from || time >= +from) && (!to || time <= +to); };
    const eventId = String(query.eventId || '');
    const organizerId = String(query.organizerId || '');
    const status = String(query.status || '').toLowerCase();
    const payments = this.enrichPayments().filter(row => inRange(row.createdAt) && (!eventId || row.eventId === eventId) && (!organizerId || this.db.events.some(event => event.eventId === row.eventId && event.organizerId === organizerId)) && (!status || row.status === status));
    const refunds = this.enrichRefunds().filter(row => inRange(row.processedAt || row.requestedAt) && (!eventId || row.eventId === eventId) && (!organizerId || row.organizerId === organizerId) && (!status || row.status === status));
    let rows: Record<string, unknown>[];
    if (type === 'transactions') rows = payments;
    else if (type === 'refunds') rows = refunds;
    else {
      const groups = new Map<string, { period: string; eventId?: string | null; eventName?: string; grossRevenue: number; refunds: number; netRevenue: number; ticketsSold: number }>();
      const keyFor = (date: string, id?: string | null) => type === 'events' ? id || 'unknown' : type === 'monthly' ? date.slice(0, 7) : date.slice(0, 10);
      const paid = new Set<string>();
      for (const row of payments) {
        if (!['completed', 'refunded'].includes(row.status) || paid.has(row.registrationId)) continue;
        paid.add(row.registrationId);
        const key = keyFor(String(row.createdAt), row.eventId);
        const item = groups.get(key) || { period: key, eventId: row.eventId, eventName: row.eventName, grossRevenue: 0, refunds: 0, netRevenue: 0, ticketsSold: 0 };
        item.grossRevenue += row.amount; item.ticketsSold++; groups.set(key, item);
      }
      for (const row of refunds) {
        if (row.status !== 'completed') continue;
        const key = keyFor(String(row.processedAt || row.requestedAt), row.eventId);
        const item = groups.get(key) || { period: key, eventId: row.eventId, eventName: row.eventName, grossRevenue: 0, refunds: 0, netRevenue: 0, ticketsSold: 0 };
        item.refunds += row.amount; groups.set(key, item);
      }
      rows = [...groups.values()].map(item => ({ ...item, netRevenue: item.grossRevenue - item.refunds })).sort((a, b) => String(a.period).localeCompare(String(b.period)));
    }
    const uniqueCaptured = new Map<string, typeof payments[number]>();
    for (const payment of payments) if (['completed', 'refunded'].includes(payment.status) && !uniqueCaptured.has(payment.registrationId)) uniqueCaptured.set(payment.registrationId, payment);
    const grossRevenue = [...uniqueCaptured.values()].reduce((sum, payment) => sum + payment.amount, 0);
    const refundedAmount = refunds.filter(refund => refund.status === 'completed').reduce((sum, refund) => sum + refund.amount, 0);
    return { type, rows, total: rows.length, generatedAt: new Date().toISOString(), filters: { from: query.from || null, to: query.to || null, eventId: eventId || null, organizerId: organizerId || null, status: status || null }, options: { events: this.db.events.map(event => ({ id: event.eventId, name: event.name })), organizers: this.db.organizers.map(organizer => ({ id: organizer.organizerId, name: organizer.businessName || this.db.findUserById(organizer.userId)?.name || organizer.organizerId })) }, currency: 'INR', summary: { grossRevenue, refundedAmount, netRevenue: grossRevenue - refundedAmount } };
  }
  submissions(userId: string, role: UserRole) {
    if (role !== UserRole.SUPER_ADMIN) this.assertFinanceEmployee(userId, role);
    return this.db.financeReportSubmissions
      .filter(item => role === UserRole.SUPER_ADMIN || item.userId === userId)
      .slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  submitReport(userId: string, role: UserRole, body: Record<string, unknown>) {
    this.assertFinanceEmployee(userId, role);
    const title = String(body.title || '').trim();
    const summary = String(body.summary || '').trim();
    if (title.length < 3 || title.length > 120) throw new BadRequestException('Report title must be 3 to 120 characters');
    if (summary.length < 10 || summary.length > 2000) throw new BadRequestException('Report summary must be 10 to 2000 characters');
    const rawFilters = body.filters && typeof body.filters === 'object' && !Array.isArray(body.filters) ? body.filters as Record<string, unknown> : {};
    const filters: Record<string, unknown> = { type: body.reportType || 'transactions' };
    for (const key of ['from', 'to', 'eventId', 'organizerId', 'status']) if (rawFilters[key] != null && rawFilters[key] !== '') filters[key] = rawFilters[key];
    const snapshot = this.report(userId, role, filters);
    if (snapshot.total > 10000) throw new PayloadTooLargeException('Narrow the report filters before sending');
    const user = this.db.findUserById(userId);
    const record = {
      id: this.db.generateId('fin-rpt'), userId, userName: user?.name || 'Finance Executive', title, summary,
      reportType: snapshot.type, filters: snapshot.filters as Record<string, unknown>,
      metrics: { recordCount: snapshot.total, ...snapshot.summary }, rows: snapshot.rows as Record<string, unknown>[],
      status: 'Submitted' as const, feedback: '', createdAt: new Date(),
    };
    this.db.financeReportSubmissions.push(record);
    return record;
  }
  reviewReport(id: string, userId: string, role: UserRole, body: Record<string, unknown>) {
    if (role !== UserRole.SUPER_ADMIN || !this.db.findUserById(userId)) throw new ForbiddenException('Super Admin access is required');
    const report = this.db.financeReportSubmissions.find(item => item.id === id);
    if (!report) throw new NotFoundException('Finance report not found');
    const feedback = String(body.feedback || '').trim();
    if (feedback.length > 2000) throw new BadRequestException('Feedback must be 2000 characters or less');
    report.status = 'Reviewed';
    report.feedback = feedback;
    report.reviewedAt = new Date();
    return report;
  }
  reportCsv(userId: string, role: UserRole, query: Record<string, unknown>): string {
    const result = this.report(userId, role, query);
    if (result.total > 10000) throw new PayloadTooLargeException('Narrow the report date range before exporting');
    const columns = result.type === 'transactions' ? ['paymentId', 'registrationId', 'eventName', 'attendeeName', 'amount', 'currency', 'paymentMethod', 'status', 'paymentDate'] : result.type === 'refunds' ? ['refundId', 'paymentId', 'registrationId', 'eventName', 'attendeeName', 'amount', 'reason', 'status', 'requestedAt', 'processedAt'] : ['period', 'eventName', 'grossRevenue', 'refunds', 'netRevenue', 'ticketsSold'];
    const cell = (value: unknown) => { let s = String(value == null ? '' : value); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    return [columns.join(','), ...result.rows.map(row => columns.map(column => cell(row[column])).join(','))].join('\r\n');
  }
  reportPdf(userId: string, role: UserRole, query: Record<string, unknown>): Buffer {
    const result = this.report(userId, role, query);
    if (result.total > 10000) throw new PayloadTooLargeException('Narrow the report date range before exporting');
    const columns = result.type === 'transactions' ? ['paymentId', 'registrationId', 'eventName', 'amount', 'status', 'paymentDate'] : result.type === 'refunds' ? ['refundId', 'paymentId', 'eventName', 'amount', 'status', 'requestedAt'] : ['period', 'eventName', 'grossRevenue', 'refunds', 'netRevenue', 'ticketsSold'];
    return financePdf(result.type.toUpperCase() + ' REPORT', result.generatedAt, result.filters, result.summary, result.rows, columns);
  }
  private readInt(value: unknown, fallback: number, min: number, max: number): number {
    if (value === undefined || value === '') return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) throw new BadRequestException('Invalid pagination value');
    return number;
  }
  private readDate(value: unknown, field: string): Date | undefined {
    if (value === undefined || value === '') return undefined;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)) throw new BadRequestException('Invalid ' + field + ' date');
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid ' + field + ' date');
    if (field === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) date.setHours(23, 59, 59, 999);
    return date;
  }
}

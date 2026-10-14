"use strict";
/**
 * In-memory data store for the application
 * Simulates a database without actual persistence
 * Includes all entities from the ER diagram
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStore = void 0;
const constants_1 = require("./constants");
// ==================== DATA STORE CLASS ====================
class DataStore {
    constructor() {
        // User entities
        this.users = [];
        this.superAdmins = [];
        this.clients = [];
        this.organizers = [];
        this.staffProfiles = [];
        this.attendees = [];
        // Event entities
        this.events = [];
        this.eventRequests = [];
        this.eventPlans = [];
        // Registration & Payment
        this.registrations = [];
        this.payments = [];
        // Attendance & Assignments
        this.attendance = [];
        this.staffAssignments = [];
        // Reports & Reviews
        this.eventReports = [];
        this.staffReports = [];
        this.eventReviews = [];
        this.staffReviews = [];
        // Notifications
        this.notifications = [];
        // Activity logs
        this.activityLogs = [];
        // Customer support
        this.supportTickets = [];
        this.supportAttachments = [];
        this.initializeSeedData();
    }
    static getInstance() {
        if (!DataStore.instance) {
            DataStore.instance = new DataStore();
        }
        return DataStore.instance;
    }
    initializeSeedData() {
        // ==================== DEMO USERS ====================
        this.users = [
            {
                userId: 'usr-admin-001',
                name: 'Alex Johnson',
                email: 'superadmin@example.com',
                password: 'Admin@123',
                userRole: constants_1.UserRole.SUPER_ADMIN,
                status: 'active',
                phoneNo: '9876543210',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
            {
                userId: 'usr-client-001',
                name: 'Michael Torres',
                email: 'client@example.com',
                password: 'Client@123',
                userRole: constants_1.UserRole.CLIENT,
                status: 'active',
                phoneNo: '8765432109',
                address: '123 Tech Park, Bangalore',
                createdAt: new Date('2024-01-05'),
                updatedAt: new Date('2024-01-05'),
            },
            {
                userId: 'usr-org-001',
                name: 'Sarah Chen',
                email: 'organizer@example.com',
                password: 'Organizer@123',
                userRole: constants_1.UserRole.EVENT_ORGANIZER,
                status: 'active',
                phoneNo: '6543210987',
                createdAt: new Date('2024-01-10'),
                updatedAt: new Date('2024-01-10'),
            },
            {
                userId: 'usr-emp-001',
                name: 'Marcus Vance',
                email: 'employee@example.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.EVENT_OPERATIONS,
                status: 'active',
                phoneNo: '9876543220',
                createdAt: new Date('2024-01-18'),
                updatedAt: new Date('2024-01-18'),
            },
            {
                userId: 'usr-emp-001b',
                name: 'Marcus Vance',
                email: 'employee@eventflow.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.EVENT_OPERATIONS,
                status: 'active',
                phoneNo: '9876543220',
                createdAt: new Date('2024-01-18'),
                updatedAt: new Date('2024-01-18'),
            },
            {
                userId: 'usr-emp-001c',
                name: 'Marcus Vance',
                email: 'marcus.ops@eventflow.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.SUPPORT_FINANCE,
                status: 'active',
                phoneNo: '9876543220',
                createdAt: new Date('2024-01-18'),
                updatedAt: new Date('2024-01-18'),
            },
            {
                userId: 'usr-emp-002',
                name: 'Elena Rostova',
                email: 'elena.coordinator@eventflow.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.EVENT_OPERATIONS,
                status: 'active',
                phoneNo: '9876543221',
                createdAt: new Date('2024-02-12'),
                updatedAt: new Date('2024-02-12'),
            },
            {
                userId: 'usr-emp-003',
                name: 'Arjun Kapoor',
                email: 'arjun.events@eventflow.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.REGISTRATION_VERIFICATION,
                status: 'active',
                phoneNo: '9876543222',
                createdAt: new Date('2024-03-08'),
                updatedAt: new Date('2024-03-08'),
            },
            {
                userId: 'usr-emp-004',
                name: 'Maya Lin',
                email: 'maya.ops@eventflow.com',
                password: 'Employee@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                employeeType: constants_1.EmployeeType.SUPPORT_FINANCE,
                status: 'active',
                phoneNo: '9876543223',
                createdAt: new Date('2024-03-22'),
                updatedAt: new Date('2024-03-22'),
            },
            {
                userId: 'usr-staff-001',
                name: 'James Wilson',
                email: 'staff@example.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678902',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15'),
            },
            {
                userId: 'usr-staff-002',
                name: 'David Kim',
                email: 'david@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678903',
                createdAt: new Date('2024-03-01'),
                updatedAt: new Date('2024-03-01'),
            },
            {
                userId: 'usr-staff-003',
                name: 'Nina Lopez',
                email: 'nina@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678904',
                createdAt: new Date('2024-03-20'),
                updatedAt: new Date('2024-03-20'),
            },
            {
                userId: 'usr-staff-004',
                name: 'Ananya Verma',
                email: 'ananya@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678905',
                createdAt: new Date('2024-04-10'),
                updatedAt: new Date('2024-04-10'),
            },
            {
                userId: 'usr-staff-005',
                name: 'Marcus Brody',
                email: 'marcus@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678906',
                createdAt: new Date('2024-04-18'),
                updatedAt: new Date('2024-04-18'),
            },
            {
                userId: 'usr-staff-006',
                name: 'Sophie Dubois',
                email: 'sophie@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678907',
                createdAt: new Date('2024-05-02'),
                updatedAt: new Date('2024-05-02'),
            },
            {
                userId: 'usr-staff-007',
                name: 'Rahul Sengupta',
                email: 'rahul.s@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678908',
                createdAt: new Date('2024-05-15'),
                updatedAt: new Date('2024-05-15'),
            },
            {
                userId: 'usr-staff-008',
                name: 'Elena Rostova',
                email: 'elena@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'inactive',
                phoneNo: '7345678909',
                createdAt: new Date('2024-06-01'),
                updatedAt: new Date('2024-06-01'),
            },
            {
                userId: 'usr-staff-009',
                name: 'Karthik Nair',
                email: 'karthik.n@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'active',
                phoneNo: '7345678910',
                createdAt: new Date('2024-06-12'),
                updatedAt: new Date('2024-06-12'),
            },
            {
                userId: 'usr-staff-010',
                name: 'Zoe Martinez',
                email: 'zoe@eventflow.com',
                password: 'Staff@123',
                userRole: constants_1.UserRole.EVENT_STAFF,
                status: 'inactive',
                phoneNo: '7345678911',
                createdAt: new Date('2024-07-01'),
                updatedAt: new Date('2024-07-01'),
            },
            {
                userId: 'usr-attendee-001',
                name: 'Priya Patel',
                email: 'attendee@example.com',
                password: 'Attendee@123',
                userRole: constants_1.UserRole.ATTENDEE,
                status: 'active',
                phoneNo: '8678901235',
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-01'),
            },
        ];
        // ==================== ROLE-SPECIFIC PROFILES ====================
        this.superAdmins = [
            {
                superAdminId: 'sa-001',
                userId: 'usr-admin-001',
                email: 'superadmin@example.com',
                phoneNo: '9876543210',
                createdAt: new Date('2024-01-01'),
            },
        ];
        this.clients = [
            {
                clientId: 'cli-001',
                userId: 'usr-client-001',
                companyName: 'Torres Tech Solutions',
                createdAt: new Date('2024-01-05'),
            },
        ];
        this.organizers = [
            {
                organizerId: 'org-001',
                userId: 'usr-org-001',
                businessName: 'Chen Elite Events',
                rating: 4.9,
                createdAt: new Date('2024-01-10'),
            },
            {
                organizerId: 'org-002',
                userId: 'usr-emp-001',
                businessName: 'Vance Operations & Conference Management',
                rating: 4.9,
                createdAt: new Date('2024-01-18'),
            },
            {
                organizerId: 'org-003',
                userId: 'usr-emp-002',
                businessName: 'Rostova Gala & Wedding Coordinators',
                rating: 4.8,
                createdAt: new Date('2024-02-12'),
            },
            {
                organizerId: 'org-004',
                userId: 'usr-emp-003',
                businessName: 'Kapoor Festival & Stage Productions',
                rating: 4.9,
                createdAt: new Date('2024-03-08'),
            },
            {
                organizerId: 'org-005',
                userId: 'usr-emp-004',
                businessName: 'Maya Event Logistics',
                rating: 4.7,
                createdAt: new Date('2024-03-22'),
            },
        ];
        this.staffProfiles = [
            {
                staffId: 'staff-emp-001',
                userId: 'usr-emp-001',
                availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-01-18'),
            },
            {
                staffId: 'staff-emp-001b',
                userId: 'usr-emp-001b',
                availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-01-18'),
            },
            {
                staffId: 'staff-emp-001c',
                userId: 'usr-emp-001c',
                availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-01-18'),
            },
            {
                staffId: 'staff-emp-002',
                userId: 'usr-emp-002',
                availableDates: ['2026-06-15', '2026-07-20'],
                rating: 4.8,
                status: 'available',
                createdAt: new Date('2024-02-12'),
            },
            {
                staffId: 'staff-emp-003',
                userId: 'usr-emp-003',
                availableDates: ['2026-06-15', '2026-07-20'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-03-08'),
            },
            {
                staffId: 'staff-emp-004',
                userId: 'usr-emp-004',
                availableDates: ['2026-06-15', '2026-07-20'],
                rating: 4.7,
                status: 'available',
                createdAt: new Date('2024-03-22'),
            },
            {
                staffId: 'staff-001',
                userId: 'usr-staff-001',
                availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
                rating: 4.8,
                status: 'available',
                createdAt: new Date('2024-01-15'),
            },
            {
                staffId: 'staff-002',
                userId: 'usr-staff-002',
                availableDates: ['2026-06-15', '2026-07-10'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-03-01'),
            },
            {
                staffId: 'staff-003',
                userId: 'usr-staff-003',
                availableDates: ['2026-06-20', '2026-08-05'],
                rating: 4.7,
                status: 'available',
                createdAt: new Date('2024-03-20'),
            },
            {
                staffId: 'staff-004',
                userId: 'usr-staff-004',
                availableDates: ['2026-06-15', '2026-07-25'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-04-10'),
            },
            {
                staffId: 'staff-005',
                userId: 'usr-staff-005',
                availableDates: ['2026-07-01', '2026-08-15'],
                rating: 4.6,
                status: 'available',
                createdAt: new Date('2024-04-18'),
            },
            {
                staffId: 'staff-006',
                userId: 'usr-staff-006',
                availableDates: ['2026-06-15', '2026-07-20'],
                rating: 4.8,
                status: 'available',
                createdAt: new Date('2024-05-02'),
            },
            {
                staffId: 'staff-007',
                userId: 'usr-staff-007',
                availableDates: ['2026-06-15', '2026-08-10'],
                rating: 4.7,
                status: 'available',
                createdAt: new Date('2024-05-15'),
            },
            {
                staffId: 'staff-008',
                userId: 'usr-staff-008',
                availableDates: [],
                rating: 4.5,
                status: 'unavailable',
                createdAt: new Date('2024-06-01'),
            },
            {
                staffId: 'staff-009',
                userId: 'usr-staff-009',
                availableDates: ['2026-06-15', '2026-07-15', '2026-08-20'],
                rating: 4.9,
                status: 'available',
                createdAt: new Date('2024-06-12'),
            },
            {
                staffId: 'staff-010',
                userId: 'usr-staff-010',
                availableDates: [],
                rating: 4.4,
                status: 'unavailable',
                createdAt: new Date('2024-07-01'),
            },
        ];
        this.attendees = [
            {
                attendeeId: 'att-001',
                userId: 'usr-attendee-001',
                createdAt: new Date('2024-02-01'),
            },
            {
                attendeeId: 'att-002',
                userId: 'usr-attendee-002',
                createdAt: new Date('2024-02-01'),
            },
        ];
        // ==================== EVENTS (Managed by Sarah Chen) ====================
        this.events = [
            {
                eventId: 'evt-emp-101',
                organizerId: 'org-002',
                clientId: 'cli-001',
                name: 'Global AI & Cloud Summit 2026',
                category: 'Technology',
                date: '2026-06-15',
                time: '09:00 AM',
                location: 'Grand Convention Center, Hall A, Bangalore',
                capacity: 600,
                ticketPrice: 1500,
                status: 'published',
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date('2024-01-20'),
                description: 'Flagship enterprise summit on Generative AI, Cloud Infrastructure, and Agentic Workflows managed by Marcus Vance.',
                city: 'Bangalore',
            },
            {
                eventId: 'evt-emp-102',
                organizerId: 'org-002',
                clientId: 'cli-001',
                name: 'FinTech Leaders Executive Conclave',
                category: 'Finance',
                date: '2026-06-22',
                time: '05:30 PM',
                location: 'The Leela Palace Ballroom, Mumbai',
                capacity: 250,
                ticketPrice: 2500,
                status: 'published',
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date('2024-02-10'),
                description: 'Exclusive executive dinner and keynote sessions for digital banking and FinTech innovators.',
                city: 'Mumbai',
            },
            {
                eventId: 'evt-emp-103',
                organizerId: 'org-002',
                name: 'Cybersecurity & Zero Trust Workshop',
                category: 'Technology',
                date: '2026-07-05',
                time: '10:00 AM',
                location: 'Cyber Towers — Tech Room 3, Hyderabad',
                capacity: 80,
                ticketPrice: 800,
                status: 'published',
                createdAt: new Date('2024-02-18'),
                updatedAt: new Date('2024-02-18'),
                description: 'Hands-on live simulation on threat modeling, Zero Trust architecture, and cloud security.',
                city: 'Hyderabad',
            },
            {
                eventId: 'evt-emp-104',
                organizerId: 'org-002',
                name: 'National Web3 & AI Hackathon 2026',
                category: 'Technology',
                date: '2026-07-18',
                time: '08:00 AM',
                location: 'Innovation Arena, HITEC City, Chennai',
                capacity: 400,
                ticketPrice: 0,
                status: 'published',
                createdAt: new Date('2024-03-01'),
                updatedAt: new Date('2024-03-01'),
                description: '36-hour national developer hackathon with ?50K in prize bounties for open source AI agents.',
                city: 'Chennai',
            },
            {
                eventId: 'evt-001',
                organizerId: 'org-001',
                clientId: 'cli-001',
                name: 'Global AI Summit 2026',
                category: 'Technology',
                date: '2026-06-15',
                time: '09:00 AM',
                location: 'Grand Ballroom, Chennai',
                capacity: 500,
                ticketPrice: 1500,
                status: 'published',
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date('2024-01-20'),
                description: 'Join Sarah Chen for the biggest AI summit of the year. Featuring speakers from Google, Meta, and OpenAI.',
                city: 'Chennai',
            },
            {
                eventId: 'evt-002',
                organizerId: 'org-001',
                name: 'Yoga & Wellness Retreat',
                category: 'Health',
                date: '2026-07-20',
                time: '07:00 AM',
                location: 'Zen Gardens, Bangalore',
                capacity: 100,
                ticketPrice: 500,
                status: 'published',
                createdAt: new Date('2024-01-21'),
                updatedAt: new Date('2024-01-21'),
                description: 'A relaxing weekend retreat focusing on mental health and physical well-being.',
                city: 'Bangalore',
            },
            {
                eventId: 'evt-003',
                organizerId: 'org-001',
                name: 'Future of Fintech',
                category: 'Finance',
                date: '2026-08-10',
                time: '10:00 AM',
                location: 'ITC Gardenia, Bangalore',
                capacity: 250,
                ticketPrice: 1200,
                status: 'draft',
                createdAt: new Date('2024-02-15'),
                updatedAt: new Date('2024-02-15'),
                description: 'Exploring the intersection of technology and finance in the modern era.',
                city: 'Bangalore',
            },
        ];
        // ==================== EVENT REQUESTS (Michael Torres -> Sarah Chen) ====================
        this.eventRequests = [
            {
                requestId: 'req-emp-101',
                clientId: 'cli-001',
                organizerId: 'org-002',
                eventName: 'Torres Tech Q3 Product Launch',
                eventDate: '2026-06-01',
                budget: 35000,
                capacity: 350,
                requirements: 'Global launch for next-gen enterprise suite. Require 4K live streaming, stage AV, VIP catering, and 5 photographers.',
                status: 'pending',
                createdAt: new Date('2024-03-20'),
                updatedAt: new Date('2024-03-20'),
            },
            {
                requestId: 'req-emp-102',
                clientId: 'cli-001',
                organizerId: 'org-002',
                eventName: 'Annual Leadership Strategy Retreat',
                eventDate: '2026-06-15',
                budget: 18000,
                capacity: 120,
                requirements: 'Annual executive team retreat with breakout workshop sessions, keynote speaker, and outdoor networking dinner.',
                status: 'approved',
                createdAt: new Date('2024-03-15'),
                updatedAt: new Date('2024-03-15'),
            },
            {
                requestId: 'req-001',
                clientId: 'cli-001',
                organizerId: 'org-001',
                eventName: 'Tech Product Launch',
                eventDate: '2026-09-05',
                budget: 75000,
                capacity: 300,
                requirements: 'Need premium stage setup, 4K streaming, and high-end catering for 300 guests.',
                status: 'pending',
                createdAt: new Date('2024-03-01'),
                updatedAt: new Date('2024-03-01'),
            },
            {
                requestId: 'req-002',
                clientId: 'cli-001',
                organizerId: 'org-001',
                eventName: 'Corporate Anniversary',
                eventDate: '2026-10-15',
                budget: 50000,
                capacity: 200,
                requirements: 'Elegant gala dinner with live jazz band and awards ceremony.',
                status: 'approved',
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date('2024-02-12'),
            },
        ];
        // ==================== EVENT PLANS ====================
        this.eventPlans = [
            {
                eventPlanId: 'plan-001',
                eventId: 'evt-001',
                clientId: 'cli-001',
                organizerId: 'org-001',
                title: 'Global AI Summit - Detailed Execution Plan',
                description: 'Comprehensive logistics, speaker lineup, and marketing strategy.',
                budget: 100000,
                capacity: 500,
                status: 'approved',
                approvalStatus: 'approved',
                createdAt: new Date('2024-01-25'),
                updatedAt: new Date('2024-01-27'),
            },
        ];
        // ==================== REGISTRATIONS (Priya Patel -> Global AI Summit) ====================
        this.registrations = [
            {
                registrationId: 'reg-001',
                attendeeId: 'att-001',
                eventId: 'evt-001',
                registrationDate: '2024-02-10',
                status: 'registered',
                ticketType: 'VIP Pass',
                qrCode: 'QR-PRIYA-AI-SUMMIT',
                verificationId: 'V-PRIYA-001',
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date('2024-02-10'),
            },
        ];
        // ==================== PAYMENTS ====================
        this.payments = [
            {
                paymentId: 'pay-001',
                registrationId: 'reg-001',
                amount: 1500,
                status: 'completed',
                paymentDate: '2024-02-10',
                paymentMethod: 'UPI',
                createdAt: new Date('2024-02-10'),
                updatedAt: new Date('2024-02-10'),
            },
        ];
        // ==================== STAFF ASSIGNMENTS (Sarah Chen -> James Wilson) ====================
        this.staffAssignments = [
            {
                assignmentId: 'asgn-emp-101',
                eventId: 'evt-emp-101',
                organizerId: 'org-002',
                staffId: 'staff-001',
                status: 'accepted',
                assignedAt: new Date('2024-03-01'),
                updatedAt: new Date('2024-03-01'),
            },
            {
                assignmentId: 'asgn-emp-102',
                eventId: 'evt-emp-102',
                organizerId: 'org-002',
                staffId: 'staff-003',
                status: 'accepted',
                assignedAt: new Date('2024-03-05'),
                updatedAt: new Date('2024-03-05'),
            },
            {
                assignmentId: 'asgn-emp-103',
                eventId: 'evt-emp-101',
                organizerId: 'org-002',
                staffId: 'staff-002',
                status: 'pending',
                assignedAt: new Date('2024-03-10'),
                updatedAt: new Date('2024-03-10'),
            },
            {
                assignmentId: 'asgn-001',
                eventId: 'evt-001',
                organizerId: 'org-001',
                staffId: 'staff-001',
                status: 'accepted',
                assignedAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-02'),
            },
            {
                assignmentId: 'asgn-002',
                eventId: 'evt-002',
                organizerId: 'org-001',
                staffId: 'staff-001',
                status: 'pending',
                assignedAt: new Date('2024-03-10'),
                updatedAt: new Date('2024-03-10'),
            },
        ];
        // ==================== NOTIFICATIONS ====================
        this.notifications = [
            {
                notificationId: 'notif-001',
                userId: 'usr-org-001', // Sarah Chen
                message: 'New event request from Michael Torres for "Tech Product Launch".',
                type: 'request',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            },
            {
                notificationId: 'notif-002',
                userId: 'usr-staff-001', // James Wilson
                message: 'You have been assigned to "Yoga & Wellness Retreat" by Sarah Chen.',
                type: 'assignment',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            },
            {
                notificationId: 'notif-003',
                userId: 'usr-client-001', // Michael Torres
                message: 'Your event request for "Corporate Anniversary" has been approved by Sarah Chen.',
                type: 'approval',
                read: true,
                dateTime: new Date('2024-02-12'),
                createdAt: new Date('2024-02-12'),
            },
        ];
        // ==================== ATTENDANCE ====================
        this.attendance = [
            {
                attendanceId: 'atnd-001',
                attendeeId: 'att-001',
                eventId: 'evt-001',
                staffId: 'staff-001',
                checkInTime: '09:15 AM',
                status: 'checked-in',
                verificationId: 'VER-001-001',
                createdAt: new Date('2024-06-15'),
                updatedAt: new Date('2024-06-15'),
            },
            {
                attendanceId: 'atnd-002',
                attendeeId: 'att-002',
                eventId: 'evt-001',
                staffId: 'staff-001',
                checkInTime: '09:30 AM',
                status: 'checked-in',
                verificationId: 'VER-002-001',
                createdAt: new Date('2024-06-15'),
                updatedAt: new Date('2024-06-15'),
            },
        ];
        // ==================== REPORTS ====================
        this.eventReports = [
            {
                eventReportId: 'rpt-evt-001',
                organizerId: 'org-001',
                eventId: 'evt-001',
                clientId: 'cli-001',
                reportTitle: 'Tech Conference 2024 - Final Report',
                reportDetails: 'Event was successful with 450 attendees. All sponsors satisfied.',
                submissionDate: '2024-06-20',
                status: 'submitted',
                createdAt: new Date('2024-06-20'),
                updatedAt: new Date('2024-06-20'),
            },
        ];
        this.staffReports = [
            {
                staffReportId: 'rpt-staff-001',
                staffId: 'staff-001',
                organizerId: 'org-001',
                eventId: 'evt-001',
                reportText: 'Event ran smoothly. Check-in process was efficient. Attendees were satisfied.',
                status: 'submitted',
                createdAt: new Date('2024-06-20'),
                updatedAt: new Date('2024-06-20'),
            },
        ];
        // ==================== REVIEWS ====================
        this.eventReviews = [
            {
                reviewId: 'rev-evt-001',
                reviewerId: 'att-001',
                eventId: 'evt-001',
                rating: 5,
                comment: 'Excellent event! Great speakers and networking opportunities.',
                date: '2024-06-21',
                createdAt: new Date('2024-06-21'),
            },
            {
                reviewId: 'rev-evt-002',
                reviewerId: 'att-002',
                eventId: 'evt-001',
                rating: 4,
                comment: 'Good event overall. Could improve on timing.',
                date: '2024-06-21',
                createdAt: new Date('2024-06-21'),
            },
        ];
        this.staffReviews = [
            {
                reviewId: 'rev-staff-001',
                reviewerId: 'org-001',
                staffId: 'staff-001',
                eventId: 'evt-001',
                rating: 5,
                comment: 'Frank did an excellent job. Very professional and efficient.',
                reviewDate: '2024-06-22',
                createdAt: new Date('2024-06-22'),
            },
        ];
        const resolvedOn = new Date('2026-10-01T10:00:00.000Z');
        const resolvedTicket = (ticketId, userId, requestType, concern, description, daysAgo) => {
            const resolvedAt = new Date(resolvedOn);
            resolvedAt.setUTCDate(resolvedAt.getUTCDate() - daysAgo);
            return {
                ticketId,
                userId,
                requestType,
                concern,
                description,
                attachments: [],
                status: 'resolved',
                createdAt: new Date(resolvedAt.getTime() - 60 * 60 * 1000),
                updatedAt: resolvedAt,
                resolutionEmailSentAt: resolvedAt,
            };
        };
        this.supportTickets = [
            resolvedTicket('SUP-2026-00001', 'usr-attendee-001', 'Ticket & Registration Issues', 'Ticket not received after registration', 'I completed my event registration, but the ticket did not appear in My Tickets.', 12),
            resolvedTicket('SUP-2026-00002', 'usr-attendee-001', 'Account Related Problems', 'Profile details not saving', 'I updated my profile details, but my changes were not being saved.', 5),
            resolvedTicket('SUP-2026-00003', 'usr-client-001', 'Organizer & Client Support', 'Unable to download event reports', 'I cannot download the event reports from my client dashboard.', 9),
            resolvedTicket('SUP-2026-00004', 'usr-org-001', 'Organizer & Client Support', 'Event capacity not updating', 'The event capacity shown in the organizer dashboard does not match the current registrations.', 7),
            resolvedTicket('SUP-2026-00005', 'usr-staff-001', 'Event Staff & Check-in Support', 'Check-in not updating', 'Attendee check-ins are not updating in the attendance list after scanning.', 4),
        ];
    }
    // ==================== UTILITY METHODS ====================
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    clearAllData() {
        this.users = [];
        this.superAdmins = [];
        this.clients = [];
        this.organizers = [];
        this.staffProfiles = [];
        this.attendees = [];
        this.events = [];
        this.eventRequests = [];
        this.eventPlans = [];
        this.registrations = [];
        this.payments = [];
        this.attendance = [];
        this.staffAssignments = [];
        this.eventReports = [];
        this.staffReports = [];
        this.eventReviews = [];
        this.staffReviews = [];
        this.notifications = [];
        this.activityLogs = [];
        this.supportTickets = [];
        this.supportAttachments = [];
        this.initializeSeedData();
    }
    // User lookup utilities
    findUserByEmail(email) {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    findUserById(userId) {
        return this.users.find(u => u.userId === userId);
    }
}
exports.DataStore = DataStore;
//# sourceMappingURL=data-store.js.map
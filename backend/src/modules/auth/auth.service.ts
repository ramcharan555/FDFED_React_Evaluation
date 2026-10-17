import { Injectable, BadRequestException, UnauthorizedException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataStore, OrganizerApplication, OrganizerApplicationStatus, User } from '../../common/data-store';
import { LoginDto } from './dto/login.dto';
import { jwtConfig, JwtPayload } from '../../config/jwt.config';
import { verifyPassword, hashPassword } from '../../common/password';
import { ChangePasswordDto, RegisterDto } from './dto/register.dto';
import { SubmitOrganizerApplicationDto, ReviewOrganizerApplicationDto } from './dto/organizer-application.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/constants';

@Injectable()
export class AuthService {
  private dataStore: DataStore;

  constructor(private jwtService: JwtService) {
    this.dataStore = DataStore.getInstance();
  }

  register(dto: RegisterDto): any {
    // Public registration never accepts administrator or department employee roles.
    if (![UserRole.ATTENDEE, UserRole.CLIENT, UserRole.EVENT_ORGANIZER, UserRole.EVENT_STAFF].includes(dto.userRole)) {
      throw new BadRequestException('Choose an attendee, client, organizer, or staff account');
    }
    const created = new UsersService().create(dto, UserRole.SUPER_ADMIN).data;
    const user = this.dataStore.findUserById(created.userId)!;
    const fields = ['dateOfBirth', 'gender', 'city', 'interests', 'organizationType', 'organizationName',
      'organizationAddress', 'yearsExperience', 'eventCategories', 'service', 'staffPosition',
      'staffCompany', 'staffCity', 'previousExperience'];
    user.profile = Object.fromEntries(fields.filter(field => ['string', 'number'].includes(typeof dto.profile?.[field]))
      .map(field => [field, dto.profile![field]]));
    user.status = dto.userRole === UserRole.ATTENDEE ? 'active' : 'pending';
    this.dataStore.persist();
    if (user.status === 'active') return this.login({ email: user.email, password: dto.password });
    const { password, ...safe } = user;
    return { success: true, message: 'Account created and awaiting approval', data: safe };
  }

  changePassword(dto: ChangePasswordDto, userId: string) {
    const user = this.dataStore.findUserById(userId);
    if (!user || !verifyPassword(dto.currentPassword, user.password)) throw new BadRequestException('Current password is incorrect');
    user.password = hashPassword(dto.newPassword);
    user.updatedAt = new Date();
    this.dataStore.persist();
    return { success: true, message: 'Password changed successfully' };
  }

  login(loginDto: LoginDto): any {
    const user = this.dataStore.findUserByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!verifyPassword(loginDto.password || '', user.password || '')) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new BadRequestException(`Account is ${user.status}. Please contact admin.`);
    }

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.userId,
      email: user.email,
      userRole: user.userRole,
    };

    const token = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    } as any); // Cast to any to bypass strict type checking for expiresIn

    // Do NOT return password
    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'Login successful',
      data: {
        ...safeUser,
        token, // Include JWT token
      },
    };
  }

  /**
   * Validate JWT token and extract payload
   */
  validateToken(token: string): JwtPayload {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: jwtConfig.secret,
      });
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  submitOrganizerApplication(dto: SubmitOrganizerApplicationDto): any {
    // 1. Validate Step 1 common account fields
    if (!dto.fullName || !dto.fullName.trim()) throw new BadRequestException('Full Name is required');
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email.trim())) throw new BadRequestException('A valid email address is required');
    if (!dto.mobileNumber || !/^[0-9+\s-]{10,15}$/.test(dto.mobileNumber.trim())) throw new BadRequestException('A valid 10-15 digit mobile number is required');
    if (!dto.password || dto.password.length < 6) throw new BadRequestException('Password must be at least 6 characters');
    if (!dto.emailVerified) throw new BadRequestException('Email verification must be completed before submitting');
    if (!dto.mobileVerified) throw new BadRequestException('Mobile verification must be completed before submitting');

    // 2. Prevent duplicate accounts / applications
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = this.dataStore.users.find(u => u.email.trim().toLowerCase() === normalizedEmail);
    if (existingUser) {
      throw new ConflictException('An account with this email is already registered');
    }
    const existingActiveApp = this.dataStore.organizerApplications.find(a =>
      a.email.trim().toLowerCase() === normalizedEmail && ['Pending Verification', 'Under Review', 'Additional Information Required', 'Approved'].includes(a.status),
    );
    if (existingActiveApp) {
      throw new ConflictException(`An organizer application with this email already exists (Reference: ${existingActiveApp.referenceNumber})`);
    }

    // 3. Validate Step 2 details based on organizerType
    const allowedTypes = ['Registered Company / Event Agency', 'Independent Event Organizer'];
    if (!allowedTypes.includes(dto.organizerType)) {
      throw new BadRequestException('Organizer Type must be either Registered Company / Event Agency or Independent Event Organizer');
    }

    if (dto.organizerType === 'Registered Company / Event Agency') {
      const comp = dto.companyDetails;
      if (!comp) throw new BadRequestException('Company details are required for Registered Company / Event Agency');
      if (!comp.legalCompanyName?.trim()) throw new BadRequestException('Legal Company / Agency Name is required');
      const validStructures = ['Private Limited Company', 'Public Limited Company', 'LLP', 'Partnership Firm', 'Sole Proprietorship', 'Other'];
      if (!comp.businessStructure || !validStructures.includes(comp.businessStructure)) {
        throw new BadRequestException('Valid Business Structure is required');
      }
      const requiresCert = ['Private Limited Company', 'Public Limited Company', 'LLP', 'Partnership Firm'].includes(comp.businessStructure);
      if (requiresCert && !comp.registrationNumber?.trim()) {
        throw new BadRequestException('Company Registration Number is required for this business structure');
      }
      if (!comp.address?.trim()) throw new BadRequestException('Registered Business Address is required');
      if (!comp.city?.trim()) throw new BadRequestException('City is required');
      if (!comp.state?.trim()) throw new BadRequestException('State is required');
      if (!comp.pinCode?.trim() || !/^\d{6}$/.test(comp.pinCode.trim())) throw new BadRequestException('A valid 6-digit PIN code is required');
      if (!comp.authorizedRepresentativeName?.trim()) throw new BadRequestException('Authorized Representative Name is required');
      if (!comp.representativeDesignation?.trim()) throw new BadRequestException('Representative Designation is required');
      if (requiresCert && !comp.registrationCertificateDoc?.name) {
        throw new BadRequestException('Company Registration Certificate is required for this business structure');
      }
      if (!comp.proofOfAuthorizationDoc?.name) {
        throw new BadRequestException('Proof of Authorization document is required');
      }
    } else {
      const indep = dto.independentDetails;
      if (!indep) throw new BadRequestException('Independent organizer details are required');
      if (!indep.professionalName?.trim()) throw new BadRequestException('Professional / Organizer Name is required');
      if (!indep.address?.trim()) throw new BadRequestException('Residential / Business Address is required');
      if (!indep.city?.trim()) throw new BadRequestException('City is required');
      if (!indep.state?.trim()) throw new BadRequestException('State is required');
      if (!indep.pinCode?.trim() || !/^\d{6}$/.test(indep.pinCode.trim())) throw new BadRequestException('A valid 6-digit PIN code is required');
      if (indep.yearsOfExperience === undefined || indep.yearsOfExperience === null || Number(indep.yearsOfExperience) < 0) {
        throw new BadRequestException('Years of Experience must be a number of 0 or more');
      }
      if (!Array.isArray(indep.areasOfSpecialization) || indep.areasOfSpecialization.length === 0) {
        throw new BadRequestException('At least one Area of Specialization must be selected');
      }
      if (!indep.portfolioDetails?.trim()) throw new BadRequestException('Portfolio / Previous Event Details are required');
      if (!indep.supportingEvidenceDoc?.name) {
        throw new BadRequestException('Supporting Evidence of Previous Events document is required');
      }
    }

    // 4. Validate Step 3 declaration
    if (!dto.declarationAccepted) {
      throw new BadRequestException('You must accept the verification declaration before submitting');
    }

    // 5. Create user account with status: 'pending' (cannot publish events or accept bookings until approved)
    const userId = this.dataStore.generateId('usr');
    const user: User = {
      userId,
      name: dto.fullName.trim(),
      email: normalizedEmail,
      password: hashPassword(dto.password),
      userRole: UserRole.EVENT_ORGANIZER,
      status: 'pending',
      phoneNo: dto.mobileNumber.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dataStore.users.push(user);

    // 6. Create Organizer Application record
    const applicationId = this.dataStore.generateId('app');
    const referenceNumber = this.dataStore.generateApplicationRefNumber();
    const now = new Date();

    const application: OrganizerApplication = {
      applicationId,
      referenceNumber,
      userId,
      organizerType: dto.organizerType,
      status: 'Pending Verification',
      fullName: dto.fullName.trim(),
      email: normalizedEmail,
      mobileNumber: dto.mobileNumber.trim(),
      emailVerified: true,
      mobileVerified: true,
      companyDetails: dto.organizerType === 'Registered Company / Event Agency' ? dto.companyDetails : undefined,
      independentDetails: dto.organizerType === 'Independent Event Organizer' ? dto.independentDetails : undefined,
      declarationAccepted: true,
      submittedAt: now,
      updatedAt: now,
      decisionHistory: [
        {
          decisionId: this.dataStore.generateId('dec'),
          status: 'Pending Verification',
          comments: 'Organizer application submitted successfully and queued for verification review.',
          reviewerId: 'applicant',
          reviewerName: dto.fullName.trim(),
          createdAt: now,
        },
      ],
      emailNotificationLog: [
        {
          sentAt: now,
          to: normalizedEmail,
          subject: 'EventFlow: Organizer Application Received',
          status: 'not_configured',
          message: 'Application received. Email delivery service is not configured in this environment; notification logged.',
        },
      ],
    };

    this.dataStore.organizerApplications.push(application);
    this.dataStore.persist();

    return {
      success: true,
      applicationId,
      referenceNumber,
      status: 'Pending Verification',
      submittedAt: now,
      message: 'Your Organizer Application Has Been Submitted Successfully!',
    };
  }

  getOrganizerApplicationStatus(referenceOrEmail: string): any {
    const term = String(referenceOrEmail || '').trim().toLowerCase();
    const application = this.dataStore.organizerApplications.find(
      a => a.referenceNumber.toLowerCase() === term || a.email.toLowerCase() === term,
    );
    if (!application) {
      throw new NotFoundException(`No organizer application found matching '${referenceOrEmail}'`);
    }

    // Return sanitized status information
    return {
      success: true,
      referenceNumber: application.referenceNumber,
      organizerType: application.organizerType,
      status: application.status,
      fullName: application.fullName,
      email: application.email,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
      decisionHistory: application.decisionHistory,
      companyDetails: application.companyDetails ? {
        legalCompanyName: application.companyDetails.legalCompanyName,
        businessStructure: application.companyDetails.businessStructure,
        city: application.companyDetails.city,
        state: application.companyDetails.state,
      } : undefined,
      independentDetails: application.independentDetails ? {
        professionalName: application.independentDetails.professionalName,
        yearsOfExperience: application.independentDetails.yearsOfExperience,
        areasOfSpecialization: application.independentDetails.areasOfSpecialization,
      } : undefined,
      canPublishEvents: application.status === 'Approved',
      canAcceptBookings: application.status === 'Approved',
    };
  }

  getAllOrganizerApplications(statusFilter?: string): any[] {
    let list = this.dataStore.organizerApplications;
    if (statusFilter && statusFilter.trim()) {
      list = list.filter(a => a.status.toLowerCase() === statusFilter.trim().toLowerCase());
    }
    return list.map(app => ({
      ...app,
      documents: [
        ...(app.companyDetails?.registrationCertificateDoc ? [{ type: 'Registration Certificate', name: app.companyDetails.registrationCertificateDoc.name, size: app.companyDetails.registrationCertificateDoc.size }] : []),
        ...(app.companyDetails?.proofOfAuthorizationDoc ? [{ type: 'Proof of Authorization', name: app.companyDetails.proofOfAuthorizationDoc.name, size: app.companyDetails.proofOfAuthorizationDoc.size }] : []),
        ...(app.independentDetails?.supportingEvidenceDoc ? [{ type: 'Supporting Evidence', name: app.independentDetails.supportingEvidenceDoc.name, size: app.independentDetails.supportingEvidenceDoc.size }] : []),
      ],
    }));
  }

  reviewOrganizerApplication(referenceNumber: string, dto: ReviewOrganizerApplicationDto, reviewerId: string, reviewerRole: UserRole): any {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_STAFF].includes(reviewerRole)) {
      throw new ForbiddenException('Only administrators and authorized verification reviewers can review applications');
    }

    const application = this.dataStore.organizerApplications.find(
      a => a.referenceNumber.toLowerCase() === referenceNumber.trim().toLowerCase(),
    );
    if (!application) {
      throw new NotFoundException(`Application with reference ${referenceNumber} not found`);
    }

    const validStatuses: OrganizerApplicationStatus[] = [
      'Pending Verification',
      'Under Review',
      'Additional Information Required',
      'Approved',
      'Rejected',
      'Suspended',
    ];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Invalid status: ${dto.status}`);
    }

    if (['Rejected', 'Suspended'].includes(dto.status) && !dto.reason?.trim()) {
      throw new BadRequestException(`A reason is required when setting status to ${dto.status}`);
    }

    if (dto.status === 'Additional Information Required' && !dto.additionalInfoRequest?.trim()) {
      throw new BadRequestException('Specific additional information requested must be provided');
    }

    const reviewer = this.dataStore.users.find(u => u.userId === reviewerId);
    const now = new Date();

    application.status = dto.status;
    application.updatedAt = now;

    // Decision record
    const decision = {
      decisionId: this.dataStore.generateId('dec'),
      status: dto.status,
      reason: dto.reason,
      comments: dto.comments,
      additionalInfoRequest: dto.additionalInfoRequest,
      reviewerId,
      reviewerName: reviewer?.name || 'Reviewer',
      createdAt: now,
      emailSent: false,
      emailNote: 'Email delivery is not configured in this environment; notification logged.',
    };
    application.decisionHistory.push(decision);

    // Update user and organizer entities accordingly
    const user = this.dataStore.users.find(u => u.userId === application.userId || u.email.toLowerCase() === application.email.toLowerCase());

    if (dto.status === 'Approved') {
      if (user) {
        user.status = 'active';
        user.updatedAt = now;
      }
      // Ensure organizer profile exists
      let organizer = this.dataStore.organizers.find(o => o.userId === application.userId);
      if (!organizer && user) {
        organizer = {
          organizerId: this.dataStore.generateId('org'),
          userId: user.userId,
          businessName: application.organizerType === 'Registered Company / Event Agency'
            ? application.companyDetails?.legalCompanyName
            : application.independentDetails?.professionalName,
          rating: 5.0,
          verificationStatus: 'Approved',
          createdAt: now,
        };
        this.dataStore.organizers.push(organizer);
      } else if (organizer) {
        organizer.verificationStatus = 'Approved';
      }

      application.emailNotificationLog.push({
        sentAt: now,
        to: application.email,
        subject: 'EventFlow: Organizer Application Approved! 🎉',
        status: 'not_configured',
        message: 'Approval recorded. Email delivery is not configured in this environment.',
      });
    } else if (['Rejected', 'Suspended'].includes(dto.status)) {
      if (user) {
        user.status = 'suspended';
        user.updatedAt = now;
      }
      const organizer = this.dataStore.organizers.find(o => o.userId === application.userId);
      if (organizer) {
        organizer.verificationStatus = dto.status;
      }
      application.emailNotificationLog.push({
        sentAt: now,
        to: application.email,
        subject: `EventFlow: Organizer Application ${dto.status}`,
        status: 'not_configured',
        message: `Status updated to ${dto.status}. Reason: ${dto.reason}. Email delivery is not configured in this environment.`,
      });
    } else {
      application.emailNotificationLog.push({
        sentAt: now,
        to: application.email,
        subject: `EventFlow: Organizer Application Status Update — ${dto.status}`,
        status: 'not_configured',
        message: `Status updated to ${dto.status}. Email delivery is not configured in this environment.`,
      });
    }

    this.dataStore.persist();

    return {
      success: true,
      referenceNumber: application.referenceNumber,
      status: application.status,
      updatedAt: application.updatedAt,
      emailDelivery: {
        configured: false,
        note: 'Email delivery is not configured in this environment; applicant notification logged.',
      },
      message: `Organizer application updated to ${dto.status} successfully`,
      application,
    };
  }
}


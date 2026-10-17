export interface DocumentAttachmentDto {
  name: string;
  size: number;
  type: string;
  data?: string;
}

export interface CompanyDetailsDto {
  legalCompanyName: string;
  businessStructure: string;
  registrationNumber?: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  authorizedRepresentativeName: string;
  representativeDesignation: string;
  websiteUrl?: string;
  registrationCertificateDoc?: DocumentAttachmentDto;
  proofOfAuthorizationDoc?: DocumentAttachmentDto;
}

export interface IndependentDetailsDto {
  fullName: string;
  professionalName: string;
  email: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  yearsOfExperience: number;
  areasOfSpecialization: string[];
  portfolioDetails: string;
  portfolioUrl?: string;
  supportingEvidenceDoc?: DocumentAttachmentDto;
}

export class SubmitOrganizerApplicationDto {
  fullName!: string;
  email!: string;
  mobileNumber!: string;
  password!: string;
  emailVerified!: boolean;
  mobileVerified!: boolean;
  organizerType!: 'Registered Company / Event Agency' | 'Independent Event Organizer';
  companyDetails?: CompanyDetailsDto;
  independentDetails?: IndependentDetailsDto;
  declarationAccepted!: boolean;
}

export class ReviewOrganizerApplicationDto {
  status!: 'Pending Verification' | 'Under Review' | 'Additional Information Required' | 'Approved' | 'Rejected' | 'Suspended';
  reason?: string;
  additionalInfoRequest?: string;
  comments?: string;
}

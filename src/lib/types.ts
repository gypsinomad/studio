
export type UserRole = 'admin' | 'salesExecutive' | 'viewer';

export interface User {
  id?: string;
  authUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any; // Date or Firestore Timestamp
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost';
export type LeadSource = 'manual' | 'website' | 'whatsapp' | 'metaWhatsapp' | 'facebookLeadAds' | 'instagramDm' | 'tradeShow' | 'referral' | 'b2bPortal';
export type LeadChannel = 'whatsapp' | 'facebook' | 'instagram' | 'other';
export type LeadPriority = 'hot' | 'warm' | 'cold';


export interface Lead {
  id?: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  source: LeadSource | string;
  productInterest: string;
  destinationCountry: string;
  incotermsPreference: string;
  status: LeadStatus;
  assignedUserId: string;
  createdAt: any; // Date or Firestore Timestamp
  lastContactAt?: any;
  nextFollowUpAt?: any;
  potentialValue?: number;
  // Meta and WhatsApp integration fields
  metaLeadId?: string;
  whatsappThreadId?: string;
  metaFormId?: string;
  metaPageId?: string;
  lastInboundChannel?: LeadChannel;
  aiStandardization?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    reason?: string;
    startedAt?: any;
    completedAt?: any;
    failedAt?: any;
  };
  score?: number;
  priority?: LeadPriority;
}

export type ExportOrderStage = 'leadReceived' | 'quotationSent' | 'orderConfirmed' | 'exportDocumentation' | 'shipmentReady' | 'shippedDelivered' | 'cancelled' | 'lostNoResponse';
export type ApedaStatus = "Not Applied" | "Pending" | "Approved" | "Rejected";
export type IceGateStatusUpdate = "Not Started" | "Submitted" | "Under Review" | "Approved" | "Query Raised" | "Rejected" | "Clearance Completed";
export type Incoterms = "FOB" | "CIF" | "EXW" | "CFR" | "DDP" | "FCA" | "CPT" | "CIP" | "DAP";
export type Currency = "USD" | "EUR" | "GBP" | "AED";
export type Unit = "KG" | "MT" | "Quintals";
export type PaymentTerms = 'Advance' | 'L/C' | 'D/P' | 'D/A' | 'CAD';
export type ContainerType = '20ft' | '40ft' | '40ft HC' | 'LCL';
export type ComplianceRiskLevel = 'low' | 'medium' | 'high';


export interface Milestone {
  date: any; // Firestore Timestamp
  notes?: string;
  setByUserId: string;
}

export interface ExportOrderMilestones {
  piConfirmedAt?: Milestone;
  productionCompleteAt?: Milestone;
  chaAppointedAt?: Milestone;
  containerBookingConfirmedAt?: Milestone;
  cargoHandedOverAt?: Milestone;
  onBoardAt?: Milestone;
  blReceivedAt?: Milestone;
  docsSubmittedToBankAt?: Milestone;
  paymentReceivedAt?: Milestone;
}


export interface OrderActivityLog {
  action: string;
  timestamp: any; // Firestore Timestamp
  userId: string;
  userEmail: string;
  details?: string;
}

export interface ExportOrder {
  id?: string;
  title: string;
  stage: ExportOrderStage;
  contactId: string;
  companyId: string;
  assignedUserId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  
  // Product & Quantity
  productType?: string;
  hsCode?: string;
  quantity?: number;
  unit?: Unit;
  totalValue: number;

  // Trade Terms
  incoterms: Incoterms | string;
  currency?: Currency;
  paymentTerms: PaymentTerms | string;
  
  // Indian Export Compliance
  fssaiNumber?: string;
  apedaStatus?: ApedaStatus;
  iceGateStatus?: IceGateStatusUpdate;
  phytosanitaryCert?: boolean;
  certificateOfOrigin?: boolean;
  certificateRequirements?: string[];
  
  // Logistics & Ports
  destinationCountry: string;
  destinationPort?: string;
  portOfLoading?: string;
  etd?: any; // Estimated time of departure
  eta?: any; // Estimated time of arrival
  shippingLine?: string;
  containerNumber?: string;
  containerType?: ContainerType | string;
  
  // Financial
  paymentDueDate?: any;

  // Milestones
  milestones?: ExportOrderMilestones;

  // AI Compliance
  complianceRiskLevel?: ComplianceRiskLevel;
  complianceNotes?: string;
  aiValidation?: string; // Legacy or general validation notes

  // Audit Trail
  activityLog?: OrderActivityLog[];

  // Document Summary (Derived)
  docsCompleted?: number;
  docsTotal?: number;
}


export interface LineItem {
  id?: string;
  productName: string;
  productType?: string;
  hsCode: string;
  unitPrice: number;
  quantity: number; // in kg
  boxes: number;
  packing?: string;
  grossWeightPerBox: number; // in kg
  netWeightPerBox: number; // in kg
}

export type IndustryType = 'Wholesaler' | 'Retailer' | 'Food Processor' | 'Restaurant Chain';
export type RelationshipStatus = 'New' | 'Active' | 'VIP' | 'Inactive';

export interface Company {
  id?: string;
  name: string;
  country: string;
  website?: string;
  industryType?: IndustryType;
  paymentTerms?: PaymentTerms | string;
  relationshipStatus?: RelationshipStatus;
  createdAt: any; // Date or Firestore Timestamp
  taxId?: string;
  importLicense?: string;
  preferredIncoterms?: string;
}

export type CommunicationMethod = 'email' | 'phone' | 'whatsapp';

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  jobTitle?: string;
  contactRole?: string;
  preferredCommunicationMethod?: CommunicationMethod;
  companyId?: string;
  createdAt: any; // Date or Firestore Timestamp
  decisionMaker?: boolean;
  contactSource?: string;
}

export type TaskStatus = 'open' | 'inProgress' | 'done';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: any; // Date or Firestore Timestamp
  relatedLeadId?: string;
  relatedOrderId?: string;
  assigneeId: string;
  createdAt: any; // Date or Firestore Timestamp
}

export type DocumentType = 'proformaInvoice' | 'commercialInvoice' | 'contract' | 'packingList' | 'billOfLading' | 'coo' | 'fssai' | 'apeda' | 'phytoCertificate' | 'insuranceCertificate' | 'shippingBill' | 'other';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'finalized';

export interface Document {
  id?: string;
  name: string;
  type: DocumentType;
  relatedOrderId?: string;
  relatedLeadId?: string;
  fileUrl: string; 
  status: DocumentStatus;
  expiryDate?: any; // Date or Firestore Timestamp
  uploadedBy: string;
  uploadedAt: any; // Date or Firestore Timestamp
  fileSize: number | null;
  mimeType: string | null;
  storagePath?: string;
}

export type DocumentChecklistStatus = 'notStarted' | 'inProgress' | 'completed';

export interface DocumentChecklistItem {
    id?: string;
    type: DocumentType | string;
    required: boolean;
    status: DocumentChecklistStatus;
    fileRef?: string; // ID of doc in /documents
    fileUrl?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    notes?: string;
    updatedAt: any; // Firestore Timestamp
    updatedBy: string; // user.uid
}

export interface Product {
    id?: string;
    name: string;
    description?: string;
    hsCode: string;
    basePrice: number;
    imageUrl?: string;
}

export type InteractionType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'other';
export type InteractionDirection = 'inbound' | 'outbound';

export interface Interaction {
    id?: string;
    type: InteractionType;
    direction: InteractionDirection;
    summary: string;
    timestamp: any; // Firestore Timestamp
    userId: string; // The user who logged the interaction
    leadId?: string;
    companyId?: string;
    contactId?: string;
    orderId?: string;
}


export interface Note {
    id?: string;
    content: string;
    relatedEntityType: 'Lead' | 'Contact' | 'ExportOrder';
    relatedEntityId: string;
    createdBy: string;
    createdAt: any;
}

export interface ActivityLog {
  id?: string;
  icon: string;
  title: string;
  description: string;
  timestamp: any;
}


export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  adminOnly?: boolean;
}

// AI Settings and Usage
export type AIMode = 'off' | 'safe' | 'unrestricted';

export interface AISettings {
  aiMode: AIMode;
  monthlyAiBudgetInr: number;
  maxDailyAiCalls: number;
}

export interface AIUsageStats {
  monthKey: string; // e.g., "2024-07"
  totalCallsMonth: number;
  estimatedSpendThisMonthInr: number;
  dailyCalls: { [day: string]: number }; // e.g., { "01": 10, "25": 50 }
  lastUpdatedAt: any; // Date or Firestore Timestamp
}

export type AIGuardResult<T> = {
  aiUsed: boolean;
  aiReason: 'ok' | 'aiDisabled' | 'budgetOrQuotaExceeded' | 'error';
  aiData: T | null;
}

export interface DashboardStats {
    totalLeads: number;
    activeExportOrders: number;
    leadsByStatus: Record<LeadStatus, number>;
    exportOrdersByStage: Record<ExportOrderStage, number>;
    lastUpdatedAt: any; // Date or Firestore Timestamp
}

export interface WhatsappEvent {
    id?: string;
    rawPayload: any;
    processedAt: any; // Firestore Timestamp
    eventType?: string;
    leadId?: string;
    contactId?: string;
    error?: string;
}

export interface AuditLog {
  id?: string;
  timestamp: any; // Firestore Timestamp
  userId: string;
  userEmail: string;
  collectionName: string;
  docId: string;
  action: 'create' | 'update' | 'delete';
  before?: { [key: string]: any };
  after?: { [key:string]: any };
}

// Organization Settings
export interface OrganizationSettings {
  branding: {
    brandName: string;
    logoUrl?: string;
    darkLogoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    accentColor: string;
  };
  profile: {
    legalName: string;
    displayName: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pinCode: string;
      country: string;
    };
    email: string;
    phone: string;
    website?: string;
  };
  localization: {
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  compliance: {
    pan: string;
    gstin: string;
    iec: string;
    adCode?: string;
    apedaReg?: string;
    fssaiNumber?: string;
    isVerified: boolean;
    internalNotes?: string;
    licenses: Array<{
      name: string;
      id: string;
      expiryDate: any;
    }>;
  };
}

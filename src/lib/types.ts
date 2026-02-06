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
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost';
export type LeadSource = 'manual' | 'website' | 'whatsapp' | 'metaWhatsapp' | 'facebookLeadAds' | 'instagramDm' | 'tradeShow' | 'referral' | 'b2bPortal';
export type LeadChannel = 'whatsapp' | 'facebook' | 'instagram' | 'other';


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
  // Meta and WhatsApp integration fields
  metaLeadId?: string;
  whatsappThreadId?: string;
  metaFormId?: string;
  metaPageId?: string;
  lastInboundChannel?: LeadChannel;
}

export type ExportOrderStage = 'leadReceived' | 'quotationSent' | 'orderConfirmed' | 'exportDocumentation' | 'shipmentReady' | 'shippedDelivered' | 'cancelled' | 'lostNoResponse';
export type IcegateStatus = 'Not Started' | 'Documentation Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Clearance Completed';
export type PaymentTerms = 'Advance' | 'L/C' | 'D/P' | 'D/A' | 'CAD';
export type ContainerType = '20ft' | '40ft' | '40ft HC' | 'LCL';


export interface ExportOrder {
  id?: string;
  title: string;
  stage: ExportOrderStage;
  contactId: string;
  companyId: string;
  destinationCountry: string;
  destinationPort?: string;
  incoterms: string;
  totalValue: number;
  paymentTerms: PaymentTerms | string;
  assignedUserId: string;
  createdAt: any; // Date or Firestore Timestamp
  aiValidation?: string;
  expectedShipmentDate?: any;
  portOfLoading?: string;
  containerType?: ContainerType | string;
  fssaiLicenseNumber?: string;
  icegateStatus?: IcegateStatus;
  certificateRequirements?: string[];
  productType?: string;
  hsCode?: string;
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

export type DocumentType = 'proformaInvoice' | 'contract' | 'packingList' | 'billOfLading' | 'coo' | 'fssai' | 'apeda' | 'phytoCertificate' | 'shippingBill' | 'other';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified';

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
}

export interface Product {
    id?: string;
    name: string;
    description?: string;
    hsCode: string;
    basePrice: number;
    imageUrl?: string;
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

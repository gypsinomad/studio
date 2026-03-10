export type UserRole = 'admin' | 'salesExecutive' | 'viewer';

export interface User {
  id?: string;
  authUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any;
  avatarUrl?: string;
  orgId: string;
  uid: string;
}

export type ConversationType = 'channel' | 'shipment' | 'customer' | 'direct';

export interface Conversation {
  id?: string;
  title: string;
  type: ConversationType;
  participants: string[];
  linkedId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: any;
  };
  updatedAt: any;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: any[];
  tags?: string[];
  isSystem?: boolean;
  taskId?: string;
  meetingId?: string;
  createdAt: any;
}

export interface Meeting {
  id?: string;
  title: string;
  description?: string;
  organizerId: string;
  participants: string[];
  startAt: any;
  endAt: any;
  location?: string;
  conversationId?: string;
  createdAt: any;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: any;
}

export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  fireAt: any;
  linkedId?: string;
  createdAt: any;
}

// Existing types preserved
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'converted' | 'lost';
export type LeadSource = 'manual' | 'website' | 'whatsapp' | 'facebookLeadAds' | 'tradeShow' | 'referral';
export interface Lead {
  id?: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource | string;
  createdAt: any;
  assignedUserId: string;
  productInterest: string;
  destinationCountry: string;
  incotermsPreference: string;
  aiStandardization?: any;
  priority?: 'hot' | 'warm' | 'cold';
  score?: number;
  nextFollowUpAt?: any;
  lastContactAt?: any;
  whatsappNumber?: string;
  whatsappThreadId?: string;
}

export type ExportOrderStage = 'leadReceived' | 'quotationSent' | 'orderConfirmed' | 'exportDocumentation' | 'shipmentReady' | 'shippedDelivered' | 'cancelled' | 'lostNoResponse';
export interface ExportOrder {
  id?: string;
  title: string;
  stage: ExportOrderStage;
  totalValue: number;
  destinationCountry: string;
  createdAt: any;
  assignedUserId: string;
  companyId: string;
  contactId: string;
  currency?: string;
  docsCompleted?: number;
  docsTotal?: number;
  iceGateStatus?: string;
  etd?: any;
  eta?: any;
  paymentDueDate?: any;
  complianceRiskLevel?: string;
  complianceNotes?: string;
  activityLog?: any[];
  milestones?: any;
  incoterms: string;
  paymentTerms: string;
  productType?: string;
  hsCode?: string;
  containerType?: string;
  fssaiNumber?: string;
  certificateRequirements?: string[];
}

export type TaskStatus = 'open' | 'inProgress' | 'done';
export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: any;
  assigneeId: string;
  createdAt: any;
  relatedLeadId?: string;
  relatedOrderId?: string;
}

export type DocumentType = 'proformaInvoice' | 'commercialInvoice' | 'contract' | 'packingList' | 'billOfLading' | 'coo' | 'fssai' | 'apeda' | 'phytoCertificate' | 'insuranceCertificate' | 'shippingBill' | 'other';
export interface Document {
  id?: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  status: 'pending' | 'uploaded' | 'verified' | 'finalized';
  uploadedAt: any;
  uploadedBy: string;
  relatedOrderId?: string;
  relatedLeadId?: string;
}

export interface DocumentChecklistItem {
  id?: string;
  type: string;
  required: boolean;
  status: 'notStarted' | 'inProgress' | 'completed';
  fileRef?: string;
  fileUrl?: string | null;
  mimeType?: string | null;
}

export interface OrganizationSettings {
  branding: {
    brandName: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
  };
  profile: {
    legalName: string;
    displayName: string;
    address: { line1: string; line2?: string; city: string; state: string; pinCode: string; country: string; };
    email: string;
    phone: string;
    website?: string;
  };
  compliance: {
    pan: string;
    gstin: string;
    iec: string;
    adCode?: string;
    apedaReg?: string;
    fssaiNumber?: string;
    isVerified: boolean;
    licenses: any[];
  };
}

export interface AIUsageStats {
  monthKey: string;
  totalCallsMonth: number;
  estimatedSpendThisMonthInr: number;
  dailyCalls: Record<string, number>;
}

export interface AISettings {
  aiMode: 'off' | 'safe' | 'unrestricted';
  monthlyAiBudgetInr: number;
  maxDailyAiCalls: number;
}

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  collectionName: string;
  docId: string;
  timestamp: any;
  before?: any;
  after?: any;
}

export interface ActivityLog {
  id?: string;
  icon: string;
  title: string;
  description: string;
  timestamp: any;
}

// Debug Suite Types
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface DebugLog {
  id: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface AITrace {
  id: string;
  flowName: string;
  status: 'started' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  timestamp: Date;
}
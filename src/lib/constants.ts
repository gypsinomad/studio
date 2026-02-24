import {
  LayoutDashboard,
  Sprout,
  Ship,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  Building,
  History,
  Kanban,
  Box,
  Calculator,
  CreditCard,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Sprout,
  },
  {
    title: 'Lead Pipeline',
    href: '/leads/pipeline',
    icon: Kanban,
  },
  {
    title: 'Export Orders',
    href: '/export-orders',
    icon: Ship,
  },
  {
    title: 'Customers',
    href: '/companies',
    icon: Building,
  },
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Export Docs',
    icon: FileText,
    isGroup: true,
    items: [
      { title: 'Overview', href: '/export-docs', icon: LayoutDashboard },
      { title: 'Item Register', href: '/export-docs/items', icon: Box },
      { title: 'Order Analyzer', href: '/export-docs/analyzer', icon: Calculator },
      { title: 'Invoices & Docs', href: '/export-docs/invoices', icon: FileText },
      { title: 'Buyers & Agents', href: '/export-docs/buyers', icon: Users },
      { title: 'Payments', href: '/export-docs/payments', icon: CreditCard },
      { title: 'Reports', href: '/export-docs/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Activity Log',
    href: '/activity-log',
    icon: History,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Admin Settings',
    href: '/users',
    icon: Settings,
    adminOnly: true,
  },
];

export const EXPORT_ORDER_STAGES = ['leadReceived', 'quotationSent', 'orderConfirmed', 'exportDocumentation', 'shipmentReady', 'shippedDelivered', 'cancelled', 'lostNoResponse'];
export const PRODUCT_TYPES = ["Cardamom", "Black Pepper", "Turmeric", "Cumin Seeds", "Coriander Seeds", "Red Chili", "Ginger (Dried)", "Cloves", "Cinnamon", "Nutmeg", "Star Anise", "Fenugreek Seeds", "Mustard Seeds", "Fennel Seeds", "Curry Leaves (Dried)", "Tamarind", "Bay Leaves", "Saffron", "Vanilla", "White Pepper"];
export const INCOTERMS = ["FOB", "CIF", "EXW", "CFR", "DDP", "FCA", "CPT", "CIP", "DAP"];
export const CURRENCIES = ["USD", "EUR", "GBP", "AED", "INR"];
export const UNITS = ["KG", "MT", "Quintals", "Bags", "Cartons"];
export const ICEGATE_STATUSES = ["Not Started", "Submitted", "Under Review", "Approved", "Query Raised", "Rejected", "Clearance Completed"];
export const APEDA_STATUSES = ["Not Applied", "Pending", "Approved", "Rejected"];
export const INDUSTRY_TYPES = ["Wholesaler", "Retailer", "Food Processor", "Restaurant Chain"];
export const RELATIONSHIP_STATUSES = ["New", "Active", "VIP", "Inactive"];
export const COMMUNICATION_METHODS = ["email", "phone", "whatsapp"];
export const DOCUMENT_TYPES = ["proformaInvoice", "commercialInvoice", "contract", "packingList", "billOfLading", "coo", "fssai", "apeda", "phytoCertificate", "insuranceCertificate", "shippingBill", "other"];

export const DEFAULT_DOCUMENT_CHECKLIST = [
  { type: 'proformaInvoice', required: true, status: 'notStarted' },
  { type: 'commercialInvoice', required: true, status: 'notStarted' },
  { type: 'packingList', required: true, status: 'notStarted' },
  { type: 'billOfLading', required: true, status: 'notStarted' },
  { type: 'certificateOfOrigin', required: true, status: 'notStarted' },
  { type: 'phytoCertificate', required: false, status: 'notStarted' },
  { type: 'insuranceCertificate', required: false, status: 'notStarted' },
  { type: 'shippingBill', required: true, status: 'notStarted' },
];

export const CATEGORIES = ["Whole Spices", "Ground Spices", "Rice & Grains", "Sweeteners", "Organic Vegetables"];
export const SUBCATEGORIES: Record<string, string[]> = {
  "Whole Spices": ["Pepper", "Cardamom", "Cloves", "Cinnamon"],
  "Ground Spices": ["Turmeric Powder", "Chili Powder", "Ginger Powder"],
  "Rice & Grains": ["Basmati Rice", "Ponni Rice", "GI Rice"],
  "Sweeteners": ["Jaggery", "Honey", "Sugar"],
  "Organic Vegetables": ["Ginger", "Turmeric", "Onion"]
};

export const HSN_CODES = [
  { code: '0904', label: 'Pepper' },
  { code: '0908', label: 'Cardamom' },
  { code: '0910', label: 'Turmeric/Ginger/Spices' },
  { code: '0901', label: 'Coffee' },
  { code: '0902', label: 'Tea' },
  { code: '1006', label: 'Rice' },
  { code: '1701', label: 'Jaggery/Sugar' },
  { code: '0409', label: 'Honey' },
];
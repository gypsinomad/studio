import type { NavItem, ExportOrderStage, IndustryType, RelationshipStatus, PaymentTerms, ContainerType, CommunicationMethod } from '@/lib/types';
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
} from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
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

export const EXPORT_ORDER_STAGES: ExportOrderStage[] = ['leadReceived', 'quotationSent', 'orderConfirmed', 'exportDocumentation', 'shipmentReady', 'shippedDelivered', 'cancelled', 'lostNoResponse'];

export const PRODUCT_TYPES = [ "Cardamom", "Black Pepper", "Turmeric", "Cumin Seeds", "Coriander Seeds", "Red Chili", "Ginger (Dried)", "Cloves", "Cinnamon", "Nutmeg", "Star Anise", "Fenugreek Seeds", "Mustard Seeds", "Fennel Seeds", "Curry Leaves (Dried)", "Tamarind", "Bay Leaves", "Saffron", "Vanilla", "White Pepper" ];

export const DESTINATION_COUNTRIES = [ "United States", "United Kingdom", "Germany", "France", "Netherlands", "Belgium", "Italy", "Spain", "Canada", "Australia", "UAE", "Saudi Arabia", "Singapore", "Malaysia", "Japan", "South Korea", "China", "Russia", "Brazil", "South Africa" ];

export const INCOTERMS = [ "FOB (Free On Board)", "CIF (Cost, Insurance & Freight)", "CFR (Cost & Freight)", "EXW (Ex Works)", "FCA (Free Carrier)", "CPT (Carriage Paid To)", "CIP (Carriage and Insurance Paid)", "DAP (Delivered At Place)", "DDP (Delivered Duty Paid)" ];

export const ICEGATE_STATUSES = [ "Not Started", "Documentation Submitted", "Under Review", "Approved", "Rejected", "Clearance Completed" ];

export const CERTIFICATE_REQUIREMENTS = ["FSSAI", "Organic", "Phytosanitary", "COO"];

export const PAYMENT_TERMS: PaymentTerms[] = ["Advance", "L/C", "D/P", "D/A", "CAD"];

export const CONTAINER_TYPES: ContainerType[] = ["20ft", "40ft", "40ft HC", "LCL"];

export const INDUSTRY_TYPES: IndustryType[] = ["Wholesaler", "Retailer", "Food Processor", "Restaurant Chain"];

export const RELATIONSHIP_STATUSES: RelationshipStatus[] = ["New", "Active", "VIP", "Inactive"];

export const COMMUNICATION_METHODS: CommunicationMethod[] = ["email", "phone", "whatsapp"];

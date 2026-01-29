# **App Name**: SpiceRoute CRM

## Core Features:

- Authentication: Secure user authentication using Firebase Auth with email/password.
- Role-Based Access Control: Implement role-based access control (admin, salesExecutive) to restrict access to modules and data based on user role stored in Firestore. Make the access extensible to more roles later.
- Dashboard: Display key metrics such as total leads, active export orders, leads by status, and export orders by stage using data from Firestore.
- Lead Management: Create, read, update, and delete leads. Filter leads by source and destination country. SalesExecutives only see their own leads, while admins see all.
- Export Order Management: Create, read, update, and delete export orders. SalesExecutives only see their own export orders, while admins see all. The LLM-powered "tool" feature will monitor industry regulations to check the entered data in each export order.
- Company and Contact Management: Manage company and contact information, linking contacts to companies and displaying related export orders.
- Task Management: Create and manage tasks, linking them to leads or export orders. Filter tasks by assignee, status, and due date.
- Document Management: Manage documents, associating them with leads or export orders. Show document type, status, and expiry date. Placeholder for file upload integration.
- Reporting: Generate basic reports on leads by source and export orders by stage.
- User Management: Admin-only module to view user information (email, role, isActive).
- Firestore Trigger: Cloud Function triggered when a new lead is created to automatically create a follow-up task.
- Facebook Lead Ads Webhooks: HTTP Cloud Function to receive Facebook Lead Ads webhooks and insert the data into the leads collection. The LLM-powered tool will validate and standardize the received lead data before insertion.

## Style Guidelines:

- Primary color: Saffron (#FFB347) to reflect the spice trade, bringing a sense of warmth and energy. It aligns with the rich cultural heritage and vibrant commerce associated with spices.
- Background color: Light beige (#F5F5DC) to provide a neutral and clean backdrop that enhances readability and complements the primary color without overpowering the interface.
- Accent color: Terracotta (#E07A5F) to highlight key actions and interactive elements, drawing inspiration from the earth tones and natural pigments traditionally used in spice trading regions.
- Body font: 'PT Sans', a humanist sans-serif to ensure readability and a modern aesthetic for the CRM's main content.
- Headline font: 'Playfair', a modern serif with an elegant and high-end feel, will bring character to headings while providing an easy reading experience. Note: currently only Google Fonts are supported.
- Use spice-related and globally understood icons to represent different modules and actions (e.g., a chili for leads, a ship for export orders). Simple line icons are best.
- Use a clean, intuitive layout with a left sidebar navigation for main modules and a top navigation for user information and actions.
- Subtle transitions and animations to enhance user experience (e.g., loading states, feedback on form submissions).
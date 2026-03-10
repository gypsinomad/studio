export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'lead' | 'followup' | 'proposal' | 'invoice' | 'custom';
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

export interface EmailSettings {
  provider: 'gmail' | 'outlook' | 'sendgrid';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  signature?: string;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to SpiceRoute CRM',
    body: `Hi {{firstName}},

Thank you for your interest in our products! We're excited to help you with your spice export needs.

Our team will review your inquiry and get back to you within 24 hours.

Best regards,
{{companyName}} Team`,
    variables: ['firstName', 'companyName'],
    category: 'lead'
  },
  {
    id: 'followup',
    name: 'Follow Up',
    subject: 'Following up on your inquiry',
    body: `Hi {{firstName}},

I hope this email finds you well. I wanted to follow up on your recent inquiry about {{productInterest}}.

Do you have any questions or would you like to schedule a call to discuss further?

Best regards,
{{senderName}}`,
    variables: ['firstName', 'productInterest', 'senderName'],
    category: 'followup'
  },
  {
    id: 'proposal',
    name: 'Proposal',
    subject: 'Proposal for {{productName}}',
    body: `Hi {{firstName}},

Please find attached our detailed proposal for {{productName}}.

Key highlights:
- Quantity: {{quantity}} {{unit}}
- Price: ${{price}} per {{unit}}
- Delivery: {{deliveryTime}}
- Payment Terms: {{paymentTerms}}

Please review and let us know if you have any questions.

Best regards,
{{senderName}}`,
    variables: ['firstName', 'productName', 'quantity', 'unit', 'price', 'deliveryTime', 'paymentTerms', 'senderName'],
    category: 'proposal'
  }
];

export const sendEmail = async (
  to: string[],
  subject: string,
  body: string,
  settings: EmailSettings
): Promise<boolean> => {
  try {
    // This would integrate with actual email service
    // For now, simulate email sending
    console.log('Sending email:', { to, subject, body });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendBulkEmail = async (
  campaign: EmailCampaign,
  settings: EmailSettings,
  template: EmailTemplate,
  variables: Record<string, any>[]
): Promise<boolean> => {
  try {
    const batchSize = 50; // Send in batches to avoid rate limits
    
    for (let i = 0; i < variables.length; i += batchSize) {
      const batch = variables.slice(i, i + batchSize);
      
      const promises = batch.map(async (variableSet) => {
        const personalizedSubject = replaceVariables(template.subject, variableSet);
        const personalizedBody = replaceVariables(template.body, variableSet);
        
        return sendEmail([variableSet.email], personalizedSubject, personalizedBody, settings);
      });
      
      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < variables.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send bulk email:', error);
    return false;
  }
};

export const replaceVariables = (text: string, variables: Record<string, any>): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
};

export const trackEmailOpen = (emailId: string): void => {
  // This would typically use a tracking pixel
  console.log('Email opened:', emailId);
};

export const trackEmailClick = (emailId: string, link: string): void => {
  // This would typically use a redirect link
  console.log('Email clicked:', emailId, link);
};

'use server';

/**
 * @fileOverview A Genkit flow to validate and standardize lead data received from Facebook Lead Ads webhooks.
 *
 * - validateAndStandardizeLeadData - A function that handles the lead data validation and standardization process.
 * - ValidateAndStandardizeLeadDataInput - The input type for the validateAndStandardizeLeadData function.
 * - ValidateAndStandardizeLeadDataOutput - The return type for the validateAndStandardizeLeadData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateAndStandardizeLeadDataInputSchema = z.object({
  fullName: z.string().describe('The full name of the lead.'),
  companyName: z.string().describe('The company name of the lead.'),
  email: z.string().email().describe('The email address of the lead.'),
  phone: z.string().describe('The phone number of the lead.'),
  whatsappNumber: z.string().optional().describe('The WhatsApp number of the lead, if available.'),
  source: z.string().describe('The source of the lead (e.g., Facebook Lead Ads).'),
  productInterest: z.string().describe('The product the lead is interested in.'),
  destinationCountry: z.string().describe('The destination country the lead is interested in.'),
  incotermsPreference: z.string().describe('The preferred Incoterms for the lead.'),
});

export type ValidateAndStandardizeLeadDataInput = z.infer<typeof ValidateAndStandardizeLeadDataInputSchema>;

const ValidateAndStandardizeLeadDataOutputSchema = z.object({
  fullName: z.string().describe('The standardized full name of the lead.'),
  companyName: z.string().describe('The standardized company name of the lead.'),
  email: z.string().email().describe('The standardized email address of the lead.'),
  phone: z.string().describe('The standardized phone number of the lead (E.164 format).'),
  whatsappNumber: z.string().optional().describe('The standardized WhatsApp number of the lead, if available (E.164 format).'),
  destinationCountry: z.string().describe('The standardized destination country name (e.g., using ISO 3166-1 alpha-2 code).'),
});

export type ValidateAndStandardizeLeadDataOutput = z.infer<typeof ValidateAndStandardizeLeadDataOutputSchema>;

export async function validateAndStandardizeLeadData(
  input: ValidateAndStandardizeLeadDataInput
): Promise<ValidateAndStandardizeLeadDataOutput> {
  return validateAndStandardizeLeadDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAndStandardizeLeadDataPrompt',
  input: {schema: ValidateAndStandardizeLeadDataInputSchema},
  output: {schema: ValidateAndStandardizeLeadDataOutputSchema},
  prompt: `You are an expert data standardization tool. You will receive lead data from Facebook Lead Ads and will standardize it.

  Specifically, you will:
  - Ensure the full name is properly formatted.
  - Ensure the company name is properly formatted.
  - Verify the email address is valid.
  - Standardize the phone number to E.164 format.
  - Standardize the WhatsApp number to E.164 format, if provided.
  - Standardize the destination country name using ISO 3166-1 alpha-2 code.

  Here is the lead data:

  Full Name: {{{fullName}}}
  Company Name: {{{companyName}}}
  Email: {{{email}}}
  Phone: {{{phone}}}
  WhatsApp Number: {{{whatsappNumber}}}
  Destination Country: {{{destinationCountry}}}

  Return the standardized data in JSON format.
  Make sure the country name uses the ISO 3166-1 alpha-2 code.
  If the WhatsApp number is not provided, return null for that field.
  `,
});

const validateAndStandardizeLeadDataFlow = ai.defineFlow(
  {
    name: 'validateAndStandardizeLeadDataFlow',
    inputSchema: ValidateAndStandardizeLeadDataInputSchema,
    outputSchema: ValidateAndStandardizeLeadDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

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
import { checkAiBudgetAndProceed } from '@/lib/ai/guards';
import type { AIGuardResult } from '@/lib/types';

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
  productInterest: z.string().describe('The inferred or standardized product interest.'),
});

export type ValidateAndStandardizeLeadDataOutput = z.infer<typeof ValidateAndStandardizeLeadDataOutputSchema>;

export async function validateAndStandardizeLeadData(
  input: ValidateAndStandardizeLeadDataInput
): Promise<AIGuardResult<ValidateAndStandardizeLeadDataOutput>> {
  const guard = await checkAiBudgetAndProceed();
  if (!guard.canProceed) {
      return { aiUsed: false, aiReason: guard.reason, aiData: null };
  }

  try {
      const aiData = await validateAndStandardizeLeadDataFlow(input);
      return { aiUsed: true, aiReason: 'ok', aiData };
  } catch (error) {
      console.error("Genkit Flow Error in validateAndStandardizeLeadData:", error instanceof Error ? error.message : error);
      return { aiUsed: false, aiReason: 'error', aiData: null };
  }
}

const prompt = ai.definePrompt({
  name: 'validateAndStandardizeLeadDataPrompt',
  input: {schema: ValidateAndStandardizeLeadDataInputSchema},
  output: {schema: ValidateAndStandardizeLeadDataOutputSchema},
  prompt: `You are an expert data standardization tool for a spice export CRM. You will receive lead data from Facebook Lead Ads and will standardize it.

  Specifically, you will:
  - Ensure the full name and company name are properly formatted (e.g., proper capitalization, trim whitespace).
  - Verify the email address is valid.
  - Standardize the phone number to E.164 format.
  - Standardize the WhatsApp number to E.164 format, if provided.
  - Standardize the destination country name to its full name (e.g., 'USA' becomes 'United States').
  - Infer and standardize the product interest based on the input. If it's a generic term, make it more specific if possible (e.g., 'Pepper' becomes 'Black Pepper').

  Here is the lead data:

  Full Name: {{{fullName}}}
  Company Name: {{{companyName}}}
  Email: {{{email}}}
  Phone: {{{phone}}}
  WhatsApp Number: {{{whatsappNumber}}}
  Product Interest: {{{productInterest}}}
  Destination Country: {{{destinationCountry}}}

  Return the standardized data in a compact JSON object.
  If the WhatsApp number is not provided, do not include the field in the output.
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

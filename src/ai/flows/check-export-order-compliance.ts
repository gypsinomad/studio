// src/ai/flows/check-export-order-compliance.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow to check export order data against industry regulations using Gemini.
 *
 * - checkExportOrderCompliance - Checks export order compliance and returns AI validation suggestions.
 * - CheckExportOrderComplianceInput - The input type for the checkExportOrderCompliance function.
 * - CheckExportOrderComplianceOutput - The return type for the checkExportOrderCompliance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { checkAiBudgetAndProceed } from '@/lib/ai/guards';
import type { AIGuardResult } from '@/lib/types';


const CheckExportOrderComplianceInputSchema = z.object({
  title: z.string().describe('Title of the export order.'),
  stage: z.string().describe('Current stage of the export order.'),
  companyId: z.string().describe('ID of the company involved.'),
  contactId: z.string().describe('ID of the contact person.'),
  productType: z.string().describe('Type of product being exported.'),
  destinationCountry: z.string().describe('Destination country for the export.'),
  incoterms: z.string().describe('Incoterms for the export order.'),
  hsCode: z.string().describe('Harmonized System code for the product.'),
  quantity: z.number().describe('Quantity of the product being exported.'),
  unitPrice: z.number().describe('Unit price of the product.'),
  paymentTerms: z.string().describe('Payment terms for the export order.'),
  containerType: z.string().describe('Type of container used for shipping.'),
  portOfLoading: z.string().describe('Port of loading for the shipment.'),
  expectedShipmentDate: z.string().describe('Expected shipment date.'),
  fssaiLicenseNumber: z.string().describe('FSSAI license number, if applicable.'),
  icegateStatus: z.string().describe('ICEGATE status of the export.'),
  certificateRequirements: z.array(z.string()).describe('Required certificates for the export.'),
});
export type CheckExportOrderComplianceInput = z.infer<typeof CheckExportOrderComplianceInputSchema>;

const CheckExportOrderComplianceOutputSchema = z.object({
  aiValidation: z.string().describe('AI-generated suggestions for compliance, based on the export order data.'),
});
export type CheckExportOrderComplianceOutput = z.infer<typeof CheckExportOrderComplianceOutputSchema>;

export async function checkExportOrderCompliance(
  input: CheckExportOrderComplianceInput
): Promise<AIGuardResult<CheckExportOrderComplianceOutput>> {
  const guard = await checkAiBudgetAndProceed();

  if (!guard.canProceed) {
    return { aiUsed: false, aiReason: guard.reason, aiData: null };
  }

  try {
    const aiData = await checkExportOrderComplianceFlow(input);
    return { aiUsed: true, aiReason: 'ok', aiData };
  } catch (error) {
    console.error("Genkit Flow Error in checkExportOrderCompliance:", error instanceof Error ? error.message : error);
    return { aiUsed: false, aiReason: 'error', aiData: null };
  }
}

const compliancePrompt = ai.definePrompt({
  name: 'compliancePrompt',
  input: {schema: CheckExportOrderComplianceInputSchema},
  output: {schema: CheckExportOrderComplianceOutputSchema},
  prompt: `You are an AI assistant specialized in validating export orders against industry regulations.
  Review the following export order details and provide suggestions for compliance in the aiValidation field.
  Focus on potential issues related to product type, destination country, incoterms, HS code, and certificate requirements.
  Respond with a compact JSON object.

  Export Order Details:
  Title: {{{title}}}
  Stage: {{{stage}}}
  Company ID: {{{companyId}}}
  Contact ID: {{{contactId}}}
  Product Type: {{{productType}}}
  Destination Country: {{{destinationCountry}}}
  Incoterms: {{{incoterms}}}
  HS Code: {{{hsCode}}}
  Quantity: {{{quantity}}}
  Unit Price: {{{unitPrice}}}
  Payment Terms: {{{paymentTerms}}}
  Container Type: {{{containerType}}}
  Port of Loading: {{{portOfLoading}}}
  Expected Shipment Date: {{{expectedShipmentDate}}}
  FSSAI License Number: {{{fssaiLicenseNumber}}}
  ICEGATE Status: {{{icegateStatus}}}
  Certificate Requirements: {{#each certificateRequirements}}{{{this}}}, {{/each}}

  Provide a concise summary of potential compliance issues and suggestions.`,
});

const checkExportOrderComplianceFlow = ai.defineFlow(
  {
    name: 'checkExportOrderComplianceFlow',
    inputSchema: CheckExportOrderComplianceInputSchema,
    outputSchema: CheckExportOrderComplianceOutputSchema,
  },
  async input => {
    const {output} = await compliancePrompt(input);
    return output!;
  }
);

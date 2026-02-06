'use server';
/**
 * @fileOverview A Genkit flow to parse a buyer's product list from an image
 * and generate a structured quotation with line items.
 *
 * - generateQuotationFromImage - A function that handles the quotation generation.
 * - GenerateQuotationInput - The input type for the function.
 * - GenerateQuotationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { LineItem } from '@/lib/types';

const GenerateQuotationInputSchema = z.object({
  buyerListImage: z
    .string()
    .describe(
      "A photo of the buyer's product list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    totalWeightKg: z.number().describe("The total target weight of the shipment in kilograms."),
    grossWeightPerBoxKg: z.number().describe("The gross weight of a single packed box in kilograms."),
});
export type GenerateQuotationInput = z.infer<typeof GenerateQuotationInputSchema>;

const LineItemSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  quantity: z.number().describe('The quantity of the product in kg. Default to 0.'),
  boxes: z.number().describe('The calculated number of boxes for this item. Default to 0.'),
  grossWeightPerBox: z.number().describe('The gross weight per box in kg. Default to 5kg.'),
  netWeightPerBox: z.number().describe('The net produce weight per box in kg. Default to 4.5kg'),
});

const GenerateQuotationOutputSchema = z.object({
    lineItems: z.array(LineItemSchema).describe("The structured list of line items parsed from the image."),
    notes: z.string().describe("Any notes or clarifications about the parsed list, such as unrecognized items."),
});
export type GenerateQuotationOutput = z.infer<typeof GenerateQuotationOutputSchema>;


export async function generateQuotationFromImage(input: GenerateQuotationInput): Promise<GenerateQuotationOutput> {
  return generateQuotationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuotationPrompt',
  input: {schema: GenerateQuotationInputSchema},
  output: {schema: GenerateQuotationOutputSchema},
  prompt: `You are an expert OCR and data entry assistant for a vegetable export company.
Your task is to analyze the provided image of a buyer's product list and convert it into a structured JSON array of line items.

Here is the image of the list:
{{media url=buyerListImage}}

Instructions:
1. Parse every single item from the list in the image.
2. For each item, create a JSON object with the 'productName'. Clean up any extraneous text like "(Pp 100Gm X 30)".
3. For all other numeric fields ('quantity', 'boxes'), set their default value to 0.
4. Set 'grossWeightPerBox' to the value of {{{grossWeightPerBoxKg}}} and 'netWeightPerBox' to its default of 4.5.
5. If you cannot recognize an item or there's an ambiguity, add a note about it in the 'notes' field of the final output.
6. Return a single JSON object with two keys: 'lineItems' (an array of the products) and 'notes'.`,
});

const generateQuotationFlow = ai.defineFlow(
  {
    name: 'generateQuotationFlow',
    inputSchema: GenerateQuotationInputSchema,
    outputSchema: GenerateQuotationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

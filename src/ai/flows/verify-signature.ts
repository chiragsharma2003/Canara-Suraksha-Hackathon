'use server';
/**
 * @fileOverview An AI flow to verify a user's signature.
 *
 * - verifySignature - A function that analyzes a signature image for authenticity.
 * - VerifySignatureInput - The input type for the verifySignature function.
 * - VerifySignatureOutput - The return type for the verifySignature function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifySignatureInputSchema = z.object({
  signatureDataUri: z.string().describe(
    "A digital signature captured from a canvas, as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
});
export type VerifySignatureInput = z.infer<typeof VerifySignatureInputSchema>;

const VerifySignatureOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the signature is deemed authentic and valid.'),
  confidence: z.number().describe('A confidence score (0.0 to 1.0) for the verification decision.'),
  reason: z.string().describe('A brief explanation of the analysis and factors considered.'),
});
export type VerifySignatureOutput = z.infer<typeof VerifySignatureOutputSchema>;

export async function verifySignature(input: VerifySignatureInput): Promise<VerifySignatureOutput> {
  return verifySignatureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifySignaturePrompt',
  input: { schema: VerifySignatureInputSchema },
  output: { schema: VerifySignatureOutputSchema },
  prompt: `You are a forensic document examiner specializing in digital signature verification. Your task is to analyze the provided signature image and determine its authenticity.

Signature Image: {{media url=signatureDataUri}}

Analyze the signature based on the following criteria:
1.  **Stroke Quality**: Examine the flow and continuity of the lines. Are they smooth and confident, or do they appear hesitant, shaky, or broken? Unnatural breaks in the stroke are a major red flag.
2.  **Consistency**: While not compared to a reference signature in this case, assess the internal consistency of the signature itself. Does it look like a practiced, natural signature?
3.  **Authenticity**: Based on the stroke quality and overall appearance, determine if it appears to be a genuine signature or a crude forgery/imitation.

Based on your analysis, provide a boolean 'isValid' determination, a 'confidence' score, and a concise 'reason' for your findings. The reason should be clear and understandable to a non-expert. For example, if you detect a broken flow, mention it as a key factor in your decision.`,
});

const verifySignatureFlow = ai.defineFlow(
  {
    name: 'verifySignatureFlow',
    inputSchema: VerifySignatureInputSchema,
    outputSchema: VerifySignatureOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

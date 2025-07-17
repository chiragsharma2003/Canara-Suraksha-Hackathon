'use server';

/**
 * @fileOverview This file defines a Genkit flow to calculate a risk score based on behavioral data.
 *
 * - calculateRiskScore - A function that calculates the risk score for a given session.
 * - CalculateRiskScoreInput - The input type for the calculateRiskScore function.
 * - CalculateRiskScoreOutput - The return type for the calculateRiskScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateRiskScoreInputSchema = z.object({
  tapPressure: z.array(z.number()).describe('Array of tap pressure values (normalized 0-1) for the current session.'),
  swipeGestures: z.array(z.object({angle: z.number(), speed: z.number()})).describe('Array of swipe gestures with angle and speed for the current session.'),
  keyHoldTimes: z.array(z.number()).describe('Array of key hold times (in seconds) for the current session.'),
  screenNavigation: z.array(z.string()).describe('Array of screen navigation steps.'),
  ip: z.string().describe('IP address of the user.'),
  gyroVariance: z.number().describe('Variance of gyroscope data (normalized 0-1, higher is more erratic) for the current session.'),
  sessionDuration: z.number().describe('Duration of the session in seconds.'),
  pastedCredentials: z.boolean().describe('Whether credentials were pasted.'),
  baselineKeyHoldTimes: z.array(z.number()).optional().describe("User's baseline key hold times from registration for comparison."),
});
export type CalculateRiskScoreInput = z.infer<typeof CalculateRiskScoreInputSchema>;

const CalculateRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The calculated risk score for the session, from 0.0 (low) to 1.0 (high).'),
  reasons: z.array(z.string()).describe('Reasons contributing to the risk score.'),
});
export type CalculateRiskScoreOutput = z.infer<typeof CalculateRiskScoreOutputSchema>;

export async function calculateRiskScore(input: CalculateRiskScoreInput): Promise<CalculateRiskScoreOutput> {
  return calculateRiskScoreFlow(input);
}

const calculateRiskScorePrompt = ai.definePrompt({
  name: 'calculateRiskScorePrompt',
  input: {schema: CalculateRiskScoreInputSchema},
  output: {schema: CalculateRiskScoreOutputSchema},
  prompt: `You are a security analyst tasked with calculating a risk score for a user session based on behavioral biometrics.
  Evaluate the following session data and provide a risk score between 0.0 and 1.0, and a list of reasons for the score.

  A user's baseline key hold times are provided if available. Significant deviations from this baseline are a major risk factor.
  - Baseline Key Hold Times: {{#if baselineKeyHoldTimes}}{{{JSON.stringify baselineKeyHoldTimes}}}{{else}}Not Available{{/if}}

  Analyze the current session data for anomalies. High-risk indicators include:
  - Pasting credentials ({{{pastedCredentials}}}). This is a very strong indicator of fraud.
  - High gyroscope variance ({{{gyroVariance}}}), suggesting erratic device handling.
  - Unusually fast or slow key hold times ({{{JSON.stringify keyHoldTimes}}}) compared to the baseline.
  - Very light or very heavy tap pressure ({{{JSON.stringify tapPressure}}}).
  - A short session duration ({{{sessionDuration}}} seconds), which can indicate automated activity.
  - Unusual screen navigation path ({{{JSON.stringify screenNavigation}}}).
  - The IP address is {{{ip}}}. A login from a new or unexpected location is a risk factor.

  Less critical data includes swipe gestures ({{{JSON.stringify swipeGestures}}}).
  
  Combine these factors to produce a final risk score and provide clear, concise reasons.
  `,
});

const calculateRiskScoreFlow = ai.defineFlow(
  {
    name: 'calculateRiskScoreFlow',
    inputSchema: CalculateRiskScoreInputSchema,
    outputSchema: CalculateRiskScoreOutputSchema,
  },
  async input => {
    const {output} = await calculateRiskScorePrompt(input);
    return output!;
  }
);

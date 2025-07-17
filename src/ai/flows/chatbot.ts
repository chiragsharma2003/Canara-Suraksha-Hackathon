'use server';
/**
 * @fileOverview A conversational chatbot for Canara Bank.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatbotInputSchema = z.string();
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.string();
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chat(query: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(query);
}

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: { schema: ChatbotInputSchema },
  output: { schema: ChatbotOutputSchema },
  prompt: `You are Canara-Bot, a friendly and helpful AI assistant for CANARA BANK.
Your role is to provide general information about the bank's products and features.
You must be concise, polite, and clear in your responses.
Do not ask for personal information. You cannot perform transactions or access user accounts.

The bank offers the following features in this demo application:
- Dashboard Overview: Shows annual spend, savings, and monthly balance.
- Profile Management: Users can update their name, DOB, and gender.
- Pay and Transfer: Includes UPI, IMPS/NEFT/RTGS, Credit Card Pay, Cardless Cash, and Bill Pay.
- Fixed Deposits (FDs): Users can create FDs with a minimum of ₹10,000 for 3 months to 10 years. Interest rates increase with duration.
- Savings Account: Shows balance and transaction history with date filtering.
- Loan Account Summary: Displays details of active loans.
- Manage Cards: View and manage virtual credit/debit cards.
- Investments: Placeholder for various investment options.
- Digital Loans: Placeholder for applying for various loans.
- Manage Beneficiaries: Add/remove recipients for transfers.
- Customer Support: Raise and track complaints, and view an app guide.

Based on the user's question, provide helpful information about these features.

User question: {{{prompt}}}`
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

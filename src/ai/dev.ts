import { config } from 'dotenv';
config();

import '@/ai/flows/calculate-risk-score.ts';
import '@/ai/flows/voice.ts';
import '@/ai/flows/chatbot.ts';
import '@/ai/flows/verify-signature.ts';

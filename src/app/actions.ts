'use server';
import { calculateRiskScore, type CalculateRiskScoreInput, type CalculateRiskScoreOutput } from '@/ai/flows/calculate-risk-score';
import { 
    transcribeAudio as ta,
    textToSpeech as tts, 
    verifyVoiceLogin as vvl, 
    type TranscribeAudioInput, 
    type TranscribeAudioOutput,
    type TextToSpeechInput, 
    type TextToSpeechOutput, 
    type VerifyVoiceLoginInput, 
    type VerifyVoiceLoginOutput 
} from '@/ai/flows/voice';
import { chat as chatbot, type ChatbotInput, type ChatbotOutput } from '@/ai/flows/chatbot';
import { verifySignature as vs, type VerifySignatureInput, type VerifySignatureOutput } from '@/ai/flows/verify-signature';
import { getLocationForIp } from '@/services/ip-locator';


export async function getIpLocation(ip: string): Promise<string> {
  const locationData = await getLocationForIp(ip);
  if (locationData) {
    return `${locationData.city}, ${locationData.regionName}, ${locationData.country}`;
  }
  return "Unknown Location";
}

export async function analyzeBehavior(data: CalculateRiskScoreInput): Promise<CalculateRiskScoreOutput> {
  try {
    const result = await calculateRiskScore(data);
    return result;
  } catch (error) {
    console.error("Error calculating risk score:", error);
    return {
      riskScore: 1.0,
      reasons: ["An internal error occurred during risk analysis.", "Assuming high risk as a precaution."],
    };
  }
}

export async function transcribeAudio(audioDataUri: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
    return ta(audioDataUri);
}

export async function textToSpeech(text: TextToSpeechInput): Promise<TextToSpeechOutput> {
    return tts(text);
}

export async function verifyVoiceLogin(data: VerifyVoiceLoginInput): Promise<VerifyVoiceLoginOutput> {
    return vvl(data);
}

export async function askChatbot(query: ChatbotInput): Promise<ChatbotOutput> {
    try {
        const result = await chatbot(query);
        return result;
    } catch (error) {
        console.error("Error with chatbot:", error);
        return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
}

export async function verifySignature(data: VerifySignatureInput): Promise<VerifySignatureOutput> {
    return vs(data);
}

'use server';
/**
 * @fileOverview AI flows for voice processing.
 *
 * - transcribeAudio - Converts audio into text.
 * - textToSpeech - Converts text into spoken audio.
 * - verifyVoiceLogin - Transcribes audio, checks against a passphrase, and verifies the speaker's identity.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// Transcription Flow
const TranscribeAudioInputSchema = z.string().describe("The audio data URI to be transcribed, e.g., 'data:audio/webm;base64,...'");
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.string().describe("The transcribed text.");
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

const transcribeAudioFlow = ai.defineFlow({
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
}, async (audioDataUri) => {
    const { text } = await ai.generate({
        prompt: [
            { media: { url: audioDataUri } },
            { text: `You are an expert transcription service.
Your task is to transcribe the provided audio accurately.
- Your response must contain *only* the transcribed text.
- Do not include any introductory phrases, commentary, or additional formatting like quotes.
- If the audio contains no discernible speech, return an empty string.` }
        ],
        model: googleAI.model('gemini-1.5-flash'), // Using a more powerful model for better accuracy
    });

    if (text === null || text === undefined) {
        throw new Error("AI model failed to produce a transcription response.");
    }
    
    // The prompt guides the model to return just the text, but we trim and remove quotes just in case.
    return text.trim().replace(/^["']|["']$/g, '');
});

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
    return transcribeAudioFlow(input);
}

// Text-to-Speech Flow
const TextToSpeechInputSchema = z.string().describe('The text to be converted to speech.');
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded WAV audio data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (text) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio was generated.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);
    
    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}


// Voice Verification Flow
const VerifyVoiceLoginInputSchema = z.object({
  loginAudioDataUri: z.string().describe("A recording of a user's voice during a login attempt, as a data URI."),
  registrationAudioDataUri: z.string().describe("The original voice sample recorded by the user during registration, as a data URI."),
  phrase: z.string().describe("The secret passphrase the user was prompted to say."),
});
export type VerifyVoiceLoginInput = z.infer<typeof VerifyVoiceLoginInputSchema>;

const VerifyVoiceLoginOutputSchema = z.object({
  isSpeakerVerified: z.boolean().describe("Whether the voice in the login audio matches the voice in the registration audio."),
  isMatch: z.boolean().describe("Whether the transcribed text from the login audio matches the expected phrase."),
  transcribedText: z.string().describe("The transcribed text from the login audio."),
  reason: z.string().describe("A brief explanation of the verification outcome, especially in case of failure."),
});
export type VerifyVoiceLoginOutput = z.infer<typeof VerifyVoiceLoginOutputSchema>;

const verifyVoiceLoginPrompt = ai.definePrompt({
    name: 'verifyVoiceLoginPrompt',
    input: { schema: VerifyVoiceLoginInputSchema },
    output: { schema: VerifyVoiceLoginOutputSchema },
    prompt: `You are an advanced voice biometric security system. Your task is to verify a user's login attempt based on their voice and a secret passphrase.

You will receive three inputs:
1.  **Registration Audio**: The user's original voiceprint, captured during setup when they spoke the passphrase.
2.  **Login Audio**: The user's voice captured during a login attempt.
3.  **Passphrase**: The secret text phrase the user was prompted to say.

Your analysis must perform two distinct checks:
1.  **Phrase Match**: Transcribe the 'Login Audio' and determine if the spoken words match the provided 'Passphrase'. The match should be successful even if there are minor transcription inaccuracies (e.g., "hello there" vs "hello ther"). Set 'isMatch' accordingly. Include the transcribed text in your response.
2.  **Speaker Verification**: Critically analyze and compare the 'Login Audio' against the 'Registration Audio'. Determine if the speaker is the same person by comparing pitch, tone, and speech patterns. Set 'isSpeakerVerified' to true only if you are highly confident they are the same person.

Provide a clear 'reason' for the final outcome, especially explaining any failures.

Registration Audio: {{media url=registrationAudioDataUri}}
Login Audio: {{media url=loginAudioDataUri}}
Passphrase: "{{phrase}}"`,
    model: googleAI.model('gemini-1.5-flash'), // Use a powerful model for this complex task
});

const verifyVoiceLoginFlow = ai.defineFlow({
    name: 'verifyVoiceLoginFlow',
    inputSchema: VerifyVoiceLoginInputSchema,
    outputSchema: VerifyVoiceLoginOutputSchema,
}, async (input) => {
    // The new prompt handles both transcription, phrase matching, and speaker verification.
    const { output } = await verifyVoiceLoginPrompt(input);

    if (!output) {
        return {
            isSpeakerVerified: false,
            isMatch: false,
            transcribedText: '',
            reason: "AI model failed to produce a valid analysis.",
        };
    }
    
    // The AI now provides the final reason, so we don't need to construct it ourselves.
    return output;
});

export async function verifyVoiceLogin(input: VerifyVoiceLoginInput): Promise<VerifyVoiceLoginOutput> {
    return verifyVoiceLoginFlow(input);
}

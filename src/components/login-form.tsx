
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useState, useRef } from "react";
import { Loader2, Mic, MicOff, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { verifyVoiceLogin, transcribeAudio, getIpLocation } from "@/app/actions";
import { Label } from "@/components/ui/label";

const passwordFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const mnemonicFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  mnemonic: z.string().min(1, { message: "Mnemonic phrase is required." }),
});

function VoiceLoginTab() {
    const { toast } = useToast();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [uiMode, setUiMode] = useState<'prompt' | 'login' | 'register'>('prompt');

    // General state
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // For login verification, transcription, or saving
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [mimeType, setMimeType] = useState<string>('');
    
    // Login-specific state
    const [registeredVoiceSample, setRegisteredVoiceSample] = useState<string | null>(null);
    const [registeredPassphrase, setRegisteredPassphrase] = useState('');
    
    // Registration-specific state
    const [newVoiceSample, setNewVoiceSample] = useState<string | null>(null); // data URI
    const [newAudioURL, setNewAudioURL] = useState<string | null>(null); // blob URL for playback
    const [newlyTranscribedPhrase, setNewlyTranscribedPhrase] = useState('');

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value.trim();
        setEmail(newEmail);
        setNewlyTranscribedPhrase('');
        setNewVoiceSample(null);
        setNewAudioURL(null);

        if (!newEmail) {
            setUiMode('prompt');
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
        const user = storedUsers[newEmail];

        if (user) {
            if (user.voicePassphrase && user.voiceSample) {
                setRegisteredPassphrase(user.voicePassphrase);
                setRegisteredVoiceSample(user.voiceSample);
                setUiMode('login');
            } else {
                setUiMode('register');
            }
        } else {
            setUiMode('prompt');
        }
    };
    
    const handleEmailBlur = () => {
        if (!email) return;
        const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
        if (!storedUsers[email]) {
            toast({
                variant: 'destructive',
                title: 'Account Not Found',
                description: 'Please enter the email you registered with, or create a new account.'
            })
        }
    }
    
    const startRecording = async () => {
        setNewAudioURL(null);
        setNewVoiceSample(null);
        setNewlyTranscribedPhrase('');

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            setMimeType(recorder.mimeType);
            audioChunksRef.current = [];
            
            recorder.ondataavailable = event => audioChunksRef.current.push(event.data);
            recorder.onstop = uiMode === 'login' ? handleLoginRecordingStop : handleRegisterRecordingStop;
            
            recorder.start();
            setIsRecording(true);
            toast({ title: "Recording Started" });
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone.' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            toast({ title: "Recording Stopped", description: "Processing your voice..." });
        }
    };
    
    const handleLoginRecordingStop = async () => {
        setIsProcessing(true);
        const mimeTypeToUse = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeToUse });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;

            if (!registeredVoiceSample || !registeredPassphrase) {
              toast({ variant: 'destructive', title: 'Login Error', description: 'Voice login is not configured for this account.' });
              setIsProcessing(false);
              return;
            }

            try {
                const result = await verifyVoiceLogin({
                    loginAudioDataUri: base64Audio,
                    registrationAudioDataUri: registeredVoiceSample,
                    phrase: registeredPassphrase,
                });

                if (result.isMatch && result.isSpeakerVerified) {
                    // --- START: Device Tracking ---
                    let currentDeviceId = sessionStorage.getItem('canara_bank_current_device_id');
                    if (!currentDeviceId) {
                        currentDeviceId = `device_${Date.now()}_${Math.random()}`;
                        sessionStorage.setItem('canara_bank_current_device_id', currentDeviceId);
                    }
                    
                    const ipAddress = '8.8.8.8'; // Public IP for demo
                    const location = await getIpLocation(ipAddress);

                    sessionStorage.setItem('canara_bank_new_device_login', 'true');
                    sessionStorage.setItem('canara_bank_last_login_ip', ipAddress);
                    sessionStorage.setItem('canara_bank_last_login_location', location);
                    
                    const deviceStorageKey = `canara_bank_devices_${email}`;
                    const knownDevicesStr = localStorage.getItem(deviceStorageKey);
                    const knownDevices: string[] = knownDevicesStr ? JSON.parse(knownDevicesStr) : [];
                    
                    if (!knownDevices.includes(currentDeviceId)) {
                        knownDevices.push(currentDeviceId);
                        localStorage.setItem(deviceStorageKey, JSON.stringify(knownDevices));
                    }
                    // --- END: Device Tracking ---

                    localStorage.setItem('canara_bank_user', JSON.stringify({ email }));
                    toast({ title: "Login Successful", description: "Voice and phrase matched." });
                    router.push("/dashboard");
                } else {
                    toast({ variant: 'destructive', title: "Login Failed", description: result.reason || 'Authentication failed. Please try again.' });
                }
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during voice verification.' });
            } finally {
                setIsProcessing(false);
            }
        };
    };

    const handleRegisterRecordingStop = async () => {
        setIsProcessing(true);
        const mimeTypeToUse = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeToUse });
        
        const blobUrl = URL.createObjectURL(audioBlob);
        setNewAudioURL(blobUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setNewVoiceSample(base64Audio);
            try {
                const transcribedText = await transcribeAudio(base64Audio);
                if (transcribedText) {
                    setNewlyTranscribedPhrase(transcribedText);
                    toast({ title: 'Phrase Transcribed', description: `We heard: "${transcribedText}". If this is correct, save your voiceprint.` });
                } else {
                    throw new Error("Transcription was empty.");
                }
            } catch (error) {
                console.error("Transcription failed:", error);
                setNewlyTranscribedPhrase('');
                toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not understand the audio. Please speak clearly and try again.' });
            } finally {
                setIsProcessing(false);
            }
        };
    };
    
    const handleSaveVoiceprint = () => {
        if (!newVoiceSample || !newlyTranscribedPhrase) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'No voice data to save. Please record your phrase first.' });
            return;
        }

        setIsProcessing(true);
        try {
            const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
            const user = storedUsers[email];
            if (user) {
                user.voicePassphrase = newlyTranscribedPhrase;
                user.voiceSample = newVoiceSample;
                storedUsers[email] = user;
                localStorage.setItem('canara_bank_users', JSON.stringify(storedUsers));
                
                toast({ title: "Voiceprint Saved!", description: "You can now log in using your voice." });
                
                // Re-run handleEmailChange to switch to login mode
                const event = { target: { value: email } } as React.ChangeEvent<HTMLInputElement>;
                handleEmailChange(event);

            } else {
                 throw new Error("User not found while saving voiceprint.");
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="voice-email">Email</Label>
                <Input id="voice-email" type="email" placeholder="you@example.com" value={email} onChange={handleEmailChange} onBlur={handleEmailBlur} disabled={isRecording || isProcessing} />
            </div>

            {uiMode === 'prompt' && (
                <p className="text-center text-sm text-muted-foreground">Enter your email to begin voice login or registration.</p>
            )}

            {uiMode === 'login' && (
                <div className="space-y-4 text-center">
                    <p className="text-center text-sm text-muted-foreground">Press record and say your secret passphrase to log in.</p>
                    <Button onClick={isRecording ? stopRecording : startRecording} disabled={!email || isProcessing} className="w-full">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />)}
                        {isProcessing ? 'Verifying...' : (isRecording ? 'Stop Recording' : 'Start Recording')}
                    </Button>
                    {isRecording && <p className="text-sm text-primary animate-pulse">Recording in progress...</p>}
                </div>
            )}
            
            {uiMode === 'register' && (
                 <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-md text-sm border">
                        <p className="font-medium text-muted-foreground">Set Up Voice Login</p>
                        <p className="text-xs text-muted-foreground mt-1">Invent a secret phrase and say it clearly. This will become your voice password.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant={isRecording ? "destructive" : "outline"} onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing}>
                           {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                           {isRecording ? "Stop" : "Record Phrase"}
                        </Button>
                        {newAudioURL && <audio src={newAudioURL} controls className="h-8" />}
                    </div>
                    {isRecording && <p className="text-sm text-primary animate-pulse">Recording...</p>}
                    {isProcessing && !isRecording && <p className="text-sm text-primary animate-pulse">Processing...</p>}

                    {newlyTranscribedPhrase && !isRecording && !isProcessing && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-md text-sm border">
                                <span className="font-medium text-muted-foreground">We heard: </span>
                                <span className="font-mono font-semibold">"{newlyTranscribedPhrase}"</span>
                                <p className="text-xs text-muted-foreground mt-1">If this is incorrect, please re-record your phrase.</p>
                            </div>
                            <Button onClick={handleSaveVoiceprint} disabled={isProcessing} className="w-full">
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Voiceprint
                            </Button>
                        </div>
                    )}
                 </div>
            )}
          </div>
        </CardContent>
    );
}

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const MAX_ATTEMPTS = 7;
  const LOCKOUT_DURATION_MINUTES = 5;

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mnemonicForm = useForm<z.infer<typeof mnemonicFormSchema>>({
    resolver: zodResolver(mnemonicFormSchema),
    defaultValues: {
      email: "",
      mnemonic: "",
    },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsLoading(true);
    try {
      const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
      const user = storedUsers[values.email];

      if (!user) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password.",
        });
        setIsLoading(false);
        return;
      }
      
      if (user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
        const lockoutEndTime = new Date(user.lockoutUntil);
        const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - new Date().getTime()) / (1000 * 60));
        toast({
          variant: "destructive",
          title: "Account Locked",
          description: `Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        });
        setIsLoading(false);
        return;
      }

      if (user.lockoutUntil && new Date() >= new Date(user.lockoutUntil)) {
          delete user.lockoutUntil;
          user.failedLoginAttempts = 0;
      }

      if (user.password === values.password) {
        user.failedLoginAttempts = 0;
        delete user.lockoutUntil;
        localStorage.setItem('canara_bank_users', JSON.stringify(storedUsers));
        
        // --- START: Device Tracking ---
        let currentDeviceId = sessionStorage.getItem('canara_bank_current_device_id');
        if (!currentDeviceId) {
            currentDeviceId = `device_${Date.now()}_${Math.random()}`;
            sessionStorage.setItem('canara_bank_current_device_id', currentDeviceId);
        }
        
        const ipAddress = '8.8.8.8'; // Public IP for demo
        const location = await getIpLocation(ipAddress);

        sessionStorage.setItem('canara_bank_new_device_login', 'true');
        sessionStorage.setItem('canara_bank_last_login_ip', ipAddress);
        sessionStorage.setItem('canara_bank_last_login_location', location);
        
        const deviceStorageKey = `canara_bank_devices_${values.email}`;
        const knownDevicesStr = localStorage.getItem(deviceStorageKey);
        const knownDevices: string[] = knownDevicesStr ? JSON.parse(knownDevicesStr) : [];
        
        if (!knownDevices.includes(currentDeviceId)) {
            knownDevices.push(currentDeviceId);
            localStorage.setItem(deviceStorageKey, JSON.stringify(knownDevices));
        }
        // --- END: Device Tracking ---
        
        localStorage.setItem('canara_bank_user', JSON.stringify({ email: values.email }));
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard");
      } else {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date();
          lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
          user.lockoutUntil = lockoutTime.toISOString();
          toast({
            variant: "destructive",
            title: "Account Locked",
            description: `Too many failed attempts. Your account has been locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
          });
        } else {
          const remainingAttempts = MAX_ATTEMPTS - user.failedLoginAttempts;
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: `Invalid email or password. You have ${remainingAttempts} attempt(s) remaining.`,
          });
        }
        localStorage.setItem('canara_bank_users', JSON.stringify(storedUsers));
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  async function onMnemonicSubmit(values: z.infer<typeof mnemonicFormSchema>) {
    setIsLoading(true);
    try {
      const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
      const user = storedUsers[values.email];
      
      const providedMnemonic = values.mnemonic.trim().toLowerCase().split(/\s+/).join(' ');
      const storedMnemonic = user?.mnemonic?.trim().toLowerCase().split(/\s+/).join(' ');

      if (user && storedMnemonic === providedMnemonic) {
        // --- START: Device Tracking ---
        let currentDeviceId = sessionStorage.getItem('canara_bank_current_device_id');
        if (!currentDeviceId) {
            currentDeviceId = `device_${Date.now()}_${Math.random()}`;
            sessionStorage.setItem('canara_bank_current_device_id', currentDeviceId);
        }

        const ipAddress = '8.8.8.8'; // Public IP for demo
        const location = await getIpLocation(ipAddress);
        
        sessionStorage.setItem('canara_bank_new_device_login', 'true');
        sessionStorage.setItem('canara_bank_last_login_ip', ipAddress);
        sessionStorage.setItem('canara_bank_last_login_location', location);

        const deviceStorageKey = `canara_bank_devices_${values.email}`;
        const knownDevicesStr = localStorage.getItem(deviceStorageKey);
        const knownDevices: string[] = knownDevicesStr ? JSON.parse(knownDevicesStr) : [];
        
        if (!knownDevices.includes(currentDeviceId)) {
            knownDevices.push(currentDeviceId);
            localStorage.setItem(deviceStorageKey, JSON.stringify(knownDevices));
        }
        // --- END: Device Tracking ---

        localStorage.setItem('canara_bank_user', JSON.stringify({ email: values.email }));
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or mnemonic phrase.",
        });
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <Tabs defaultValue="password" className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
           <CardDescription>
              Select a method to access your account.
          </CardDescription>
          <TabsList className="grid w-full grid-cols-3 mt-4">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="mnemonic">Mnemonic</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
          </TabsList>
        </CardHeader>

        <TabsContent value="password">
          <CardContent className="pt-0">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </TabsContent>

        <TabsContent value="mnemonic">
            <CardContent className="pt-0">
                <Form {...mnemonicForm}>
                    <form onSubmit={mnemonicForm.handleSubmit(onMnemonicSubmit)} className="space-y-6">
                        <FormField
                            control={mnemonicForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={mnemonicForm.control}
                            name="mnemonic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mnemonic Phrase</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter your 12-word mnemonic phrase..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Verifying...' : 'Sign In with Mnemonic'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </TabsContent>

        <TabsContent value="voice">
            <VoiceLoginTab />
        </TabsContent>

      </Tabs>
      <CardFooter className="flex-col items-center pt-6 gap-4">
        <div className="text-sm text-muted-foreground">
          <Button asChild variant="link" type="button" className="p-0 h-auto text-sm font-normal">
              <Link href="/forgot-password">Forgot Password or Security Question?</Link>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

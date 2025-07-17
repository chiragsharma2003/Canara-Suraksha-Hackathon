'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "./ui/checkbox"
import { Slider } from "./ui/slider"
import { analyzeBehavior } from "@/app/actions"
import type { CalculateRiskScoreInput, CalculateRiskScoreOutput } from "@/ai/flows/calculate-risk-score"
import { Loader2, User, QrCode, Camera } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"


const formSchema = z.object({
  amount: z.coerce.number().min(1, { message: "Amount must be at least ₹1." }),
  recipient: z.string().min(3, { message: "A valid recipient is required (UPI ID, mobile, or scanned QR)." }),
  notes: z.string().optional(),
});

interface AuthFormProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: CalculateRiskScoreOutput) => void;
  isSubmitting: boolean;
}

export function AuthForm({ onAnalysisStart, onAnalysisComplete, isSubmitting }: AuthFormProps) {
  const [tapPressure, setTapPressure] = useState(0.5);
  const [gyroVariance, setGyroVariance] = useState(0.2);
  const [pastedCredentials, setPastedCredentials] = useState(false);
  const [keyHoldTimes, setKeyHoldTimes] = useState<number[]>([]);
  
  const [activeTab, setActiveTab] = useState('upi');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const sessionStartTime = useRef<number>(0);
  const keyDownTime = useRef<Record<string, number>>({});

  useEffect(() => {
    sessionStartTime.current = Date.now();
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (activeTab === 'qr') {
      getCameraPermission();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [activeTab]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      recipient: "alice@example-bank",
      notes: "",
    },
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!keyDownTime.current[e.key]) {
      keyDownTime.current[e.key] = e.timeStamp;
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (keyDownTime.current[e.key]) {
      const duration = (e.timeStamp - keyDownTime.current[e.key]) / 1000;
      setKeyHoldTimes(prev => [...prev, parseFloat(duration.toFixed(4))]);
      delete keyDownTime.current[e.key];
    }
  };
  
  const handlePaste = () => {
    setPastedCredentials(true);
  };

  const handleSimulateScan = () => {
    const qrRecipient = 'recipient-from-qr-scan';
    form.setValue('recipient', qrRecipient, { shouldValidate: true });
    toast({
        title: "QR Code Scanned",
        description: `Recipient set to: ${qrRecipient}`,
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalysisStart();
    const sessionDuration = (Date.now() - sessionStartTime.current) / 1000;

    // Load user's baseline data from localStorage
    let baselineKeyHoldTimes: number[] | undefined = undefined;
    const sessionUserStr = localStorage.getItem('canara_bank_user');
    if (sessionUserStr) {
      const sessionUser = JSON.parse(sessionUserStr);
      const allUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
      const userData = allUsers[sessionUser.email];
      if (userData && userData.baseline) {
        baselineKeyHoldTimes = userData.baseline.keyHoldTimes;
      }
    }

    const behavioralData: CalculateRiskScoreInput = {
      tapPressure: [tapPressure, parseFloat(Math.random().toFixed(2)), parseFloat(Math.random().toFixed(2))].sort(),
      swipeGestures: [{ angle: 45, speed: 2.0 }],
      keyHoldTimes: keyHoldTimes.length > 0 ? keyHoldTimes.slice(-10) : [0.1, 0.2, 0.15, 0.12, 0.18],
      screenNavigation: ["login", "dashboard", "transfer", `transfer-method-${activeTab}`],
      ip: "8.8.8.8", // Use a public, trackable IP for the demo.
      gyroVariance: gyroVariance,
      sessionDuration: parseFloat(sessionDuration.toFixed(2)),
      pastedCredentials: pastedCredentials,
      baselineKeyHoldTimes,
    };
    
    const result = await analyzeBehavior(behavioralData);
    onAnalysisComplete(result);
    
    // If transaction is approved (low or medium risk), save beneficiary
    if (result.riskScore < 0.7 && sessionUserStr) {
        try {
            const sessionUser = JSON.parse(sessionUserStr);
            const userEmail = sessionUser.email;
            const storageKey = `canara_bank_beneficiaries_${userEmail}`;
            const beneficiariesStr = localStorage.getItem(storageKey);
            const beneficiaries = beneficiariesStr ? JSON.parse(beneficiariesStr) : [];

            const newBeneficiary = {
                id: `beneficiary-${Date.now()}`,
                name: values.recipient,
                type: 'UPI / Mobile',
                details: values.recipient,
            };
            
            const exists = beneficiaries.some((b: any) => b.details === newBeneficiary.details);
            if (!exists) {
                const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
                localStorage.setItem(storageKey, JSON.stringify(updatedBeneficiaries));
            }
        } catch (e) {
            console.error("Failed to save beneficiary from Pay and Transfer", e);
        }
    }

    // Reset for next submission
    setKeyHoldTimes([]);
    setPastedCredentials(false);
    sessionStartTime.current = Date.now();
    form.reset({ ...values, notes: '' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulate a Transaction</CardTitle>
        <CardDescription>Enter transaction details. Your interaction is analyzed for risk.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100.00" {...field} onPaste={handlePaste} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="upi" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upi">
                      <User className="mr-2 h-4 w-4" />
                      UPI / Mobile
                  </TabsTrigger>
                  <TabsTrigger value="qr">
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="upi" className="pt-4">
                 <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID or Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="name@bank or 9876543210" {...field} onPaste={handlePaste} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </TabsContent>
              <TabsContent value="qr" className="pt-4">
                <div className="space-y-2">
                  <FormLabel>Scan QR Code</FormLabel>
                   <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                   </div>
                   {hasCameraPermission === false && (
                       <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                              Please allow camera access in your browser settings to use this feature.
                            </AlertDescription>
                        </Alert>
                   )}
                   {hasCameraPermission === true && (
                       <Button type="button" className="w-full" onClick={handleSimulateScan}>
                          <Camera className="mr-2 h-4 w-4"/>
                          Simulate QR Scan
                       </Button>
                   )}
                </div>
              </TabsContent>
            </Tabs>
            
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (for typing analysis)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type something here..." {...field} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onPaste={handlePaste} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <FormLabel>Simulated Tap Pressure (Avg: {tapPressure.toFixed(2)})</FormLabel>
                    <Slider defaultValue={[0.5]} max={1} step={0.01} onValueChange={(value) => setTapPressure(value[0])} />
                </div>
                <div className="space-y-2">
                    <FormLabel>Simulated Device Handling / Gyro Variance (Avg: {gyroVariance.toFixed(2)})</FormLabel>
                    <Slider defaultValue={[0.2]} max={1} step={0.01} onValueChange={(value) => setGyroVariance(value[0])} />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="paste-check" checked={pastedCredentials} onCheckedChange={(checked) => setPastedCredentials(Boolean(checked))} />
                    <label htmlFor="paste-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Simulate Pasting Field Content
                    </label>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Analyzing...' : 'Submit Transaction'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

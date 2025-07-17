
'use client';

import { useState, useEffect, type ReactNode, useCallback, useRef, type ChangeEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/auth-form';
import { RiskAnalysis } from '@/components/risk-analysis';
import { Profile } from '@/components/profile';
import type { CalculateRiskScoreOutput } from '@/ai/flows/calculate-risk-score';
import { InteractionMonitor } from '@/components/interaction-monitor';
import { Chatbot } from '@/components/chatbot';
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Landmark,
  Wallet,
  GanttChartSquare,
  HandCoins,
  ArrowRightLeft,
  User,
  Headset,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  X,
  Loader2,
  CreditCard,
  Briefcase,
  Smartphone,
  Users,
  FilePlus2,
  History,
  BookOpen,
  Search as SearchIcon,
  BarChart4,
  Leaf,
  Store,
  Zap,
  Gem,
  Car,
  GraduationCap,
  Hammer,
  FileText,
  QrCode,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Undo2,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Cog,
  Archive,
  BookCopy,
  FileCheck2,
  MoreVertical,
  Pencil,
  Timer,
  Upload,
  Sheet as SheetIcon,
  Receipt,
  FileBadge,
  Lightbulb,
  Target,
  Repeat,
  CheckCircle,
  Signature
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { addDays, addMonths, format, differenceInDays } from "date-fns"
import { type DateRange } from "react-day-picker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { verifySignature } from '@/app/actions';
import type { VerifySignatureOutput } from '@/ai/flows/verify-signature';


// A generic placeholder for features that are not yet implemented.
function Placeholder({ feature, icon: Icon }: { feature: string, icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
       <div className="mx-auto bg-primary/10 p-4 rounded-full mb-6">
          <Icon className="w-12 h-12 text-primary"/>
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2">{feature}</h2>
      <p className="text-muted-foreground max-w-md">
        The functionality for the {feature} feature is currently under development and will be available soon.
      </p>
    </div>
  );
}

interface UserProfile {
  email: string;
  fullName: string;
  photo?: string;
  mobile?: string;
  dob?: string;
  gender?: string;
  dobUpdateCount?: number;
  isFrozen?: boolean;
}

// Base schema for beneficiary details, without refinement
const beneficiaryBaseSchema = z.object({
    beneficiaryName: z.string().min(2, { message: "Beneficiary name must be at least 2 characters." }),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "Please enter a valid 11-character IFSC code." }),
    accountNumber: z.string().regex(/^\d{9,18}$/, { message: "Account number must be between 9 and 18 digits." }),
    confirmAccountNumber: z.string(),
});

// Schema for adding a new beneficiary, with refinement
const addBeneficiarySchema = beneficiaryBaseSchema.refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match.",
    path: ["confirmAccountNumber"],
});

// Schema for NEFT/RTGS transfers, extending the base and adding refinement
const neftRtgsSchema = beneficiaryBaseSchema.extend({
    amount: z.coerce.number().positive({ message: "Transfer amount must be greater than zero." }),
    message: z.string().optional(),
}).refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match.",
    path: ["confirmAccountNumber"],
});

// Schema for Credit Card Payment
const creditCardPaymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, { message: "Please enter a valid 16-digit card number." }),
  amount: z.coerce.number().positive({ message: "Payment amount must be greater than zero." }),
});

// FEATURE COMPONENTS MOVED OUTSIDE THE MAIN PAGE COMPONENT TO PRESERVE STATE

interface FeatureProps {
  user: UserProfile | null;
}

const DashboardOverview = ({ handleFeatureChange, setShowQrDialog }: { handleFeatureChange: (name: string) => void, setShowQrDialog: (show: boolean) => void }) => {
    const [monthlySpendData, setMonthlySpendData] = useState<any[]>([]);

    useEffect(() => {
        const data = [
          { month: 'January', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'February', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'March', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'April', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'May', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'June', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'July', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'August', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'September', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'October', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'November', spend: Math.floor(Math.random() * 50000) + 10000 },
          { month: 'December', spend: Math.floor(Math.random() * 50000) + 10000 },
        ];
        setMonthlySpendData(data);
    }, []);

    const chartConfig = {
      spend: {
        label: "Spend (₹)",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;
    
    return (
        <div className="space-y-8 relative">
           <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                      variant="default"
                      size="icon"
                      className="absolute top-0 left-0 h-14 w-14 rounded-full shadow-lg z-10"
                      onClick={() => setShowQrDialog(true)}
                  >
                      <QrCode className="h-7 w-7" />
                      <span className="sr-only">Show My QR Code</span>
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                  <p>Show My QR Code</p>
              </TooltipContent>
          </Tooltip>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annually Spend</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹4,52,318.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last year</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annually Saved</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹1,22,345.50</div>
                    <p className="text-xs text-muted-foreground">+15% from last year</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Monthly Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹57,890.00</div>
                    <p className="text-xs text-muted-foreground">Based on last 12 months</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Yearly Balance</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹6,94,680.00</div>
                     <p className="text-xs text-muted-foreground">For the current year</p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-tight">Quick Actions</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleFeatureChange('Manage Cards')}>
                    <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">Manage Cards</CardTitle>
                            <CreditCard className="h-5 w-5 text-primary" />
                       </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">View, block, or set limits on your cards.</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleFeatureChange('Invest')}>
                     <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">Invest</CardTitle>
                            <Briefcase className="h-5 w-5 text-primary" />
                       </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Explore mutual funds, stocks, and more.</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleFeatureChange('Digital Loans')}>
                     <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">Digital Loans</CardTitle>
                            <Smartphone className="h-5 w-5 text-primary" />
                       </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Apply for instant pre-approved loans.</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleFeatureChange('Manage Beneficiaries')}>
                     <CardHeader className="pb-2">
                       <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">Manage Beneficiaries</CardTitle>
                            <Users className="h-5 w-5 text-primary" />
                       </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Add or remove fund transfer recipients.</p>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Analysis</CardTitle>
            <CardDescription>Your spending overview for the past 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={monthlySpendData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        </div>
    );
  };
  
const ProfileFeature = ({ user, onUpdate }: { user: UserProfile | null, onUpdate: (user: UserProfile) => void}) => <Profile user={user} onUpdate={onUpdate} />;

const PayAndTransferFeature = ({ onAnalysisStart, onAnalysisComplete, isSubmitting, analysisResult }: { onAnalysisStart: () => void, onAnalysisComplete: (result: CalculateRiskScoreOutput) => void, isSubmitting: boolean, analysisResult: CalculateRiskScoreOutput | null }) => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Pay and Transfer</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          A secure hub for all your payment and transfer needs. Your interactions are monitored in real-time for security.
        </p>
      </div>
      <Tabs defaultValue="fund_transfer" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="fund_transfer"><ArrowRightLeft className="mr-2 h-4 w-4"/>Fund Transfer (UPI)</TabsTrigger>
            <TabsTrigger value="imps_neft"><Landmark className="mr-2 h-4 w-4"/>IMPS/NEFT/RTGS</TabsTrigger>
            <TabsTrigger value="credit_card"><CreditCard className="mr-2 h-4 w-4"/>Pay Credit Card</TabsTrigger>
            <TabsTrigger value="cardless_cash"><Wallet className="mr-2 h-4 w-4"/>Cardless Cash</TabsTrigger>
            <TabsTrigger value="bill_pay"><FileText className="mr-2 h-4 w-4"/>Bill Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="fund_transfer" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              <AuthForm 
                onAnalysisStart={onAnalysisStart} 
                onAnalysisComplete={onAnalysisComplete}
                isSubmitting={isSubmitting}
              />
            </div>
            <div className="lg:col-span-3">
                <RiskAnalysis isLoading={isSubmitting} result={analysisResult} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="imps_neft" className="mt-6">
            <NeftRtgsFeature />
        </TabsContent>
        <TabsContent value="credit_card" className="mt-6">
            <CreditCardPaymentFeature />
        </TabsContent>
        <TabsContent value="cardless_cash" className="mt-6">
            <Placeholder feature="Cardless Cash" icon={Wallet} />
        </TabsContent>
        <TabsContent value="bill_pay" className="mt-6">
            <Placeholder feature="Bill Pay" icon={FileText} />
        </TabsContent>
      </Tabs>
    </div>
  );

const HelpCenterFeature = ({ user }: FeatureProps) => {
    interface Complaint {
      id: string;
      date: string;
      query: string;
      image?: string;
      status: 'Submitted' | 'In Progress' | 'Resolved';
    }

    // For complaint submission
    const { toast } = useToast();
    const [supportImage, setSupportImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // For tracking
    const [trackingId, setTrackingId] = useState('');
    const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null | 'not_found'>(null);

    // For history
    const [complaintHistory, setComplaintHistory] = useState<Complaint[]>([]);

    const getComplaintsForUser = useCallback((): Complaint[] => {
        if (!user) return [];
        const complaintsStr = localStorage.getItem(`canara_bank_complaints_${user.email}`);
        return complaintsStr ? JSON.parse(complaintsStr) : [];
    }, [user]);

    useEffect(() => {
        if (user) {
            setComplaintHistory(getComplaintsForUser());
        }
    }, [user, getComplaintsForUser]);

    const handleRemoveImage = () => {
        setSupportImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File Type',
                    description: 'Please select an image file.',
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSupportImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSupportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        const form = e.target as HTMLFormElement;
        const textarea = form.querySelector('textarea');
        const query = textarea?.value.trim() || '';
        
        if (!query && !supportImage) {
            toast({
                variant: 'destructive',
                title: 'Empty Complaint',
                description: 'Please describe your issue or attach an image.',
            });
            return;
        }

        const id = `CMP-${Date.now()}`;
        const newComplaint: Complaint = {
            id,
            date: new Date().toISOString(),
            query: query,
            image: supportImage || undefined,
            status: 'Submitted',
        };

        const existingComplaints = getComplaintsForUser();
        const updatedComplaints = [newComplaint, ...existingComplaints];
        localStorage.setItem(`canara_bank_complaints_${user.email}`, JSON.stringify(updatedComplaints));
        
        setComplaintHistory(updatedComplaints);

        toast({
            title: 'Complaint Submitted',
            description: `Your complaint ID is ${id}. You can use this to track your request.`,
        });
        
        form.reset();
        handleRemoveImage();
    };

    const handleTrackRequest = (e: React.FormEvent) => {
      e.preventDefault();
        if (!trackingId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a complaint ID.' });
            return;
        }
        const complaints = getComplaintsForUser();
        const found = complaints.find(c => c.id.toLowerCase() === trackingId.trim().toLowerCase());
        setTrackedComplaint(found || 'not_found');
    };

    const guideFeatures = [
        { name: 'Fixed Deposits', icon: Landmark, description: 'Create and manage your fixed deposits. View interest rates, maturity dates, and more. To get started, navigate to the Fixed Deposits section and click "Create New FD".' },
        { name: 'Savings Account', icon: Wallet, description: 'View your account balance, transaction history, and download statements. You can find all details related to your primary savings account here.' },
        { name: 'Saving Schemes', icon: GanttChartSquare, description: 'Explore various government-backed and bank-specific saving schemes. Compare options and invest in schemes that suit your financial goals.' },
        { name: 'Loan Account', icon: HandCoins, description: 'Get a summary of your active loans. The table shows your outstanding balance, interest rate, EMI, and remaining term for each loan.' },
        { name: 'NEFT/RTGS', icon: ArrowRightLeft, description: 'Transfer funds to other bank accounts using NEFT or RTGS. Simply fill in the recipient\'s details, enter the amount, and authorize the transaction.' },
        { name: 'Manage Cards', icon: CreditCard, description: 'View and manage your debit and credit cards, set spending limits, and block a card if it\'s lost or stolen.' },
        { name: 'Invest', icon: Briefcase, description: 'Explore investment opportunities like mutual funds, stocks, and other financial products to grow your wealth.' },
        { name: 'Digital Loans', icon: Smartphone, description: 'Apply for pre-approved personal loans, car loans, or other credit products instantly through the app.' },
        { name: 'Manage Beneficiaries', icon: Users, description: 'Add, delete, or view the list of beneficiaries for fund transfers to make your transactions faster.' },
    ];

    const getStatusBadgeVariant = (status: Complaint['status']) => {
      switch (status) {
        case 'Submitted': return 'secondary';
        case 'In Progress': return 'default';
        case 'Resolved': return 'outline';
        default: return 'secondary';
      }
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Customer Support</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    We're here to help. Raise a complaint, track its status, or browse our feature guide.
                </p>
            </div>
            <Tabs defaultValue="raise_complaint" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="raise_complaint"><FilePlus2 className="mr-2 h-4 w-4"/>Raise Complaint</TabsTrigger>
                    <TabsTrigger value="track_request"><SearchIcon className="mr-2 h-4 w-4"/>Track Request</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>Complaint History</TabsTrigger>
                    <TabsTrigger value="guide"><BookOpen className="mr-2 h-4 w-4"/>App Guide</TabsTrigger>
                </TabsList>

                <TabsContent value="raise_complaint" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Raise a New Complaint</CardTitle>
                            <CardDescription>Submit your query and we'll get back to you.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleSupportSubmit}>
                                <div className="space-y-2">
                                    <Label htmlFor="support-query">Describe your issue</Label>
                                    <Textarea id="support-query" name="query" placeholder="Please describe your problem in detail..." rows={5} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support-image-upload">Attach an Image (Optional)</Label>
                                    <Input 
                                        id="support-image-upload" 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                </div>
                                {supportImage && (
                                    <div className="space-y-2">
                                        <Label>Image Preview</Label>
                                        <div className="relative group rounded-md border">
                                            <img src={supportImage} alt="Screenshot preview" className="w-full h-auto max-h-48 object-contain rounded-md bg-muted/20 p-1" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-75 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove image</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" className="w-full">Submit Complaint</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="track_request" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Track Your Request</CardTitle>
                            <CardDescription>Enter your complaint ID to see its status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="flex items-center gap-2" onSubmit={handleTrackRequest}>
                                <Input placeholder="Enter Complaint ID (e.g., CMP-12345)" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
                                <Button type="submit">Track</Button>
                            </form>
                            {trackedComplaint && (
                              <div className="mt-6">
                                {trackedComplaint === 'not_found' ? (
                                  <div className="text-center text-muted-foreground">Complaint ID not found.</div>
                                ) : (
                                  <Card className="bg-muted/50">
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <CardTitle>Complaint Details</CardTitle>
                                              <CardDescription>ID: {trackedComplaint.id}</CardDescription>
                                          </div>
                                          <Badge variant={getStatusBadgeVariant(trackedComplaint.status)}>{trackedComplaint.status}</Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <p><strong>Submitted On:</strong> {new Date(trackedComplaint.date).toLocaleString()}</p>
                                      <div className="text-sm">{trackedComplaint.query}</div>
                                      {trackedComplaint.image && <img src={trackedComplaint.image} alt="Attached" className="mt-2 rounded-md border max-h-48" />}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Complaint History</CardTitle>
                            <CardDescription>A list of all complaints you have raised.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Query</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {complaintHistory.length > 0 ? (
                                      complaintHistory.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-mono">{c.id}</TableCell>
                                            <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="max-w-xs truncate">{c.query}</TableCell>
                                            <TableCell className="text-right">
                                              <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No complaints raised yet.</TableCell>
                                      </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="guide" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>App Feature Guide</CardTitle>
                            <CardDescription>Learn how to use the available features.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {guideFeatures.map(feature => (
                                    <AccordionItem value={feature.name} key={feature.name}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-3">
                                                <feature.icon className="h-5 w-5 text-primary" />
                                                <span>{feature.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-11 text-muted-foreground">
                                            {feature.description || 'Guidance for this feature is coming soon.'}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const FixedDepositsFeature = ({ user, savingsBalance, onFdCreate, onFdPrematureClose, onAccountFreeze }: { user: UserProfile | null, savingsBalance: number, onFdCreate: (amount: number) => void, onFdPrematureClose: (amount: number) => void, onAccountFreeze: () => void }) => {
    const [fds, setFds] = useState<any[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [fdToWithdraw, setFdToWithdraw] = useState<any | null>(null);
    const [showFrozenAlert, setShowFrozenAlert] = useState(false);
    const { toast } = useToast();
    const isAccountFrozen = user?.isFrozen ?? false;

    // New state for senior citizen withdrawal flow
    const [seniorFdToWithdraw, setSeniorFdToWithdraw] = useState<any | null>(null);
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [proofDocument, setProofDocument] = useState<File | null>(null);

    const fdSchema = z.object({
        amount: z.coerce.number()
            .min(10000, { message: "Minimum deposit is ₹10,000." })
            .max(savingsBalance, { message: `Amount cannot exceed your savings balance of ₹${savingsBalance.toLocaleString('en-IN')}.` }),
        durationInMonths: z.coerce.number().min(3).max(120),
    });

    const getFdsForUser = useCallback(() => {
        if (!user) return [];
        const storageKey = `canara_bank_fds_${user.email}`;
        const fdsStr = localStorage.getItem(storageKey);
        return fdsStr ? JSON.parse(fdsStr) : [];
    }, [user]);

    useEffect(() => {
        if (user) {
            setFds(getFdsForUser());
        }
    }, [user, getFdsForUser]);

    const form = useForm<z.infer<typeof fdSchema>>({
        resolver: zodResolver(fdSchema),
        defaultValues: { amount: 10000, durationInMonths: 12 },
    });
    
    useEffect(() => {
        form.reset({ amount: 10000, durationInMonths: 12 });
    }, [savingsBalance, form]);

    const { watch, control } = form;
    const watchAmount = watch('amount');
    const watchDuration = watch('durationInMonths');

    const calculateInterestRate = (months: number) => {
        const years = months / 12;
        const rate = 4.5 + (years * 0.25);
        return Math.min(rate, 7.5);
    };

    const calculateMaturity = (principal: number, rate: number, months: number) => {
        const interest = principal * (rate / 100) * (months / 12);
        return principal + interest;
    };

    const interestRate = useMemo(() => calculateInterestRate(watchDuration), [watchDuration]);
    const maturityAmount = useMemo(() => calculateMaturity(watchAmount, interestRate, watchDuration), [watchAmount, interestRate, watchDuration]);
    
    const calculatedPrematureReturn = useMemo(() => {
        if (!fdToWithdraw) return 0;
        const creationDate = new Date(fdToWithdraw.creationDate);
        const today = new Date();
        const daysActive = Math.max(0, differenceInDays(today, creationDate));
        const interest = fdToWithdraw.principal * daysActive * 0.0001; // 0.01% per day
        return fdToWithdraw.principal + interest;
    }, [fdToWithdraw]);

    const formatDuration = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        let result = '';
        if (years > 0) result += `${years} year${years > 1 ? 's' : ''}`;
        if (remainingMonths > 0) result += `${years > 0 ? ', ' : ''}${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
        return result || '0 months';
    };

    const onSubmit = (values: z.infer<typeof fdSchema>) => {
        if (!user) return;
        
        const creationDate = new Date();
        const maturityDate = addMonths(creationDate, values.durationInMonths);
        const finalInterestRate = calculateInterestRate(values.durationInMonths);
        const finalMaturityAmount = calculateMaturity(values.amount, finalInterestRate, values.durationInMonths);

        const newFd = {
            id: `FD-${Date.now()}`,
            principal: values.amount,
            interestRate: finalInterestRate,
            creationDate: creationDate.toISOString(),
            maturityDate: maturityDate.toISOString(),
            maturityAmount: finalMaturityAmount,
            status: 'Active',
        };

        const updatedFds = [...fds, newFd];
        localStorage.setItem(`canara_bank_fds_${user.email}`, JSON.stringify(updatedFds));
        setFds(updatedFds);
        
        onFdCreate(values.amount);

        toast({
            title: "Fixed Deposit Created!",
            description: `₹${values.amount.toLocaleString('en-IN')} has been notionally debited from your savings account.`,
        });
        
        setIsCreateDialogOpen(false);
        form.reset();
    };
    
    const handleAttemptWithdrawal = (fd: any) => {
        const dob = user?.dob ? new Date(user.dob) : null;
        const youngCutoffDate = new Date('2008-01-01');
        const seniorCutoffDate = new Date('1965-01-01');

        if (isAccountFrozen) {
            setShowFrozenAlert(true);
            return;
        }

        if (dob && dob < seniorCutoffDate) {
            // Senior citizen flow: request for info, don't freeze
            setSeniorFdToWithdraw(fd);
        } else if (dob && dob >= youngCutoffDate) {
            // Young user flow: freeze account
            const allUsersStr = localStorage.getItem('canara_bank_users');
            if (allUsersStr && user?.email) {
                const allUsers = JSON.parse(allUsersStr);
                allUsers[user.email].isFrozen = true;
                localStorage.setItem('canara_bank_users', JSON.stringify(allUsers));
            }

            const currentFds = getFdsForUser();
            const frozenFds = currentFds.map(f => ({ ...f, status: 'Frozen' }));
            localStorage.setItem(`canara_bank_fds_${user.email}`, JSON.stringify(frozenFds));
            
            setFds(frozenFds);
            setShowFrozenAlert(true);
            onAccountFreeze();
        } else {
            // Normal user flow: proceed with withdrawal
            setFdToWithdraw(fd);
        }
    };

    const handlePrematureWithdrawal = () => {
        if (!fdToWithdraw || !user) return;

        onFdPrematureClose(calculatedPrematureReturn);

        const updatedFds = fds.filter(f => f.id !== fdToWithdraw.id);
        localStorage.setItem(`canara_bank_fds_${user.email}`, JSON.stringify(updatedFds));
        setFds(updatedFds);

        toast({
            title: "FD Withdrawn Pre-maturely",
            description: `₹${calculatedPrematureReturn.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your savings account.`,
        });

        setFdToWithdraw(null);
    };
    
    const handleSeniorWithdrawalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawalReason || !proofDocument) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Please provide a reason and upload a proof document.',
            });
            return;
        }

        // In a real app, this would submit to a backend. For demo, we just show a message.
        toast({
            title: 'Request Submitted',
            description: `Your request for FD ${seniorFdToWithdraw?.id} is under review. You will be notified of the outcome.`,
        });

        // Close dialog and reset state
        setSeniorFdToWithdraw(null);
        setWithdrawalReason('');
        setProofDocument(null);
    };

    const handleProofUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofDocument(e.target.files[0]);
        }
    };
    
    const handlePlaceholderAction = (action: string) => {
        toast({
            title: `${action} is a demo feature`,
            description: 'This functionality is not yet implemented.',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Frozen': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Fixed Deposits</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Create and manage your fixed deposits to grow your savings.
                </p>
            </div>

            {isAccountFrozen && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <CardTitle>Account Frozen</CardTitle>
                    <CardDescription>
                        Your Fixed Deposit account has been frozen due to a policy violation. Please contact your nearest branch for assistance.
                    </CardDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Fixed Deposits</CardTitle>
                        <CardDescription>A summary of your current investments.</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isAccountFrozen}>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Create New FD
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>FD Number</TableHead>
                                <TableHead>Principal Amount</TableHead>
                                <TableHead>Interest Rate</TableHead>
                                <TableHead>Maturity Date</TableHead>
                                <TableHead>Maturity Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fds.length > 0 ? (
                                fds.map(fd => (
                                    <TableRow key={fd.id}>
                                        <TableCell className="font-mono">{fd.id}</TableCell>
                                        <TableCell className="font-mono font-medium">₹{fd.principal.toLocaleString('en-IN')}</TableCell>
                                        <TableCell>{fd.interestRate.toFixed(2)}% p.a.</TableCell>
                                        <TableCell>{format(new Date(fd.maturityDate), 'dd MMM, yyyy')}</TableCell>
                                        <TableCell className="font-mono">₹{fd.maturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(fd.status)}>{fd.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isAccountFrozen}>
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleAttemptWithdrawal(fd)} disabled={isAccountFrozen}>
                                                        <Undo2 className="mr-2 h-4 w-4" />
                                                        <span>Pre-mature Withdrawal</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => handlePlaceholderAction('Draft Over FD')} disabled={isAccountFrozen}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Draft Over FD</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handlePlaceholderAction('Modify FD')} disabled={isAccountFrozen}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Modify FD</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        You have no active fixed deposits.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Fixed Deposit</DialogTitle>
                        <DialogDescription>
                            Invest a lump sum from your savings account for a fixed period.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                            <FormField
                                control={control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount to Invest (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 25000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={control}
                                name="durationInMonths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Duration: {formatDuration(field.value)}
                                        </FormLabel>
                                        <FormControl>
                                            <Slider
                                                min={3}
                                                max={120}
                                                step={1}
                                                value={[field.value]}
                                                onValueChange={(vals) => field.onChange(vals[0])}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Card className="bg-muted/50">
                                <CardContent className="pt-6 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Interest Rate:</span>
                                        <span className="font-medium">{interestRate.toFixed(2)}% p.a.</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Maturity Date:</span>
                                        <span className="font-medium">{format(addMonths(new Date(), watchDuration), 'dd MMM, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base">
                                        <span>Maturity Amount:</span>
                                        <span className="font-mono">₹{maturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Deposit</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!fdToWithdraw} onOpenChange={(open) => !open && setFdToWithdraw(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to proceed?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Withdrawing this FD pre-maturely will result in a lower interest rate.
                            <br />
                            Estimated return amount: <strong className="font-mono">₹{calculatedPrematureReturn.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFdToWithdraw(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePrematureWithdrawal} className={buttonVariants({ variant: "destructive" })}>
                            Withdraw
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={showFrozenAlert} onOpenChange={setShowFrozenAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle>Account Operations Frozen</AlertDialogTitle>
                        <AlertDialogDescription>
                           Due to a policy violation regarding pre-mature withdrawals for your age group, your Fixed Deposit account has been frozen. You will be unable to create new deposits or manage existing ones.
                           <br/><br/>
                           Please visit your nearest branch with a valid ID to resolve this issue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowFrozenAlert(false)}>
                            I Understand
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!seniorFdToWithdraw} onOpenChange={(open) => { if (!open) setSeniorFdToWithdraw(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Senior Citizen Pre-mature Withdrawal</DialogTitle>
                        <DialogDescription>
                            As per policy, pre-mature withdrawals for senior citizens require additional documentation. Please provide a reason and upload supporting proof for review.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSeniorWithdrawalSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="withdrawal-reason">Reason for Withdrawal</Label>
                            <Textarea
                                id="withdrawal-reason"
                                placeholder="e.g., Medical emergency, urgent family need, etc."
                                value={withdrawalReason}
                                onChange={(e) => setWithdrawalReason(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proof-upload">Upload Proof Document</Label>
                            <Input
                                id="proof-upload"
                                type="file"
                                onChange={handleProofUpload}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSeniorFdToWithdraw(null)}>Cancel</Button>
                            <Button type="submit">Submit for Review</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
};
  
const SavingsAccountFeature = ({ user, activeFeature, balance }: { user: UserProfile | null, activeFeature: string, balance: number }) => {
      const { toast } = useToast();
      const itemsPerPage = 10;

      const [allTransactions, setAllTransactions] = useState<any[]>([]);
      const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -90), to: new Date() });
      const [currentPage, setCurrentPage] = useState(1);
      
      const [isBalanceVisible, setIsBalanceVisible] = useState(false);
      const [showPinDialog, setShowPinDialog] = useState(false);
      const [showPinSetupDialog, setShowPinSetupDialog] = useState(false);
      const [pinInput, setPinInput] = useState('');
      const [hasPin, setHasPin] = useState(false);
      const [isProcessingPin, setIsProcessingPin] = useState(false);
      const [newPin, setNewPin] = useState('');
      const [confirmNewPin, setConfirmNewPin] = useState('');

      const checkPinStatus = useCallback(() => {
          if (!user) return;
          const allUsersStr = localStorage.getItem('canara_bank_users');
          if (allUsersStr) {
              const allUsers = JSON.parse(allUsersStr);
              const userData = allUsers[user.email];
              if (userData && userData.transactionPin) {
                  setHasPin(true);
              } else {
                  setHasPin(false);
                  if (activeFeature === 'Savings Account') {
                      setShowPinSetupDialog(true);
                  }
              }
          }
      }, [user, activeFeature]);

      useEffect(() => {
          checkPinStatus();
      }, [checkPinStatus, activeFeature]);

      const handlePinVerification = (e: React.FormEvent) => {
          e.preventDefault();
          if (!user || pinInput.length !== 4) {
              toast({ variant: 'destructive', title: 'Invalid PIN', description: 'Please enter a 4-digit PIN.' });
              return;
          }
          setIsProcessingPin(true);
          
          setTimeout(() => {
              const allUsersStr = localStorage.getItem('canara_bank_users');
              const allUsers = allUsersStr ? JSON.parse(allUsersStr) : {};
              const userData = allUsers[user.email];

              if (userData && userData.transactionPin === pinInput) {
                  setIsBalanceVisible(true);
                  setShowPinDialog(false);
                  toast({ title: 'PIN Accepted', description: 'Balance is now visible.' });
              } else {
                  toast({ variant: 'destructive', title: 'Incorrect PIN', description: 'The PIN you entered is incorrect.' });
              }
              setPinInput('');
              setIsProcessingPin(false);
          }, 500);
      };

      const handlePinSetup = (e: React.FormEvent) => {
          e.preventDefault();
          if (newPin !== confirmNewPin) {
              toast({ variant: 'destructive', title: 'PINs do not match.' });
              return;
          }
          if (!/^\d{4}$/.test(newPin)) {
              toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be 4 digits.' });
              return;
          }
          
          if (!user) return;
          setIsProcessingPin(true);
          
          setTimeout(() => {
              try {
                  const allUsersStr = localStorage.getItem('canara_bank_users');
                  const allUsers = allUsersStr ? JSON.parse(allUsersStr) : {};
                  const userData = allUsers[user.email] || {};
                  
                  userData.transactionPin = newPin;
                  allUsers[user.email] = userData;
                  
                  localStorage.setItem('canara_bank_users', JSON.stringify(allUsers));

                  setHasPin(true);
                  setShowPinSetupDialog(false);
                  toast({ title: 'PIN Set Successfully', description: 'You can now use your PIN to view your balance.' });
              } catch (err) {
                   toast({ variant: 'destructive', title: 'Error', description: 'Failed to set PIN.' });
              } finally {
                  setNewPin('');
                  setConfirmNewPin('');
                  setIsProcessingPin(false);
              }
          }, 500);
      };
      
      const toggleBalanceVisibility = () => {
          if (isBalanceVisible) {
              setIsBalanceVisible(false);
          } else {
              if (hasPin) {
                  setShowPinDialog(true);
              } else {
                  setShowPinSetupDialog(true);
              }
          }
      };


      useEffect(() => {
          const today = new Date();
          const mockData = Array.from({ length: 100 }).map((_, i) => {
              const date = new Date();
              date.setDate(today.getDate() - Math.floor(i / 2));
              const type = Math.random() > 0.6 ? 'credit' : 'debit';
              const amount = parseFloat((Math.random() * (type === 'credit' ? 5000 : 2000) + 50).toFixed(2));
              const descriptions = [
                  'Online Shopping', 'UPI Transfer to John', 'Salary Credit', 'ATM Withdrawal', 
                  'Restaurant Bill', 'Electricity Bill', 'Mobile Recharge', 'Investment Fund',
                  'Zomato Order', 'Swiggy Instamart'
              ];
              const description = descriptions[Math.floor(Math.random() * descriptions.length)];
              return { id: i, date: date.toISOString(), description, type, amount };
          });
          setAllTransactions(mockData);
      }, []);

      const filteredTransactions = useMemo(() => {
          if (!date?.from) return allTransactions;
          return allTransactions.filter(t => {
              const transactionDate = new Date(t.date);
              if (date.from && !date.to) {
                  return transactionDate >= date.from;
              }
              if (date.from && date.to) {
                  const toDate = new Date(date.to);
                  toDate.setHours(23, 59, 59, 999);
                  return transactionDate >= date.from && transactionDate <= toDate;
              }
              return true;
          });
      }, [allTransactions, date]);

      const paginatedTransactions = useMemo(() => {
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          return filteredTransactions.slice(startIndex, endIndex);
      }, [filteredTransactions, currentPage, itemsPerPage]);

      const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

      const handleReset = () => {
          setDate(undefined);
          setCurrentPage(1);
      }
      
      return (
          <div className="space-y-8">
              <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight">Savings Account</h2>
                  <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                      Check your balance and view your transaction history.
                  </p>
              </div>

              <Card className="text-center">
                  <CardHeader>
                      <CardTitle className="text-lg text-muted-foreground font-medium">Available Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center justify-center gap-4">
                          <p className="text-5xl font-bold tracking-tight font-mono">
                              {isBalanceVisible ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ ••••••.••'}
                          </p>
                          <Button variant="ghost" size="icon" onClick={toggleBalanceVisibility}>
                              {isBalanceVisible ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                              <span className="sr-only">Toggle balance visibility</span>
                          </Button>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                              <CardTitle>Transaction History</CardTitle>
                              <CardDescription>View your recent transactions.</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                               <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="date"
                                      variant={"outline"}
                                      className={cn(
                                        "w-[260px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {date?.from ? (
                                        date.to ? (
                                          <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                          </>
                                        ) : (
                                          format(date.from, "LLL dd, y")
                                        )
                                      ) : (
                                        <span>Pick a date range</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                      initialFocus
                                      mode="range"
                                      defaultMonth={date?.from}
                                      selected={date}
                                      onSelect={setDate}
                                      numberOfMonths={2}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <Button variant="ghost" onClick={handleReset}>Reset</Button>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {paginatedTransactions.length > 0 ? (
                                  paginatedTransactions.map(t => (
                                      <TableRow key={t.id}>
                                          <TableCell className="font-mono text-xs">{format(new Date(t.date), 'dd MMM yyyy')}</TableCell>
                                          <TableCell className="flex items-center gap-2">
                                              {t.type === 'credit' ? (
                                                  <span className="text-green-500 p-1 bg-green-500/10 rounded-full"><ArrowDownLeft className="h-4 w-4" /></span>
                                              ) : (
                                                  <span className="text-red-500 p-1 bg-red-500/10 rounded-full"><ArrowUpRight className="h-4 w-4" /></span>
                                              )}
                                              {t.description}
                                          </TableCell>
                                          <TableCell className={cn(
                                              "text-right font-mono",
                                              t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                          )}>
                                              {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                          </TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={3} className="h-24 text-center">
                                          No transactions found for the selected period.
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                          Showing page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                          >
                              Previous
                          </Button>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                          >
                              Next
                          </Button>
                      </div>
                  </CardFooter>
              </Card>

            <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Enter Transaction PIN</DialogTitle>
                        <DialogDescription>
                            Please enter your 4-digit PIN to view your balance.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePinVerification}>
                        <div className="py-4">
                            <Input
                                type="password"
                                maxLength={4}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="text-center text-2xl font-mono tracking-widest"
                                placeholder="••••"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPinDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={isProcessingPin}>
                                {isProcessingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showPinSetupDialog} onOpenChange={setShowPinSetupDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Set Up Transaction PIN</DialogTitle>
                        <DialogDescription>
                            Create a 4-digit PIN to secure sensitive actions like viewing your balance. This is a one-time setup.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePinSetup}>
                        <div className="grid gap-4 py-4">
                             <Input
                                id="new-pin"
                                type="password"
                                placeholder="New 4-digit PIN"
                                maxLength={4}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                            />
                            <Input
                                id="confirm-new-pin"
                                type="password"
                                placeholder="Confirm New PIN"
                                maxLength={4}
                                value={confirmNewPin}
                                onChange={(e) => setConfirmNewPin(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isProcessingPin} className="w-full">
                                {isProcessingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Set and Save PIN
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
          </div>
      );
  };
  
const LoanAccountFeature = () => {
    const loanData = [
        {
            accountNumber: 'HL-123456789',
            loanType: 'Home Loan',
            outstandingBalance: 15000000.00,
            interestRate: 8.5,
            emi: 15000.00,
            remainingMonths: 180,
        },
        {
            accountNumber: 'CL-987654321',
            loanType: 'Car Loan',
            outstandingBalance: 200000.00,
            interestRate: 9.2,
            emi: 8000.00,
            remainingMonths: 36,
        },
        {
            accountNumber: 'PL-555555555',
            loanType: 'Personal Loan',
            outstandingBalance: 50000.00,
            interestRate: 12.0,
            emi: 5000.00,
            remainingMonths: 12,
        },
    ];

    return (
        <div className="space-y-8">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Loan Accounts</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    An overview of your current running loans and their details.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Running Loans</CardTitle>
                    <CardDescription>Details of your active loan accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account Number</TableHead>
                                <TableHead>Loan Type</TableHead>
                                <TableHead className="text-right">Outstanding Balance</TableHead>
                                <TableHead className="text-right">Interest Rate (%)</TableHead>
                                <TableHead className="text-right">EMI</TableHead>
                                <TableHead className="text-right">Remaining Term (Months)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loanData.map((loan) => (
                                <TableRow key={loan.accountNumber}>
                                    <TableCell className="font-medium">{loan.accountNumber}</TableCell>
                                    <TableCell>{loan.loanType}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">
                                        -₹{loan.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">{loan.interestRate.toFixed(2)}%</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ₹{loan.emi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">{loan.remainingMonths}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableCaption>This is a summary of your active loans.</TableCaption>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
  };

const NeftRtgsFeature = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof neftRtgsSchema>>({
        resolver: zodResolver(neftRtgsSchema),
        defaultValues: {
            beneficiaryName: "",
            ifscCode: "",
            accountNumber: "",
            confirmAccountNumber: "",
            amount: undefined,
            message: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof neftRtgsSchema>) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
            title: "Transfer Initiated",
            description: `₹${values.amount.toLocaleString('en-IN')} is being sent to ${values.beneficiaryName}.`,
        });

        // Save beneficiary to localStorage
        const sessionUserStr = localStorage.getItem('canara_bank_user');
        if (sessionUserStr) {
            try {
                const sessionUser = JSON.parse(sessionUserStr);
                const userEmail = sessionUser.email;
                const storageKey = `canara_bank_beneficiaries_${userEmail}`;
                const beneficiariesStr = localStorage.getItem(storageKey);
                const beneficiaries = beneficiariesStr ? JSON.parse(beneficiariesStr) : [];

                const newBeneficiary = {
                    id: `beneficiary-${Date.now()}`,
                    name: values.beneficiaryName,
                    type: 'Bank Account',
                    accountNumber: values.accountNumber,
                    ifsc: values.ifscCode,
                };

                const exists = beneficiaries.some((b: any) => b.accountNumber === newBeneficiary.accountNumber);
                if (!exists) {
                    const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
                    localStorage.setItem(storageKey, JSON.stringify(updatedBeneficiaries));
                }
            } catch (e) {
                console.error("Failed to save beneficiary", e);
            }
        }
        
        form.reset();
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">NEFT / RTGS Transfer</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Securely transfer funds to any bank account in India.
                </p>
            </div>
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Enter Beneficiary Details</CardTitle>
                    <CardDescription>Please ensure all details are correct before proceeding.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="beneficiaryName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Beneficiary Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="ifscCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IFSC Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., SBIN0001234" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter account number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmAccountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Re-enter Account Number</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Confirm account number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add a note for the beneficiary" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Processing...' : 'Proceed to Transfer'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
  };
  
const ManageCardsFeature = ({ user }: FeatureProps) => {
    const [flippedCard, setFlippedCard] = useState<string | null>(null);
    const [showSetLimitDialog, setShowSetLimitDialog] = useState(false);
    const [selectedCard, setSelectedCard] = useState<any | null>(null);

    const cardData = [
        {
            type: 'Credit Card',
            number: '**** **** **** 4567',
            expiry: '12/28',
            holder: user?.fullName || 'User',
            bgColor: 'bg-gradient-to-tr from-gray-800 to-gray-600',
            textColor: 'text-white',
        },
        {
            type: 'Debit Card',
            number: '**** **** **** 8901',
            expiry: '06/27',
            holder: user?.fullName || 'User',
            bgColor: 'bg-gradient-to-tr from-blue-800 to-blue-500',
            textColor: 'text-white',
        },
        {
            type: 'Virtual Debit Card',
            number: '**** **** **** 2345',
            expiry: '01/29',
            holder: user?.fullName || 'User',
            bgColor: 'bg-gradient-to-tr from-purple-800 to-purple-500',
            textColor: 'text-white',
        },
        {
            type: 'NCMC Card',
            number: '**** **** **** 6789',
            expiry: '11/30',
            holder: user?.fullName || 'User',
            bgColor: 'bg-gradient-to-tr from-teal-800 to-teal-500',
            textColor: 'text-white',
        },
        {
            type: 'Prepaid Card',
            number: '**** **** **** 1122',
            expiry: '08/26',
            holder: user?.fullName || 'User',
            bgColor: 'bg-gradient-to-tr from-amber-700 to-amber-400',
            textColor: 'text-white',
        },
    ];

    const { toast } = useToast();

    const handleCardAction = (action: string, cardType: string) => {
        toast({
            title: `${action} Request`,
            description: `The '${action}' functionality for your ${cardType} is a demo and is not implemented.`,
        });
    };

    const handleFlip = (cardNumber: string) => {
        setFlippedCard(prev => (prev === cardNumber ? null : cardNumber));
    };

    const handleSetLimitClick = (card: any) => {
        setSelectedCard(card);
        setShowSetLimitDialog(true);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Cards</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    View, manage, and secure all your cards in one place.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {cardData.map((card) => (
                    <div key={card.number} className="[perspective:1000px]">
                        <div
                            className={cn(
                                "relative w-full aspect-[1.586] transition-transform duration-700 [transform-style:preserve-3d]",
                                flippedCard === card.number && "[transform:rotateY(180deg)]"
                            )}
                        >
                            {/* --- FRONT --- */}
                            <div className="absolute w-full h-full [backface-visibility:hidden] rounded-lg overflow-hidden">
                                <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <div className={cn("relative p-6 flex flex-col justify-between flex-grow", card.bgColor, card.textColor)}>
                                         <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 opacity-80"></div>
                                         <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full bg-white/5 opacity-80"></div>

                                        <div className="flex justify-between items-start z-10">
                                            <h3 className="font-semibold text-lg">{card.type}</h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="34" viewBox="0 0 44 34" fill="none">
                                                <path d="M34.2222 0.333313H9.77778C4.64667 0.333313 0.555556 4.42442 0.555556 9.55553V24.4444C0.555556 29.5755 4.64667 33.6666 9.77778 33.6666H34.2222C39.3533 33.6666 43.4444 29.5755 43.4444 24.4444V9.55553C43.4444 4.42442 39.3533 0.333313 34.2222 0.333313Z" fill="#FBBF24" fillOpacity="0.8"/>
                                                <path d="M12.9444 11.2222H6.38889V19.7778H12.9444V11.2222Z" fill="#A16207"/>
                                            </svg>
                                        </div>
                                        <div className="z-10">
                                            <p className="text-xl md:text-2xl font-mono tracking-wider">{card.number}</p>
                                            <div className="flex justify-between items-end text-sm mt-2">
                                                <span className="font-semibold">{card.holder.toUpperCase()}</span>
                                                <div>
                                                    <p className="text-xs">VALID THRU</p>
                                                    <p>{card.expiry}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4 bg-card">
                                        <p className="text-xs text-muted-foreground mb-3">Quick Actions</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleSetLimitClick(card)}>Set Limit</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleCardAction('View PIN', card.type)}>View PIN</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleCardAction('Block Card', card.type)}>Block Card</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleFlip(card.number)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View CVV
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- BACK --- */}
                            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg overflow-hidden">
                                <Card className="flex flex-col h-full shadow-lg bg-card">
                                    <div className={cn("relative p-4 flex flex-col justify-start flex-grow", card.bgColor)}>
                                        <div className="w-full h-12 bg-black mt-6"></div>
                                        <div className="bg-white mt-6 p-2 rounded-md w-full flex items-center justify-end">
                                            <div className="bg-gray-200 w-3/4 h-8 mr-2 italic text-sm flex items-center justify-end pr-2 text-gray-600">
                                                {card.holder}
                                            </div>
                                            <p className="text-black font-mono tracking-widest text-lg">
                                                123
                                            </p>
                                        </div>
                                        <p className="text-xs text-right text-white/70 mr-2 mt-1">CVV</p>
                                        <div className="flex-grow"></div>
                                        <div className="p-2">
                                            <Button variant="outline" className="w-full bg-white/20 hover:bg-white/30 border-white/50 text-white" onClick={() => handleFlip(card.number)}>
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Show Front
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {selectedCard && (
                <SetLimitDialog 
                    isOpen={showSetLimitDialog} 
                    onOpenChange={setShowSetLimitDialog} 
                    card={selectedCard} 
                    user={user}
                />
            )}
        </div>
    );
  };

const SetLimitDialog = ({ isOpen, onOpenChange, card, user }: { isOpen: boolean, onOpenChange: (open: boolean) => void, card: any, user: UserProfile | null }) => {
    const { toast } = useToast();
    const [domesticLimit, setDomesticLimit] = useState(200000);
    const [internationalLimit, setInternationalLimit] = useState(50000);
    const [cashLimit, setCashLimit] = useState(25000);
    const [ecommLimit, setEcommLimit] = useState(100000);
    const [pinInput, setPinInput] = useState('');
    const [isProcessingPin, setIsProcessingPin] = useState(false);

    const LimitSlider = ({ label, value, onValueChange }: { label: string, value: number, onValueChange: (value: number) => void }) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label>{label}</Label>
                <span className="font-mono text-sm font-medium">₹{value.toLocaleString('en-IN')}</span>
            </div>
            <Slider
                min={0}
                max={500000}
                step={5000}
                value={[value]}
                onValueChange={(vals) => onValueChange(vals[0])}
            />
        </div>
    );
    
    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || pinInput.length !== 4) {
            toast({ variant: 'destructive', title: 'Invalid PIN', description: 'Please enter your 4-digit transaction PIN.' });
            return;
        }
        setIsProcessingPin(true);
        
        // Simulate PIN verification
        setTimeout(() => {
            const allUsersStr = localStorage.getItem('canara_bank_users');
            const allUsers = allUsersStr ? JSON.parse(allUsersStr) : {};
            const userData = allUsers[user.email];

            if (userData && userData.transactionPin === pinInput) {
                toast({ title: 'Limits Updated', description: `New limits have been set for your ${card.type}.` });
                onOpenChange(false);
            } else {
                toast({ variant: 'destructive', title: 'Incorrect PIN', description: 'The PIN you entered is incorrect.' });
            }
            setPinInput('');
            setIsProcessingPin(false);
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Set Card Limits</DialogTitle>
                    <DialogDescription>
                        Manage transaction limits for your {card.type} ending in {card.number.slice(-4)}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveChanges}>
                    <div className="space-y-6 py-4">
                        <LimitSlider label="Domestic Limit" value={domesticLimit} onValueChange={setDomesticLimit} />
                        <LimitSlider label="International Limit" value={internationalLimit} onValueChange={setInternationalLimit} />
                        <LimitSlider label="Cash Withdrawal Limit" value={cashLimit} onValueChange={setCashLimit} />
                        <LimitSlider label="E-commerce Limit" value={ecommLimit} onValueChange={setEcommLimit} />
                        
                        <div className="space-y-2 border-t pt-4">
                            <Label htmlFor="limit-pin">Enter PIN to Confirm</Label>
                            <Input
                                id="limit-pin"
                                type="password"
                                maxLength={4}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                className="text-center font-mono tracking-widest"
                                placeholder="••••"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isProcessingPin}>
                            {isProcessingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const InvestFeature = () => {
    const { toast } = useToast();

    const handleInvestmentAction = (title: string) => {
        toast({
            title: `${title}`,
            description: `The functionality for ${title} is a demo and is not yet implemented.`,
        });
    };

    const investmentOptions = [
        {
            title: 'ASBA/IPO',
            description: 'Invest in upcoming Initial Public Offerings seamlessly.',
            icon: TrendingUp,
            bgColor: 'bg-chart-1/10',
            textColor: 'text-chart-1',
        },
        {
            title: 'Mutual Funds',
            description: 'Diversify your portfolio with a wide range of mutual funds.',
            icon: BarChart4,
            bgColor: 'bg-chart-2/10',
            textColor: 'text-chart-2',
        },
        {
            title: 'PPF',
            description: 'Secure your future with a Public Provident Fund account.',
            icon: PiggyBank,
            bgColor: 'bg-chart-3/10',
            textColor: 'text-chart-3',
        },
        {
            title: 'Insurance',
            description: 'Protect yourself and your loved ones with our insurance plans.',
            icon: ShieldCheck,
            bgColor: 'bg-chart-4/10',
            textColor: 'text-chart-4',
        },
        {
            title: 'Govt. Initiatives',
            description: 'Explore and invest in various government-backed schemes.',
            icon: Landmark,
            bgColor: 'bg-chart-5/10',
            textColor: 'text-chart-5',
        },
        {
            title: 'Credit Card against FD',
            description: 'Get a secured credit card against your Fixed Deposit.',
            icon: CreditCard,
            bgColor: 'bg-chart-1/10',
            textColor: 'text-chart-1',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Investment Opportunities</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Grow your wealth with a diverse range of investment products tailored for you.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investmentOptions.map((option) => (
                    <Card 
                        key={option.title} 
                        className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        onClick={() => handleInvestmentAction(option.title)}
                    >
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className={cn(
                                "p-3 rounded-full transition-colors", 
                                option.bgColor,
                                'group-hover:bg-primary/10'
                            )}>
                                <option.icon className={cn(
                                    "w-6 h-6 transition-colors", 
                                    option.textColor,
                                    'group-hover:text-primary'
                                )} />
                            </div>
                            <CardTitle className="text-xl">{option.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{option.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const fileSchema = z.instanceof(File, { message: "Required" }).optional();

const loanApplicationSchema = z.object({
  loanAmount: z.number().min(50000, "Minimum loan amount is ₹50,000."),
  idProof: fileSchema,
  incomeTaxReturn: fileSchema,
  balanceSheet: fileSchema,
  panCard: fileSchema,
  gstCertificate: fileSchema,
});

const panSchema = z.object({
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid PAN number."),
});

const FileUpload = ({ field, label, icon: Icon }: { field: any, label: string, icon: React.ElementType }) => (
    <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
            <div className="relative">
                <Input type="file" className="pl-10 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
        </FormControl>
        <FormMessage />
    </FormItem>
);

const DigitalLoansFeature = () => {
    const { toast } = useToast();
    const [pan, setPan] = useState('');
    const [cibilScore, setCibilScore] = useState<number | null>(null);
    const [isCheckingScore, setIsCheckingScore] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const panForm = useForm({
        resolver: zodResolver(panSchema),
        defaultValues: { pan: '' }
    });
    
    const loanForm = useForm<z.infer<typeof loanApplicationSchema>>({
        resolver: zodResolver(loanApplicationSchema),
        defaultValues: { loanAmount: 250000 },
    });
    
    const handleCheckScore = (values: z.infer<typeof panSchema>) => {
        setIsCheckingScore(true);
        setTimeout(() => {
            setCibilScore(Math.floor(Math.random() * (900 - 300 + 1) + 300));
            setIsCheckingScore(false);
            toast({ title: "CIBIL Score Fetched", description: "Your simulated score is now displayed." });
        }, 1500);
    };

    const handleLoanSubmit = (values: z.infer<typeof loanApplicationSchema>) => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: "Loan Application Submitted",
                description: "Your application is under review. We will get back to you shortly.",
            });
            loanForm.reset();
        }, 2000);
    };
    
    const getCibilProfile = (score: number | null) => {
        if (score === null) return { text: '', color: '' };
        if (score >= 750) return { text: 'Excellent', color: 'text-green-500' };
        if (score >= 700) return { text: 'Good', color: 'text-lime-500' };
        if (score >= 650) return { text: 'Fair', color: 'text-yellow-500' };
        if (score >= 550) return { text: 'Average', color: 'text-amber-500' };
        return { text: 'Poor', color: 'text-red-500' };
    };

    const cibilProfile = getCibilProfile(cibilScore);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Digital Loans</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Check your CIBIL score and apply for a loan instantly.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Check Your CIBIL Score</CardTitle>
                            <CardDescription>Enter your PAN number to get your credit score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...panForm}>
                                <form onSubmit={panForm.handleSubmit(handleCheckScore)} className="space-y-4">
                                    <FormField
                                        control={panForm.control}
                                        name="pan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PAN Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ABCDE1234F" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isCheckingScore}>
                                        {isCheckingScore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Check Score
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                         {cibilScore !== null && (
                            <CardFooter className="flex flex-col items-center justify-center pt-4 border-t">
                                <p className="text-sm text-muted-foreground">Your Score</p>
                                <p className={cn("text-6xl font-bold", cibilProfile.color)}>{cibilScore}</p>
                                <p className={cn("font-semibold", cibilProfile.color)}>{cibilProfile.text}</p>
                                <Progress value={(cibilScore / 900) * 100} className="w-full mt-2 h-2" />
                            </CardFooter>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apply for a Loan</CardTitle>
                            <CardDescription>Fill in the details below to apply for an instant loan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Form {...loanForm}>
                                <form onSubmit={loanForm.handleSubmit(handleLoanSubmit)} className="space-y-6">
                                    <FormField
                                        control={loanForm.control}
                                        name="loanAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Loan Amount: ₹{field.value.toLocaleString('en-IN')}
                                                </FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        min={50000}
                                                        max={5000000}
                                                        step={10000}
                                                        value={[field.value]}
                                                        onValueChange={(vals) => field.onChange(vals[0])}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={loanForm.control} name="idProof" render={({ field }) => <FileUpload field={field} label="ID Proof" icon={User} />} />
                                        <FormField control={loanForm.control} name="incomeTaxReturn" render={({ field }) => <FileUpload field={field} label="Income Tax Return" icon={Receipt} />} />
                                        <FormField control={loanForm.control} name="balanceSheet" render={({ field }) => <FileUpload field={field} label="Balance Sheet" icon={SheetIcon} />} />
                                        <FormField control={loanForm.control} name="panCard" render={({ field }) => <FileUpload field={field} label="PAN Card" icon={FileBadge} />} />
                                        <FormField control={loanForm.control} name="gstCertificate" render={({ field }) => <FileUpload field={field} label="GST Certificate (Optional)" icon={FileText} />} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Apply Now
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ManageBeneficiariesFeature = ({ user, handleFeatureChange }: FeatureProps & { handleFeatureChange: (name: string) => void }) => {
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<any | null>(null);

    const { toast } = useToast();

    const getBeneficiariesForUser = useCallback(() => {
        if (!user) return [];
        const storageKey = `canara_bank_beneficiaries_${user.email}`;
        const beneficiariesStr = localStorage.getItem(storageKey);
        return beneficiariesStr ? JSON.parse(beneficiariesStr) : [];
    }, [user]);

    useEffect(() => {
        if (user) {
            setBeneficiaries(getBeneficiariesForUser());
        }
    }, [user, getBeneficiariesForUser]);
    
    const addBeneficiaryForm = useForm<z.infer<typeof addBeneficiarySchema>>({
        resolver: zodResolver(addBeneficiarySchema),
        defaultValues: { beneficiaryName: "", ifscCode: "", accountNumber: "", confirmAccountNumber: "" },
    });

    const handleAddBeneficiary = (values: z.infer<typeof addBeneficiarySchema>) => {
        if (!user) return;
        const newBeneficiary = {
            id: `beneficiary-${Date.now()}`,
            name: values.beneficiaryName,
            type: 'Bank Account',
            accountNumber: values.accountNumber,
            ifsc: values.ifscCode,
        };

        const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
        
        localStorage.setItem(`canara_bank_beneficiaries_${user.email}`, JSON.stringify(updatedBeneficiaries));
        setBeneficiaries(updatedBeneficiaries);
        toast({ title: "Beneficiary Added", description: `${values.beneficiaryName} has been added to your list.` });
        setIsAddDialogOpen(false);
        addBeneficiaryForm.reset();
    };
    
    const handleDeleteBeneficiary = () => {
        if (!beneficiaryToDelete || !user) return;

        const updatedBeneficiaries = beneficiaries.filter(b => b.id !== beneficiaryToDelete.id);
        
        localStorage.setItem(`canara_bank_beneficiaries_${user.email}`, JSON.stringify(updatedBeneficiaries));
        setBeneficiaries(updatedBeneficiaries);
        toast({ title: "Beneficiary Removed", description: `${beneficiaryToDelete.name} has been removed.` });
        setBeneficiaryToDelete(null);
    };

    const maskAccountNumber = (accountNumber: string) => {
      return `**** **** **** ${accountNumber.slice(-4)}`;
    }

    return (
        <div className="space-y-8">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Beneficiaries</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    View, add, or remove your saved beneficiaries for quick and easy transfers.
                </p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Your Beneficiaries</CardTitle>
                      <CardDescription>A list of people and accounts you've paid.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Beneficiary
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {beneficiaries.length > 0 ? (
                                beneficiaries.map(b => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.name}</TableCell>
                                        <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-mono">
                                            {b.type === 'Bank Account' 
                                                ? `A/c: ${maskAccountNumber(b.accountNumber)}, IFSC: ${b.ifsc}`
                                                : b.details
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <Button variant="ghost" size="icon" onClick={() => handleFeatureChange('Pay and Transfer')}>
                                                        <ArrowRightLeft className="h-4 w-4" />
                                                        <span className="sr-only">Pay</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Pay Now</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setBeneficiaryToDelete(b)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Delete Beneficiary</p></TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        You haven't added any beneficiaries yet. They will appear here after your first transaction.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Beneficiary</DialogTitle>
                        <DialogDescription>Enter the bank account details of the person you want to add.</DialogDescription>
                    </DialogHeader>
                    <Form {...addBeneficiaryForm}>
                        <form onSubmit={addBeneficiaryForm.handleSubmit(handleAddBeneficiary)} className="space-y-4 py-4">
                            <FormField control={addBeneficiaryForm.control} name="beneficiaryName" render={({ field }) => (<FormItem><FormLabel>Beneficiary Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={addBeneficiaryForm.control} name="ifscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input placeholder="e.g., SBIN0001234" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={addBeneficiaryForm.control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="Enter account number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={addBeneficiaryForm.control} name="confirmAccountNumber" render={({ field }) => (<FormItem><FormLabel>Re-enter Account Number</FormLabel><FormControl><Input placeholder="Confirm account number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Add Beneficiary</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!beneficiaryToDelete} onOpenChange={(open) => !open && setBeneficiaryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove '{beneficiaryToDelete?.name}' from your beneficiaries list. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBeneficiaryToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBeneficiary} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const CreditCardPaymentFeature = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof creditCardPaymentSchema>>({
        resolver: zodResolver(creditCardPaymentSchema),
        defaultValues: {
            cardNumber: "",
            amount: undefined,
        },
    });

    const onSubmit = async (values: z.infer<typeof creditCardPaymentSchema>) => {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
            title: "Payment Successful",
            description: `₹${values.amount.toLocaleString('en-IN')} has been paid towards card ending in ${values.cardNumber.slice(-4)}.`,
        });
        
        form.reset();
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Pay Credit Card Bill</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Settle your outstanding credit card dues quickly and securely.
                </p>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Enter Payment Details</CardTitle>
                    <CardDescription>Enter your card number and the amount you wish to pay.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="cardNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Credit Card Number</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="•••• •••• •••• ••••" {...field} maxLength={16} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Processing...' : 'Pay Bill'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

const SavingSchemesFeature = () => {
    const { toast } = useToast();

    const savingTips = [
        {
            icon: Target,
            title: "The 50/30/20 Rule",
            description: "Allocate 50% of your income for needs, 30% for wants, and save the remaining 20% directly."
        },
        {
            icon: Repeat,
            title: "Automate Your Savings",
            description: "Set up automatic transfers to your savings account each payday. Out of sight, out of mind."
        },
        {
            icon: Lightbulb,
            title: "Track Your Spending",
            description: "Use an app or a simple notebook to see where your money goes. Awareness is the first step to saving."
        }
    ];

    const handleInvestNsc = () => {
        toast({
            title: "NSC Investment",
            description: "This feature is for demo purposes. In a real app, you would be guided through the investment process.",
        });
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Saving Schemes & Tips</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Learn smart ways to save and explore government-backed investment schemes.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Savings Habits</CardTitle>
                    <CardDescription>Small changes can lead to big savings. Here are some ideas to get started.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    {savingTips.map((tip, index) => (
                        <Card key={index} className="bg-muted/30">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <tip.icon className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">{tip.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{tip.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                    <div className="p-6">
                        <CardHeader className="p-0">
                            <Badge variant="secondary" className="w-fit">Government Scheme</Badge>
                            <CardTitle className="text-2xl mt-2">National Savings Certificate (NSC)</CardTitle>
                            <CardDescription className="mt-1">
                                A fixed-income investment scheme issued by the Post Office, offering guaranteed returns and tax benefits.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 mt-6">
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">5-Year Lock-in Period</p>
                                        <p className="text-sm text-muted-foreground">Your investment is securely locked for 5 years, ensuring disciplined savings.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Attractive Interest Rate (7.7% p.a.)</p>
                                        <p className="text-sm text-muted-foreground">Interest is compounded annually but paid at maturity.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Tax Benefits</p>
                                        <p className="text-sm text-muted-foreground">Investments up to ₹1.5 lakh qualify for a tax deduction under Section 80C.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-0 mt-6">
                            <Button onClick={handleInvestNsc}>Invest Now</Button>
                        </CardFooter>
                    </div>
                     <div className="bg-muted hidden md:flex items-center justify-center p-6">
                        <img 
                            src="https://placehold.co/400x300.png" 
                            alt="Saving for future" 
                            className="rounded-lg object-cover"
                            data-ai-hint="savings growth"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

const DigitalPermissionsFeature = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<VerifySignatureOutput | null>(null);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [requestToAuthorize, setRequestToAuthorize] = useState<any | null>(null);

    type RequestStatus = 'Pending' | 'Authorized' | 'Failed';

    const [requests, setRequests] = useState([
        { id: 'REQ-001', description: 'Cheque Clearance #789234', amount: 50000.00, submitter: 'Branch Office', date: new Date(), status: 'Pending' as RequestStatus },
        { id: 'REQ-002', description: 'High-Value Transfer', amount: 250000.00, submitter: 'Online Banking', date: addDays(new Date(), -1), status: 'Pending' as RequestStatus },
        { id: 'REQ-003', description: 'Remote Draft Processing', amount: 75000.00, submitter: 'Treasury Dept.', date: addDays(new Date(), -2), status: 'Authorized' as RequestStatus },
        { id: 'REQ-004', description: 'Cheque Clearance #789235', amount: 12000.50, submitter: 'Branch Office', date: addDays(new Date(), -3), status: 'Failed' as RequestStatus },
    ]);
    
    const { toast } = useToast();

    useEffect(() => {
        if (!requestToAuthorize) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.lineCap = 'round';
        context.strokeStyle = '#172554';
        context.lineWidth = 3;
        contextRef.current = context;
        clearSignature();
    }, [requestToAuthorize]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const stopDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas && contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setSignatureDataUrl(null);
        setSignatureFile(null);
        setAnalysisResult(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file.' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignatureDataUrl(reader.result as string);
                setSignatureFile(file);
                // Clear canvas if a file is uploaded
                const canvas = canvasRef.current;
                if (canvas && contextRef.current) {
                    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async () => {
        let finalSignatureDataUrl = signatureDataUrl;
        
        // If nothing is uploaded, check the canvas
        if (!finalSignatureDataUrl) {
            const canvas = canvasRef.current;
            if (canvas) {
                const blankCanvas = document.createElement('canvas');
                blankCanvas.width = canvas.width;
                blankCanvas.height = canvas.height;
                if (canvas.toDataURL() !== blankCanvas.toDataURL()) {
                    finalSignatureDataUrl = canvas.toDataURL('image/png');
                }
            }
        }
        
        if (!finalSignatureDataUrl) {
            toast({ variant: 'destructive', title: 'No Signature Provided', description: 'Please draw or upload your signature.' });
            return;
        }

        setIsSubmitting(true);
        setAnalysisResult(null);

        try {
            const result = await verifySignature({ signatureDataUri: finalSignatureDataUrl });
            setAnalysisResult(result);
            if (result.isValid) {
                setRequests(prev => prev.map(req => req.id === requestToAuthorize.id ? { ...req, status: 'Authorized' } : req));
                toast({ title: 'Authorization Successful', description: `Request ${requestToAuthorize.id} has been approved.` });
                setTimeout(() => setRequestToAuthorize(null), 1500); // Close dialog on success
            } else {
                 setRequests(prev => prev.map(req => req.id === requestToAuthorize.id ? { ...req, status: 'Failed' } : req));
                toast({ variant: 'destructive', title: 'Authorization Failed', description: result.reason });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during signature verification.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case 'Pending': return <Badge variant="secondary">Pending</Badge>;
            case 'Authorized': return <Badge className="bg-green-600 hover:bg-green-700">Authorized</Badge>;
            case 'Failed': return <Badge variant="destructive">Failed</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Digital Authorizations</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Review and authorize pending requests using your AI-verified digital signature.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>A list of transactions requiring your signature-based approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request ID</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-mono">{req.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{req.description}</div>
                                        <div className="text-xs text-muted-foreground">Submitted by: {req.submitter}</div>
                                    </TableCell>
                                    <TableCell>{format(req.date, 'PPpp')}</TableCell>
                                    <TableCell className="text-right font-mono">₹{req.amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                         {req.status === 'Pending' && (
                                            <motion.div whileTap={{ scale: 0.95 }}>
                                                <Button variant="outline" size="sm" onClick={() => setRequestToAuthorize(req)}>
                                                    Authorize
                                                </Button>
                                            </motion.div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={!!requestToAuthorize} onOpenChange={(open) => { if (!open) setRequestToAuthorize(null) }}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Authorize Request: {requestToAuthorize?.id}</DialogTitle>
                        <DialogDescription>
                            Provide your signature to authorize the transaction for <strong>{requestToAuthorize?.description}</strong> of amount <strong>₹{requestToAuthorize?.amount.toLocaleString('en-IN')}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <Tabs defaultValue="draw" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                                    <TabsTrigger value="upload">Upload Signature</TabsTrigger>
                                </TabsList>
                                <TabsContent value="draw" className="mt-4">
                                     <canvas
                                        ref={canvasRef}
                                        onMouseDown={startDrawing}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onMouseMove={draw}
                                        width={400}
                                        height={200}
                                        className="border bg-white rounded-md cursor-crosshair w-full"
                                    />
                                </TabsContent>
                                <TabsContent value="upload" className="mt-4">
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="signature-upload" className="flex flex-col items-center justify-center w-full h-[200px] border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                            {signatureDataUrl && signatureFile ? (
                                                <div className="relative w-full h-full">
                                                    <img src={signatureDataUrl} alt="Signature Preview" className="w-full h-full object-contain p-2" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG, or GIF</p>
                                                </div>
                                            )}
                                            <Input id="signature-upload" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </Label>
                                    </div> 
                                </TabsContent>
                            </Tabs>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={clearSignature} className="w-full">Clear</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit for Verification
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                             {isSubmitting && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <p className="mt-4 text-muted-foreground">Analyzing signature...</p>
                                </div>
                            )}
                            {analysisResult && (
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>AI Analysis Result</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Validity:</span>
                                            {analysisResult.isValid ? 
                                                <Badge className="bg-green-600 hover:bg-green-700">Valid</Badge> : 
                                                <Badge variant="destructive">Invalid</Badge>
                                            }
                                        </div>
                                        <div>
                                            <Label>Confidence Score</Label>
                                            <div className="flex items-center gap-2">
                                                <Progress value={analysisResult.confidence * 100} className="w-full" />
                                                <span className="font-mono font-bold text-primary">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Reason</Label>
                                            <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{analysisResult.reason}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function DashboardPage() {
  const [activeFeature, setActiveFeature] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CalculateRiskScoreOutput | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const logoutTimer = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // State for re-authentication modal
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isReauthing, setIsReauthing] = useState(false);
  const featureToActivate = useRef('');
  
  // State for QR code modal
  const [showQrDialog, setShowQrDialog] = useState(false);

  // State for new device alert
  const [showNewDeviceAlert, setShowNewDeviceAlert] = useState(false);
  const [lastLoginDeviceId, setLastLoginDeviceId] = useState<string | null>(null);
  const [lastLoginIp, setLastLoginIp] = useState<string | null>(null);
  const [lastLoginLocation, setLastLoginLocation] = useState<string | null>(null);

  // Shared state for savings balance
  const [savingsBalance, setSavingsBalance] = useState(123456.78);

  // State for sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<Record<string, boolean>>({});

  // Session freeze state
  const [clickCount, setClickCount] = useState(0);
  const [isSessionFrozen, setIsSessionFrozen] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  const CLICK_LIMIT = 15;
  const LOCKOUT_MINUTES = 15;

  const handleFdCreate = (amount: number) => {
    setSavingsBalance(prev => prev - amount);
  };
  
  const handleFdPrematureClose = (amount: number) => {
    setSavingsBalance(prev => prev + amount);
  };

  const handleAccountFreeze = () => {
    setUser(prev => prev ? { ...prev, isFrozen: true } : null);
  };

  const handleLogout = useCallback(() => {
    if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
    }
    localStorage.removeItem('canara_bank_user');
    sessionStorage.removeItem('payAndTransferAccessCount'); // Clear counter on logout
    sessionStorage.removeItem('canara_bank_current_device_id');
    sessionStorage.removeItem('canara_bank_click_count');
    router.push('/');
  }, [router]);
  
  // Effect for session freeze countdown timer
  useEffect(() => {
    if (!isSessionFrozen || !lockoutUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = lockoutUntil.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        setIsSessionFrozen(false);
        setLockoutUntil(null);
        setClickCount(0);
        sessionStorage.removeItem('canara_bank_click_count');
        toast({ title: "Session Restored", description: "Your session is now active again." });
        return;
      }
      
      const minutes = Math.floor((diff / 1000) / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionFrozen, lockoutUntil, toast]);

  // Effect to track clicks
  useEffect(() => {
    const handleUserClick = () => {
      if (isSessionFrozen) return;

      const newCount = (parseInt(sessionStorage.getItem('canara_bank_click_count') || '0', 10) || 0) + 1;
      setClickCount(newCount);
      sessionStorage.setItem('canara_bank_click_count', newCount.toString());

      if (newCount > CLICK_LIMIT) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_MINUTES);
        setLockoutUntil(lockoutTime);
        setIsSessionFrozen(true);
        toast({
          variant: 'destructive',
          title: 'Session Frozen',
          description: `Due to unusual activity, your session is frozen for ${LOCKOUT_MINUTES} minutes.`
        });
      }
    };

    window.addEventListener('click', handleUserClick, true); // Use capture phase

    return () => {
      window.removeEventListener('click', handleUserClick, true);
    };
  }, [isSessionFrozen, toast]);

  // Idle timeout effect
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];

    const resetTimer = () => {
      if (isSessionFrozen) return; // Don't reset if frozen
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
      logoutTimer.current = setTimeout(() => {
        handleLogout();
        toast({
          title: 'Session Expired',
          description: 'You have been logged out due to inactivity.',
          variant: 'destructive'
        });
      }, 5 * 60 * 1000); // 5 minutes
    };

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [handleLogout, toast, isSessionFrozen]);

  useEffect(() => {
    const sessionUserStr = localStorage.getItem('canara_bank_user');
    if (!sessionUserStr) {
      router.push('/');
      return;
    }

    try {
      // Reset click count on load
      sessionStorage.removeItem('canara_bank_click_count');
      setClickCount(0);

      const sessionUser = JSON.parse(sessionUserStr);
      const allUsersStr = localStorage.getItem('canara_bank_users');
      if (!allUsersStr) {
        handleLogout();
        return;
      }
      const allUsers = JSON.parse(allUsersStr);
      const userData = allUsers[sessionUser.email];

      if (userData) {
        setUser({ 
            email: sessionUser.email, 
            fullName: userData.fullName || 'User', 
            photo: userData.photo, 
            mobile: userData.mobile,
            dob: userData.dob,
            gender: userData.gender,
            dobUpdateCount: userData.dobUpdateCount ?? 0,
            isFrozen: userData.isFrozen ?? false,
        });

        const newDeviceLogin = sessionStorage.getItem('canara_bank_new_device_login');
        if (newDeviceLogin === 'true') {
            const deviceId = sessionStorage.getItem('canara_bank_current_device_id');
            const ip = sessionStorage.getItem('canara_bank_last_login_ip');
            const location = sessionStorage.getItem('canara_bank_last_login_location');
            setLastLoginDeviceId(deviceId);
            setLastLoginIp(ip);
            setLastLoginLocation(location);
            setShowNewDeviceAlert(true);
            sessionStorage.removeItem('canara_bank_new_device_login');
        }

      } else {
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      handleLogout();
    }
  }, [router, handleLogout]);

  const ACCESS_LIMIT = 3;

  const handleFeatureChange = (featureName: string) => {
      if (featureName === 'Pay and Transfer') {
          let accessCount = parseInt(sessionStorage.getItem('payAndTransferAccessCount') || '0', 10);
          accessCount += 1;
          
          if (accessCount > ACCESS_LIMIT) {
              featureToActivate.current = featureName;
              setShowReauth(true);
              return; // Prevent setting the active feature
          }
          
          sessionStorage.setItem('payAndTransferAccessCount', accessCount.toString());
      } else if (featureName === 'Dashboard') {
          sessionStorage.removeItem('payAndTransferAccessCount');
      }
      setActiveFeature(featureName);
  };

  const handleReauthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reauthPassword) {
        toast({ variant: 'destructive', title: 'Password Required', description: 'Please enter your password.' });
        return;
    }
    setIsReauthing(true);
    
    try {
        const sessionUserStr = localStorage.getItem('canara_bank_user');
        if (!sessionUserStr || !user) {
            handleLogout();
            return;
        }
        const sessionUser = JSON.parse(sessionUserStr);
        const allUsersStr = localStorage.getItem('canara_bank_users');
        if (!allUsersStr) {
            handleLogout();
            return;
        }
        const allUsers = JSON.parse(allUsersStr);
        const userData = allUsers[sessionUser.email];

        if (userData && userData.password === reauthPassword) {
            toast({ title: 'Re-authentication Successful' });
            sessionStorage.setItem('payAndTransferAccessCount', '1'); // Reset counter
            setShowReauth(false);
            setActiveFeature(featureToActivate.current);
            featureToActivate.current = '';
        } else {
            toast({ variant: 'destructive', title: 'Incorrect Password', description: 'The password you entered is incorrect.' });
        }
    } catch(err) {
        toast({ variant: 'destructive', title: 'An error occurred.' });
    } finally {
        setReauthPassword('');
        setIsReauthing(false);
    }
  }

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setAnalysisResult(null);
  };

  const handleAnalysisComplete = (result: CalculateRiskScoreOutput) => {
    setIsLoading(false);
    setAnalysisResult(result);
  };
  
  type Feature = {
    name: string;
    icon: React.ElementType;
    component?: ReactNode;
    subItems?: {
        name: string;
        icon: React.ElementType;
        component: ReactNode;
    }[];
  };

  const features: Feature[] = [
    { name: 'Dashboard', icon: LayoutDashboard, component: <DashboardOverview handleFeatureChange={handleFeatureChange} setShowQrDialog={setShowQrDialog} /> },
    { name: 'Profile', icon: User, component: <ProfileFeature user={user} onUpdate={handleProfileUpdate} /> },
    { name: 'Pay and Transfer', icon: ShieldCheck, component: <PayAndTransferFeature onAnalysisStart={handleAnalysisStart} onAnalysisComplete={handleAnalysisComplete} isSubmitting={isLoading} analysisResult={analysisResult} /> },
    { name: 'Fixed Deposits', icon: Landmark, component: <FixedDepositsFeature user={user} savingsBalance={savingsBalance} onFdCreate={handleFdCreate} onFdPrematureClose={handleFdPrematureClose} onAccountFreeze={handleAccountFreeze} /> },
    { name: 'Savings Account', icon: Wallet, component: <SavingsAccountFeature user={user} activeFeature={activeFeature} balance={savingsBalance} /> },
    { name: 'Saving Schemes', icon: GanttChartSquare, component: <SavingSchemesFeature /> },
    { name: 'Loan Account', icon: HandCoins, component: <LoanAccountFeature /> },
    { name: 'Manage Cards', icon: CreditCard, component: <ManageCardsFeature user={user} /> },
    { name: 'Invest', icon: Briefcase, component: <InvestFeature /> },
    { name: 'Digital Loans', icon: Smartphone, component: <DigitalLoansFeature /> },
    { name: 'Manage Beneficiaries', icon: Users, component: <ManageBeneficiariesFeature user={user} handleFeatureChange={handleFeatureChange} /> },
    { 
        name: 'Services', 
        icon: Cog,
        subItems: [
            { name: 'Locker Facility', icon: Archive, component: <Placeholder feature="Locker Facility" icon={Archive}/> },
            { name: 'Order Debit/ATM Card', icon: CreditCard, component: <Placeholder feature="Order Debit/ATM Card" icon={CreditCard}/> },
            { name: 'Order Cheque Book', icon: BookCopy, component: <Placeholder feature="Order Cheque Book" icon={BookCopy}/> },
            { name: 'No-Dues Certificate', icon: FileCheck2, component: <Placeholder feature="No-Dues Certificate" icon={FileCheck2}/> },
            { name: 'Digital Permissions', icon: Signature, component: <DigitalPermissionsFeature /> },
        ] 
    },
    { name: 'Customer Support', icon: Headset, component: <HelpCenterFeature user={user} /> }
  ];

  const activeComponent = useMemo(() => {
    let active: { component?: ReactNode } | undefined;

    for (const feature of features) {
        if (feature.name === activeFeature && feature.component) {
            active = feature;
            break;
        }
        if (feature.subItems) {
            const found = feature.subItems.find(sub => sub.name === activeFeature);
            if (found) {
                active = found;
                break;
            }
        }
    }

    if (active?.component) {
        return active.component;
    }
    return <DashboardOverview handleFeatureChange={handleFeatureChange} setShowQrDialog={setShowQrDialog} />;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFeature, analysisResult, isLoading, user, savingsBalance]);

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-secondary/40 font-body overflow-x-hidden relative">
        {isSessionFrozen && (
          <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Timer className="w-16 h-16 mb-4 text-primary" />
            <h2 className="text-3xl font-bold">Session Frozen</h2>
            <p className="text-muted-foreground mt-2">Due to unusual activity, your session is locked.</p>
            <p className="text-4xl font-mono font-bold mt-6">{timeRemaining}</p>
            <p className="text-sm text-muted-foreground mt-1">Time Remaining</p>
          </div>
        )}
        <aside className={cn("flex-shrink-0 bg-card border-r flex flex-col transition-all duration-300", isSidebarCollapsed ? "w-20" : "w-64")}>
          <div className="p-4 border-b">
              <div className={cn("flex items-center gap-3 overflow-hidden", isSidebarCollapsed && "justify-center")}>
                  <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
                  <h1 className={cn("text-2xl font-bold font-headline text-primary whitespace-nowrap transition-opacity duration-200", isSidebarCollapsed ? 'opacity-0' : 'opacity-100')}>
                      CANARA BANK
                  </h1>
              </div>
          </div>
          
          {user && (
            <div className="p-4 border-b">
              <div className={cn("flex items-center gap-3 overflow-hidden", isSidebarCollapsed && "justify-center")}>
                <Avatar>
                  <AvatarImage src={user.photo} data-ai-hint="profile picture" />
                  <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={cn("transition-opacity duration-200", isSidebarCollapsed ? 'opacity-0' : 'opacity-100')}>
                  <p className="font-semibold text-card-foreground whitespace-nowrap">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            <ul className="space-y-1">
              {features.map(feature => (
                <li key={feature.name}>
                  {feature.subItems ? (
                    isSidebarCollapsed ? (
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant={feature.subItems.some(sub => sub.name === activeFeature) ? 'secondary' : 'ghost'}
                                className={cn("w-full justify-center text-base py-6")}
                              >
                                <feature.icon className="h-5 w-5" />
                                <span className="sr-only">{feature.name}</span>
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{feature.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent side="right" align="start">
                          {feature.subItems.map(subItem => (
                            <DropdownMenuItem key={subItem.name} onClick={() => handleFeatureChange(subItem.name)}>
                              <subItem.icon className="mr-2 h-4 w-4" />
                              <span>{subItem.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Collapsible
                        open={openCollapsible[feature.name] || false}
                        onOpenChange={(isOpen) => setOpenCollapsible(prev => ({ ...prev, [feature.name]: isOpen }))}
                        className="w-full"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={feature.subItems.some(sub => sub.name === activeFeature) ? 'secondary' : 'ghost'}
                            className="w-full justify-between text-base py-6"
                          >
                            <div className="flex items-center gap-3">
                              <feature.icon className="h-5 w-5" />
                              <span>{feature.name}</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", openCollapsible[feature.name] && "rotate-180")} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="pl-9 pr-2 py-1 space-y-1">
                            {feature.subItems.map(subItem => (
                              <li key={subItem.name}>
                                <Button
                                  variant={activeFeature === subItem.name ? 'secondary' : 'ghost'}
                                  className="w-full justify-start text-base py-6"
                                  onClick={() => handleFeatureChange(subItem.name)}
                                >
                                  <subItem.icon className="h-5 w-5 mr-3" />
                                  <span>{subItem.name}</span>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeFeature === feature.name ? 'secondary' : 'ghost'}
                          className={cn("w-full justify-start text-base py-6", isSidebarCollapsed && "justify-center")}
                          onClick={() => handleFeatureChange(feature.name)}
                        >
                          <feature.icon className={cn("h-5 w-5", !isSidebarCollapsed && "mr-3")} />
                          <span className={cn(isSidebarCollapsed && "sr-only")}>{feature.name}</span>
                        </Button>
                      </TooltipTrigger>
                      {isSidebarCollapsed && (
                        <TooltipContent side="right">
                          <p>{feature.name}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t mt-auto">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="ghost" onClick={handleLogout} className={cn("w-full justify-start text-base py-6", isSidebarCollapsed && "justify-center")}>
                          <LogOut className={cn("mr-3 h-5 w-5", isSidebarCollapsed && "mr-0")} />
                          <span className={cn(isSidebarCollapsed && "sr-only")}>Logout</span>
                      </Button>
                  </TooltipTrigger>
                  {isSidebarCollapsed && (
                      <TooltipContent side="right">
                          <p>Logout</p>
                      </TooltipContent>
                  )}
              </Tooltip>
          </div>
        </aside>

        <main className="flex-grow flex flex-col">
          <header className="bg-card border-b p-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(prev => !prev)} className="h-8 w-8">
                      {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  </Button>
                  <h2 className="text-xl font-bold">{activeFeature}</h2>
              </div>
            </div>
          </header>
          <div className="flex-grow p-4 md:p-8 overflow-y-auto">
            {activeComponent}
          </div>
          <footer className="text-center p-4 text-sm text-muted-foreground border-t bg-card">
            <div className="container mx-auto">
              © 2024 CANARA BANK. Secure Banking Demo.
            </div>
          </footer>
        </main>

        <InteractionMonitor activeFeature={activeFeature} />

        <Dialog open={showReauth} onOpenChange={(open) => {
            if (!open) {
                setReauthPassword('');
                setShowReauth(false);
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Re-authentication Required</DialogTitle>
                    <DialogDescription>
                        For your security, please enter your password to continue to the Pay & Transfer feature.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReauthSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reauth-password">Password</Label>
                            <Input
                                id="reauth-password"
                                type="password"
                                value={reauthPassword}
                                onChange={(e) => setReauthPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleLogout}>Logout & Exit</Button>
                        <Button type="submit" disabled={isReauthing}>
                            {isReauthing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Authenticate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle className="text-center">Receive Payment</DialogTitle>
                    <DialogDescription className="text-center">
                        Show this QR code to get paid.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${user.email}&pn=${encodeURIComponent(user.fullName)}`} 
                            alt="Your QR Code"
                            width={200}
                            height={200}
                            data-ai-hint="qr code"
                        />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-lg">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" className="w-full" onClick={() => setShowQrDialog(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={showNewDeviceAlert} onOpenChange={setShowNewDeviceAlert}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <AlertDialogTitle>Login Detected</AlertDialogTitle>
                       <div className="text-sm text-muted-foreground mt-2 space-y-2">
                          <div>
                              A login to your account was detected with the following details:
                          </div>
                          <div className="text-xs font-semibold bg-muted p-2 rounded-sm space-y-1 text-left">
                              <p><strong>Device ID:</strong> <code className="break-all">{lastLoginDeviceId || 'Unknown Device'}</code></p>
                              <p><strong>IP Address:</strong> <code className="break-all">{lastLoginIp || 'Unknown'}</code></p>
                              <p><strong>Approx. Location:</strong> <span>{lastLoginLocation || 'Unknown'}</span></p>
                          </div>
                          <div className="pt-2">
                              If you do not recognize this activity, please change your password immediately.
                          </div>
                       </div>
                  </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowNewDeviceAlert(false)}>Okay</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Chatbot />
      </div>
    </TooltipProvider>
  );
}

    
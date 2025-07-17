
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useRef, type KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Copy, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const securityQuestions = [
  "What is the name of your first school?",
  "What is the name of your best friend?",
  "What is your pet's name?",
  "What is your mother's maiden name?",
  "What is your favorite color?",
];

const formSchema = z
  .object({
    fullName: z.string().min(2, { message: "Full name is required." }),
    email: z.string().email({ message: "Invalid email address." }),
    mobile: z
      .string()
      .regex(/^\d{10}$/, { message: "Mobile number must be 10 numeric digits." }),
    dob: z.date({ required_error: "Your date of birth is required." }),
    gender: z
      .string({ required_error: "Please select your gender." })
      .min(1, "Please select your gender."),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
    securityQuestion: z
      .string({ required_error: "Please select a security question." })
      .min(1, { message: "Please select a security question." }),
    securityAnswer: z.string().min(1, { message: "Security answer is required." }),
    typingSample: z
      .string()
      .min(20, { message: "Please type the full sentence for baseline analysis." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const sampleText = "The quick brown fox jumps over the lazy dog.";

const wordList = [
  "apple",
  "banana",
  "cherry",
  "date",
  "elderberry",
  "fig",
  "grape",
  "honeydew",
  "kiwi",
  "lemon",
  "mango",
  "nectarine",
  "orange",
  "papaya",
  "quince",
  "raspberry",
  "strawberry",
  "tangerine",
  "ugli",
  "vanilla",
  "watermelon",
  "xigua",
  "yuzu",
  "zucchini",
  "able",
  "baker",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
  "golf",
  "hotel",
  "india",
  "juliett",
  "kilo",
  "lima",
  "mike",
  "november",
  "oscar",
  "papa",
  "quebec",
  "romeo",
  "sierra",
  "tango",
  "uniform",
  "victor",
  "whiskey",
  "xray",
  "yankee",
  "zulu",
];

interface NewUser {
  fullName: string;
  mobile: string;
  dob: string;
  gender: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  mnemonic: string;
  baseline: {
    keyHoldTimes: number[];
  };
  dobUpdateCount: number;
  failedLoginAttempts: number;
  lockoutUntil?: string;
  voicePassphrase?: string;
  voiceSample?: string;
}

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [keyHoldTimes, setKeyHoldTimes] = useState<number[]>([]);
  const keyDownTime = useRef<Record<string, number>>({});
  const [mnemonic, setMnemonic] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.crypto) {
      const generatedWords: string[] = [];
      const randomMnemonicValues = new Uint32Array(12);
      window.crypto.getRandomValues(randomMnemonicValues);
      for (let i = 0; i < 12; i++) {
        const idx = randomMnemonicValues[i] % wordList.length;
        generatedWords.push(wordList[idx]);
      }
      setMnemonic(generatedWords.join(" "));
    }
  }, []);

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast({
      title: "Copied!",
      description: "Mnemonic phrase copied to clipboard.",
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      securityAnswer: "",
      typingSample: "",
    },
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!keyDownTime.current[e.key]) {
      keyDownTime.current[e.key] = e.timeStamp;
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (keyDownTime.current[e.key]) {
      const duration = (e.timeStamp - keyDownTime.current[e.key]) / 1000;
      setKeyHoldTimes((prev) => [...prev, parseFloat(duration.toFixed(4))]);
      delete keyDownTime.current[e.key];
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    if (keyHoldTimes.length < 10) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Not enough behavioral data captured. Please type naturally.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem("canara_bank_users") || "{}");
      if (stored[values.email]) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "An account with this email already exists.",
        });
        setIsLoading(false);
        return;
      }

      const newUser: NewUser = {
        fullName: values.fullName,
        mobile: values.mobile,
        dob: values.dob.toISOString(),
        gender: values.gender,
        password: values.password,
        securityQuestion: values.securityQuestion,
        securityAnswer: values.securityAnswer.trim().toLowerCase(),
        mnemonic: mnemonic,
        baseline: {
          keyHoldTimes: keyHoldTimes.slice(-20),
        },
        dobUpdateCount: 0,
        failedLoginAttempts: 0,
      };

      stored[values.email] = newUser;
      localStorage.setItem("canara_bank_users", JSON.stringify(stored));

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please log in.",
      });
      router.push("/");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during registration.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create an account to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd-MM-yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown-buttons"
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                 <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Recovery Mnemonic Phrase</FormLabel>
              <FormDescription>
                Save this phrase in a secure place. It is the only way to recover your account if you forget your password and security question.
              </FormDescription>
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <p className="flex-1 font-mono text-sm">{mnemonic}</p>
                <Button type="button" variant="ghost" size="icon" onClick={copyMnemonic}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="securityQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Question</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securityQuestions.map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="securityAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Answer</FormLabel>
                    <FormControl>
                      <Input placeholder="Your answer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="typingSample"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Behavioral Baseline</FormLabel>
                  <FormDescription>
                    Type the following sentence to establish your unique typing pattern for security:
                  </FormDescription>
                  <p className="text-sm p-2 bg-muted rounded-md font-mono">{sampleText}</p>
                  <FormControl>
                    <Input
                      placeholder="Start typing here..."
                      {...field}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

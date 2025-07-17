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
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

const answerSchema = z.object({
  answer: z.string().min(1, { message: "Answer is required." }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'question'>('email');
  const [userEmail, setUserEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const answerForm = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    defaultValues: { answer: "" },
  });

  function handleEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true);
    try {
      const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
      const user = storedUsers[values.email];

      if (user && user.securityQuestion) {
        setUserEmail(values.email);
        setSecurityQuestion(user.securityQuestion);
        setStep('question');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No account or security question found for this email.",
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

  function handleAnswerSubmit(values: z.infer<typeof answerSchema>) {
    setIsLoading(true);
    try {
        const storedUsers = JSON.parse(localStorage.getItem('canara_bank_users') || '{}');
        const user = storedUsers[userEmail];

        if (user && user.securityAnswer === values.answer.trim().toLowerCase()) {
            localStorage.setItem('canara_bank_user', JSON.stringify({ email: userEmail }));
            toast({
                title: "Success",
                description: "You have been logged in successfully.",
            });
            router.push("/dashboard");
        } else {
            toast({
                variant: "destructive",
                title: "Incorrect Answer",
                description: "The security answer is not correct. Please try again.",
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

  if (step === 'question') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Question</CardTitle>
                <CardDescription>Answer the question below to recover your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...answerForm}>
                    <form onSubmit={answerForm.handleSubmit(handleAnswerSubmit)} className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-sm font-medium">{securityQuestion}</p>
                           <FormField
                            control={answerForm.control}
                            name="answer"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input placeholder="Your answer" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Login
                        </Button>
                    </form>
                </Form>
            </CardContent>
             <CardFooter className="flex justify-center">
                <Button variant="link" onClick={() => setStep('email')}>Back to email</Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to start the recovery process.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
            <FormField
              control={emailForm.control}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

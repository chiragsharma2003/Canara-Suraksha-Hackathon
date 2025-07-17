'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { CalculateRiskScoreOutput } from "@/ai/flows/calculate-risk-score";
import { Progress } from "./ui/progress";
import { ShieldAlert, ShieldCheck, ShieldX, CheckCircle, AlertTriangle, XCircle, List } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface RiskAnalysisProps {
  isLoading: boolean;
  result: CalculateRiskScoreOutput | null;
}

const getRiskProfile = (score: number) => {
  if (score < 0.4) {
    return { 
      level: 'Low', 
      color: 'text-green-600',
      bgColor: 'bg-green-500', 
      icon: ShieldCheck, 
      message: 'Transaction Approved', 
      messageIcon: CheckCircle 
    };
  }
  if (score < 0.7) {
    return { 
      level: 'Medium', 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-500', 
      icon: ShieldAlert, 
      message: 'Step-Up Authentication Required', 
      messageIcon: AlertTriangle 
    };
  }
  return { 
    level: 'High', 
    color: 'text-red-600', 
    bgColor: 'bg-red-500', 
    icon: ShieldX, 
    message: 'Transaction Blocked', 
    messageIcon: XCircle 
  };
};

export function RiskAnalysis({ isLoading, result }: RiskAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full">
                <List className="w-8 h-8 text-primary"/>
            </div>
            <CardTitle className="mt-4">Risk Analysis</CardTitle>
            <CardDescription>Your session's risk assessment will appear here after you submit a transaction.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Ready to analyze your behavioral biometrics.</p>
        </CardContent>
      </Card>
    );
  }

  const profile = getRiskProfile(result.riskScore);
  const scorePercentage = result.riskScore * 100;

  return (
    <Card className="shadow-lg animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Analysis Complete</CardTitle>
                <CardDescription>Real-time behavioral risk assessment.</CardDescription>
            </div>
            <div className={cn("flex items-center gap-2 font-bold p-2 rounded-md", profile.color, profile.bgColor.replace('bg-','bg-opacity-10'))}>
                <profile.icon className="w-5 h-5" />
                <span>{profile.level} Risk</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
            <span className={cn("text-2xl font-bold", profile.color)}>{scorePercentage.toFixed(0)}/100</span>
          </div>
          <Progress value={scorePercentage} className={cn("[&>div]:bg-primary", profile.bgColor)} />
        </div>

        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contributing Factors</h3>
            <ul className="space-y-2 text-sm">
                {result.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 p-2 rounded-md bg-secondary/50">
                        <div className="w-4 h-4 mt-0.5 rounded-full bg-accent flex-shrink-0" />
                        <span>{reason}</span>
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
      <CardFooter className={cn("p-4 rounded-b-lg", profile.bgColor.replace('bg-', 'bg-opacity-20'))}>
        <div className="flex items-center gap-3 w-full">
          <profile.messageIcon className={cn("w-6 h-6", profile.color)} />
          <p className={cn("font-semibold", profile.color)}>{profile.message}</p>
        </div>
      </CardFooter>
    </Card>
  );
}

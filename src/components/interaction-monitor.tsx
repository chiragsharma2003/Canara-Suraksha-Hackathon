
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, X, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface InteractionMonitorProps {
  activeFeature: string;
}

export function InteractionMonitor({ activeFeature }: InteractionMonitorProps) {
  const [sessionTime, setSessionTime] = useState(0);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prevTime => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Simulate risk level changes for demo
  useEffect(() => {
    const riskChanger = setInterval(() => {
        const rand = Math.random();
        if (rand < 0.8) setRiskLevel('LOW');
        else if (rand < 0.95) setRiskLevel('MEDIUM');
        else setRiskLevel('HIGH');
    }, 15000); // change every 15 seconds

    return () => clearInterval(riskChanger);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const getRiskProfile = () => {
      switch(riskLevel) {
          case 'LOW':
              return { color: 'text-green-600', badgeVariant: 'outline', icon: ShieldCheck, text: 'LOW' };
          case 'MEDIUM':
              return { color: 'text-amber-600', badgeVariant: 'secondary', icon: ShieldAlert, text: 'MEDIUM' };
          case 'HIGH':
              return { color: 'text-red-600', badgeVariant: 'destructive', icon: ShieldX, text: 'HIGH' };
      }
  }

  const profile = getRiskProfile();

  if (isCollapsed) {
    return (
      <div className="fixed top-4 right-4 z-50 hidden lg:block">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="rounded-full shadow-lg"
        >
          <Activity className="h-5 w-5" />
          <span className="sr-only">Show Session Monitor</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 hidden lg:block">
      <Card className="shadow-xl animate-in fade-in-50">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-primary" />
                 <CardTitle className="text-base">Behavioral Analysis</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-7 w-7">
              <X className="h-4 w-4" />
              <span className="sr-only">Collapse Session Monitor</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-sm">
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Typing Speed:</span>
                    <span className="font-medium">Normal</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Mouse Pattern:</span>
                    <span className="font-medium">Consistent</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Session Time:</span>
                    <span className="font-medium font-mono">{formatTime(sessionTime)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Trust:</span>
                    <span className="font-medium">Trusted</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                 <div className="flex justify-between items-center">
                    <span className="font-semibold">Risk Level:</span>
                    <Badge variant={profile.badgeVariant} className={cn(profile.color, 'font-bold')}>
                        <profile.icon className="mr-1.5 h-4 w-4" />
                        {profile.text}
                    </Badge>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

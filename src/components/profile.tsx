'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required." }),
  mobile: z.string().optional(),
  dob: z.date().optional(),
  gender: z.string().optional(),
});

interface UserProfile {
  email: string;
  fullName: string;
  photo?: string;
  mobile?: string;
  dob?: string;
  gender?: string;
  dobUpdateCount?: number;
}

interface ProfileProps {
  user: UserProfile | null;
  onUpdate: (updatedUser: UserProfile) => void;
}

export function Profile({ user, onUpdate }: ProfileProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const MAX_DOB_UPDATES = 3;

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      mobile: user?.mobile || '',
      dob: user?.dob ? new Date(user.dob) : undefined,
      gender: user?.gender || '',
    },
  });

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      // Reset the form with the latest user data. This is important
      // because the user prop may be null on initial render.
      form.reset({
        fullName: user.fullName,
        mobile: user.mobile || '',
        dob: user.dob ? new Date(user.dob) : undefined,
        gender: user.gender || '',
      });
    }
  }, [user, form]);

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoDataUrl = reader.result as string;
        if (currentUser) {
          const updatedUser = { ...currentUser, photo: photoDataUrl };
          updateProfile(updatedUser, false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (currentUser) {
        const originalDob = currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : undefined;
        const newDob = values.dob ? values.dob.toISOString().split('T')[0] : undefined;
        const dobHasChanged = originalDob !== newDob;

        const updateCount = currentUser.dobUpdateCount ?? 0;
        if (dobHasChanged && updateCount >= MAX_DOB_UPDATES) {
            toast({
                variant: 'destructive',
                title: 'Update Limit Reached',
                description: 'You cannot change your date of birth more than 3 times.',
            });
            return;
        }

        const updatedUser = { 
            ...currentUser, 
            fullName: values.fullName,
            dob: values.dob?.toISOString(),
            gender: values.gender,
        };
        updateProfile(updatedUser, dobHasChanged);
    }
  };

  const updateProfile = (updatedUser: UserProfile, dobHasChanged: boolean) => {
    setIsSaving(true);
    try {
        const allUsersStr = localStorage.getItem('canara_bank_users');
        if (allUsersStr && currentUser?.email) {
            const allUsers = JSON.parse(allUsersStr);
            const userToUpdate = allUsers[currentUser.email] || {};

            let newUpdateCount = userToUpdate.dobUpdateCount ?? 0;
            if (dobHasChanged) {
              newUpdateCount++;
            }

            allUsers[currentUser.email] = {
                ...userToUpdate,
                fullName: updatedUser.fullName,
                photo: updatedUser.photo,
                mobile: updatedUser.mobile,
                dob: updatedUser.dob,
                gender: updatedUser.gender,
                dobUpdateCount: newUpdateCount,
            };
            localStorage.setItem('canara_bank_users', JSON.stringify(allUsers));
            
            const finalUpdatedUser = { ...updatedUser, dobUpdateCount: newUpdateCount };
            setCurrentUser(finalUpdatedUser);
            onUpdate(finalUpdatedUser);
            toast({
                title: 'Profile Updated',
                description: 'Your information has been saved successfully.',
            });
        }
    } catch (e) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not save your changes.',
        });
    } finally {
        setIsSaving(false);
    }
  }


  if (!currentUser) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Loading user profile...</p>
            </CardContent>
        </Card>
    );
  }

  const dobUpdateCount = currentUser.dobUpdateCount ?? 0;
  const canUpdateDob = dobUpdateCount < MAX_DOB_UPDATES;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="relative">
                <Avatar className="w-20 h-20">
                    <AvatarImage src={currentUser.photo} data-ai-hint="profile picture"/>
                    <AvatarFallback className="text-3xl">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 block bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90">
                    <Camera className="w-4 h-4" />
                    <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload}/>
                </label>
            </div>
            <div>
                <CardTitle className="text-3xl">{currentUser.fullName}</CardTitle>
                <CardDescription>
                  {currentUser.email}
                  {currentUser.mobile && ` · ${currentUser.mobile}`}
                  {currentUser.dob && ` · ${format(new Date(currentUser.dob), "dd-MM-yyyy")}`}
                  {currentUser.gender && ` · ${currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)}`}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Your mobile number" 
                      {...field} 
                      value={field.value || ''} 
                      disabled={!!field.value}
                    />
                  </FormControl>
                  {field.value && (
                    <FormDescription>
                      For security reasons, your mobile number cannot be changed.
                    </FormDescription>
                  )}
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
                          disabled={!canUpdateDob}
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
                  {canUpdateDob ? (
                    <FormDescription>
                      You can update your date of birth {MAX_DOB_UPDATES - dobUpdateCount} more time(s).
                    </FormDescription>
                  ) : (
                     <FormDescription className="text-destructive">
                      You have reached the maximum number of updates for your date of birth.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
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
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

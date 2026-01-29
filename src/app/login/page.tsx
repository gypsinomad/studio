'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, initiateEmailSignIn } from '@/firebase';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';


export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('admin@spiceroute.com');
  const [password, setPassword] = useState('password');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
        await initiateEmailSignIn(auth, email, password);
        // onAuthStateChanged will handle the redirect
    } catch (error: any) {
         let description = 'An unexpected error occurred.';
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    description = 'Invalid email or password.';
                    break;
                default:
                    description = error.message;
                    break;
            }
        }
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description,
        });
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
      return (
         <div className="flex min-h-screen items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Sprout className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">SpiceRoute CRM</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

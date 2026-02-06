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
import { useAuth, useUser, initiateEmailSignUp } from '@/firebase';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is already logged in and not in the process of signing up
  useEffect(() => {
    if (!isUserLoading && user && !isSubmitting) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, isSubmitting]);


  const handleAuthError = (error: any) => {
    let description = 'An unexpected error occurred.';
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = 'This email address is already in use by another account.';
                break;
            case 'auth/weak-password':
                description = 'The password is too weak. It must be at least 6 characters long.';
                break;
            case 'auth/invalid-email':
                description = 'The email address is not valid.';
                break;
            default:
                description = error.message;
                break;
        }
    }
    toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description,
    });
    setIsSubmitting(false);
  }

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) return;
    setIsSubmitting(true);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // The useCurrentUser hook will automatically create the Firestore document.
        // Once profile is updated, onAuthStateChanged will trigger with the new info.
        toast({
            title: "Account Created!",
            description: "Welcome to SpiceRoute CRM. Redirecting you...",
        });
        router.replace('/dashboard');

    } catch (error) {
        handleAuthError(error);
    }
  };
  
  if (isUserLoading || (user && !isSubmitting)) {
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
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Join SpiceRoute CRM to manage your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="••••••••"
                required 
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting} id="email-signup-button">
              {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
              Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-primary">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

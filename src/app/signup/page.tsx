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
import { useAuth, useUser, useFirestore, initiateEmailSignUp, setDocumentNonBlocking } from '@/firebase';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This effect listens for a newly created user from onAuthStateChanged
  // and then creates their profile document in Firestore.
  useEffect(() => {
    if (user && isSubmitting) { // only run for users being created
      createUserProfile(user);
    }
  }, [user]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user && !isSubmitting) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, isSubmitting]);

  const createUserProfile = async (firebaseUser: FirebaseAuthUser) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    
    const newUserProfile = {
      authUid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: displayName || firebaseUser.displayName || 'New User',
      role: 'salesExecutive', // Default role for new sign-ups
      isActive: true,
      createdAt: serverTimestamp(),
      companyIds: [], // New users start with no companies
    };

    // Use a non-blocking write to create the user profile
    setDocumentNonBlocking(userRef, newUserProfile, {});
    
    toast({
        title: "Account Created!",
        description: "Welcome to SpiceRoute CRM. Redirecting you to the dashboard...",
    });

    // The onAuthStateChanged listener in the provider will eventually redirect
    // but we can do it here for a faster user experience.
    router.replace('/dashboard');
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // We don't await this. The useEffect will catch the new user state.
    initiateEmailSignUp(auth, email, password);
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
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-spin" />}
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

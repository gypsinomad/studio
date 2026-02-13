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
import { useAuth, useUser, useFirestore } from '@/firebase';
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { logUserActivity } from '@/lib/user-activity';


const GoogleSignInButton = ({ onClick, disabled }: { onClick: () => void, disabled: boolean }) => (
    <Button variant="outline" className="w-full" onClick={onClick} disabled={disabled} id="google-sign-in-button">
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 58.2l-67.4 66.2C322.2 99.8 287.4 82 248 82c-84.3 0-152.3 68.1-152.3 152.3s68 152.3 152.3 152.3c99.1 0 133.2-82.9 137.7-124.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
        Sign in with Google
    </Button>
);


export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth || !firestore) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Unable to initialize authentication. Please refresh the page.",
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await logUserActivity(firestore, 'LogIn', 'User Logged In', `User ${credential.user.email} logged in successfully.`);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'Invalid email address format',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again',
        'auth/popup-closed-by-user': 'The sign-in window was closed. Please try again.',
      };
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessages[error.code] || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) return;
    setIsSubmitting(true);
    try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await logUserActivity(firestore, 'LogIn', 'User Logged In', `User ${result.user.email} logged in via Google successfully.`);
        router.push('/dashboard');
    } catch (error: any) {
        console.error('Google login error:', error);
         const errorMessages: Record<string, string> = {
            'auth/popup-closed-by-user': 'The sign-in window was closed. Please try again.',
         };
         toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessages[error.code] || 'An unexpected error occurred during Google sign-in.',
         });
    } finally {
        setIsSubmitting(false);
    }
  }


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
          <div className="grid gap-4">
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
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting} id="email-login-button">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>

            <GoogleSignInButton onClick={handleGoogleLogin} disabled={isSubmitting} />

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline hover:text-primary">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

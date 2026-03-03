'use client';
import { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { RefreshCcw, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Emergency Error Boundary to catch high-level Firestore crashes.
 */
export class FirestoreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const message = error.message || '';
    const name = error.name || '';

    const isCriticalInternalFailure =
      message.includes('INTERNAL ASSERTION FAILED') ||
      name === 'FirebaseError' && message.toLowerCase().includes('internal');

    // Only enter Recovery Mode for critical internal failures or unexpected non-Firebase errors.
    if (!isCriticalInternalFailure && name === 'FirebaseError') {
      console.error('[FirestoreErrorBoundary] Non-critical Firebase error suppressed:', error);
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-stone-50 p-6 text-center">
          <Card className="max-w-md w-full shadow-2xl border-stone-200">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertCircle className="size-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-headline font-bold text-stone-900">Recovery Mode</CardTitle>
              <CardDescription className="text-stone-500 font-medium">
                The application encountered a critical state error during data synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-stone-100 rounded-xl text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Diagnostic Info</p>
                <p className="text-xs font-mono text-stone-600 line-clamp-3">
                  {this.state.error?.message || 'Unexpected state mismatch in Firestore SDK.'}
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full h-12 rounded-xl text-base font-bold shadow-spice-200"
              >
                <RefreshCcw className="mr-2 size-5" /> Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

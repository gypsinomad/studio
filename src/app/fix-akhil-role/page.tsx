'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';
import { makeAkhilSuperAdmin } from '@/firebase/firestore/make-akhil-superadmin';
import { toast } from 'sonner';

export default function FixAkhilRolePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const fixRole = async () => {
    setStatus('loading');
    try {
      const result = await makeAkhilSuperAdmin();
      setResult(result);
      if (result.success) {
        setStatus('success');
        toast.success('akhilvenugopal promoted to Superadmin successfully!');
      } else {
        setStatus('error');
        toast.error(`Failed to promote: ${result.error}`);
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error.message });
      toast.error('An error occurred while promoting user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Fix akhilvenugopal Role</CardTitle>
          <p className="text-sm text-muted-foreground">
            Promote akhilvenugopal to Superadmin role
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>This will promote akhilvenugopal@gmail.com to Superadmin</span>
                </div>
              </div>
              <Button 
                onClick={fixRole} 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Promote to Superadmin
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Promoting user...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Successfully promoted to Superadmin!</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>User ID: {result?.userId}</p>
                <p>Previous Role: {result?.previousRole}</p>
                <p>New Role: superadmin</p>
              </div>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error: {result?.error}</span>
                </div>
              </div>
              <Button 
                onClick={() => setStatus('idle')}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

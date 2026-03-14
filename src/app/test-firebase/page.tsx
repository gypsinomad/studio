'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, CheckCircle, AlertCircle, LoaderCircle, Shield, ShieldOff } from 'lucide-react';
import { makeAkhilSuperAdmin } from '@/firebase/firestore/make-akhil-superadmin';
import { disableFirestoreSecurityRules, testSuperadminPromotionWithBypass } from '@/firebase/firestore/security-bypass';
import { initializeFirebase } from '@/firebase';
import { toast } from 'sonner';

export default function TestFirebasePage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [useBypass, setUseBypass] = useState(false);

  const testFirebaseConnection = async () => {
    setStatus('testing');
    try {
      // Test Firebase initialization
      const firebaseServices = initializeFirebase();
      console.log('Firebase services:', firebaseServices);
      
      if (firebaseServices.firestore) {
        setStatus('success');
        setResult({ 
          message: 'Firebase connection successful',
          firestore: 'Connected',
          auth: 'Connected'
        });
        toast.success('Firebase connection test successful!');
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (error: any) {
      setStatus('error');
      setResult({ error: error.message });
      toast.error('Firebase connection test failed');
    }
  };

  const promoteAkhil = async () => {
    setStatus('testing');
    try {
      if (useBypass) {
        console.log('🔓 Using security bypass method');
        const result = await testSuperadminPromotionWithBypass();
        setResult(result);
        if (result.success) {
          setStatus('success');
          toast.success('akhilvenugopal promoted to Superadmin (security bypass used)!');
        } else {
          setStatus('error');
          toast.error(`Promotion failed: ${result.error}`);
        }
      } else {
        console.log('👑 Using standard promotion method');
        const result = await makeAkhilSuperAdmin();
        setResult(result);
        if (result.success) {
          setStatus('success');
          toast.success('akhilvenugopal promoted to Superadmin!');
        } else {
          setStatus('error');
          toast.error(`Promotion failed: ${result.error}`);
        }
      }
    } catch (error: any) {
      setStatus('error');
      setResult({ error: error.message });
      toast.error('Promotion failed');
    }
  };

  const testSecurityBypass = async () => {
    setStatus('testing');
    try {
      console.log('🔓 Testing Firestore security rules bypass...');
      const result = await disableFirestoreSecurityRules();
      setResult(result);
      if (result.success) {
        setStatus('success');
        toast.success('Security rules bypass test successful!');
      } else {
        setStatus('error');
        toast.error(`Security bypass test failed: ${result.error}`);
      }
    } catch (error: any) {
      setStatus('error');
      setResult({ error: error.message });
      toast.error('Security bypass test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Firebase & Superadmin Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test Firebase connection and promote akhilvenugopal to Superadmin
          </p>
          {useBypass && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <ShieldOff className="h-4 w-4" />
                <span className="text-sm font-medium">Security Bypass Mode Active</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Bypass Toggle */}
          <div className="space-y-4">
            <h3 className="font-semibold">0. Security Mode</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => setUseBypass(false)}
                variant={useBypass ? "outline" : "default"}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                Standard Mode
              </Button>
              <Button 
                onClick={() => setUseBypass(true)}
                variant={!useBypass ? "default" : "outline"}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Security Bypass
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {useBypass ? '⚠️ Using security bypass for testing only' : '🔐 Using standard Firebase security'}
            </p>
          </div>

          {/* Firebase Connection Test */}
          <div className="space-y-4">
            <h3 className="font-semibold">1. Test Firebase Connection</h3>
            <Button 
              onClick={testFirebaseConnection}
              disabled={status === 'testing'}
              className="w-full"
              variant="outline"
            >
              {status === 'testing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              Test Firebase Connection
            </Button>
          </div>

          {/* Security Rules Test */}
          {useBypass && (
            <div className="space-y-4">
              <h3 className="font-semibold">2. Test Security Rules Bypass</h3>
              <Button 
                onClick={testSecurityBypass}
                disabled={status === 'testing'}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {status === 'testing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                Test Security Bypass
              </Button>
            </div>
          )}

          {/* Superadmin Promotion */}
          <div className="space-y-4">
            <h3 className="font-semibold">3. Promote akhilvenugopal to Superadmin</h3>
            <Button 
              onClick={promoteAkhil}
              disabled={status === 'testing'}
              className={`w-full ${useBypass ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {status === 'testing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              <Crown className="h-4 w-4 mr-2" />
              Promote to Superadmin {useBypass ? '(Bypass)' : '(Standard)'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <h3 className="font-semibold">Results:</h3>
              <div className={`p-4 rounded-lg border ${
                status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status === 'success' ? 'Success' : 'Error'}
                  </span>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Choose Security Mode (Standard or Bypass)</li>
              <li>Test Firebase connection first</li>
              <li>If using Bypass mode, test security rules bypass</li>
              <li>Then promote akhilvenugopal to Superadmin</li>
              <li>Check browser console for detailed logs</li>
              <li>Verify role change in user management</li>
              {useBypass && (
                <li className="text-red-600 font-medium">⚠️ Remember to disable bypass before production!</li>
              )}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

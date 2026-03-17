'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleFixPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'fixing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const checkCurrentRole = async () => {
    setStatus('checking');
    try {
      // Use relative URL instead of absolute URL
      const response = await fetch('/api/role-diagnostic?action=diagnose&email=akhilvenugopal@gmail.com', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      setStatus('idle');
      toast.success('Role check completed');
    } catch (error: any) {
      console.error('Error checking role:', error);
      setStatus('error');
      setResult({ 
        error: error.message,
        details: 'Failed to connect to API. Please make sure the server is running.',
        suggestion: 'Try refreshing the page or check the server logs.'
      });
      toast.error(`Failed to check role: ${error.message}`);
    }
  };

  const applyAdminFix = async () => {
    setStatus('fixing');
    try {
      // Use relative URL instead of absolute URL
      const response = await fetch('/api/role-diagnostic?action=fix&email=akhilvenugopal@gmail.com', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      setStatus('success');
      
      // Re-check role after fix
      setTimeout(() => {
        checkCurrentRole();
      }, 2000);
      
      toast.success('Admin role applied successfully');
    } catch (error: any) {
      console.error('Error applying fix:', error);
      setStatus('error');
      setResult({ 
        error: error.message,
        details: 'Failed to connect to API. Please make sure the server is running.',
        suggestion: 'Try refreshing the page or check the server logs.'
      });
      toast.error(`Failed to apply fix: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Quick Role Fix - Bypass Service Worker</CardTitle>
          <p className="text-sm text-muted-foreground">
            Direct API calls to fix role issues without service worker interference
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Check Current Role */}
          <div className="space-y-4">
            <h3 className="font-semibold">1. Check Current Role</h3>
            <Button 
              onClick={checkCurrentRole}
              disabled={status === 'checking'}
              className="w-full"
              variant="outline"
            >
              {status === 'checking' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              Check Current Role
            </Button>
          </div>

          {/* Apply Admin Fix */}
          <div className="space-y-4">
            <h3 className="font-semibold">2. Apply Admin Role</h3>
            <Button 
              onClick={applyAdminFix}
              disabled={status === 'fixing' || status === 'checking'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {status === 'fixing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              Apply Admin Role
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <h3 className="font-semibold">Results</h3>
              <div className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 
                result.error ? 'bg-red-50 border-red-200' : 
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : result.error ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Success' : result.error ? 'Error' : 'Information'}
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  {result.error && (
                    <div>
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  {result.details && (
                    <div>
                      <strong>Details:</strong> {result.details}
                    </div>
                  )}
                  {result.suggestion && (
                    <div>
                      <strong>Suggestion:</strong> {result.suggestion}
                    </div>
                  )}
                  {result.data && (
                    <div>
                      <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {!result.error && !result.data && (
                    <div>
                      <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click "Check Current Role" to see current status</li>
              <li>If role is not admin, click "Apply Admin Role"</li>
              <li>Wait for automatic role check after fix</li>
              <li>Test CRM functionality (create lead, order, etc.)</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> This bypasses service worker cache issues with direct API calls.
            </p>
            {result?.error && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>API Error Detected:</strong> If the API calls continue to fail, try the alternative method:
                </p>
                <Button 
                  onClick={() => window.location.href = '/elevate-akhil'}
                  className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700"
                  variant="outline"
                  size="sm"
                >
                  Use Alternative Role Elevation Tool
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

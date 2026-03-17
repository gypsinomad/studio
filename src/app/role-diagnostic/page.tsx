'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertTriangle, Shield, CheckCircle, LoaderCircle, Bug, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function RoleDiagnosticPage() {
  const [status, setStatus] = useState<'idle' | 'diagnosing' | 'fixing' | 'success' | 'error'>('idle');
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  // Clear service worker cache on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
      
      // Clear all caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      });
    }
  }, []);

  const runDiagnosis = async () => {
    setStatus('diagnosing');
    try {
      const response = await fetch('/api/role-diagnostic?action=diagnose&email=akhilvenugopal@gmail.com', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const diagnosticResult = await response.json();
      setDiagnosis(diagnosticResult);
      setStatus('idle');
      toast.success('Role diagnosis completed');
    } catch (error: any) {
      console.error('Error during diagnosis:', error);
      setStatus('error');
      setDiagnosis({ error: error.message });
      toast.error(`Diagnosis failed: ${error.message}`);
    }
  };

  const applyStickyFix = async () => {
    setStatus('fixing');
    try {
      const response = await fetch('/api/role-diagnostic?action=fix&email=akhilvenugopal@gmail.com', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const fixResult = await response.json();
      setResult(fixResult);
      setStatus('success');
      
      // Re-run diagnosis after fix
      setTimeout(async () => {
        const postFixDiagnosis = await fetch('/api/role-diagnostic?action=diagnose&email=akhilvenugopal@gmail.com', {
          method: 'GET',
        });
        
        if (!postFixDiagnosis.ok) {
          throw new Error(`HTTP ${postFixDiagnosis.status}: ${postFixDiagnosis.statusText}`);
        }
        
        const postFixResult = await postFixDiagnosis.json();
        setDiagnosis(postFixResult);
      }, 2000);
      
      toast.success('Role made sticky - Admin privileges permanent');
    } catch (error: any) {
      console.error('Error applying sticky fix:', error);
      setStatus('error');
      setResult({ error: error.message });
      toast.error(`Failed to apply sticky fix: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Bug className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Role Overwrite Diagnostic Tool</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive tool to identify and fix role field overwrite issues
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diagnostic Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Search className="h-5 w-5" />
              1. Comprehensive Role Diagnosis
            </h3>
            <Button 
              onClick={runDiagnosis}
              disabled={status === 'diagnosing'}
              className="w-full"
              variant="outline"
            >
              {status === 'diagnosing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              <AlertTriangle className="h-4 w-4 mr-2" />
              Run Role Diagnosis
            </Button>
          </div>

          {/* Sticky Fix */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              2. Apply Sticky Role Fix
            </h3>
            <Button 
              onClick={applyStickyFix}
              disabled={status === 'fixing' || status === 'diagnosing'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {status === 'fixing' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              <Shield className="h-4 w-4 mr-2" />
              Make Role Sticky (Permanent Admin)
            </Button>
          </div>

          {/* Results Display */}
          {diagnosis && (
            <div className="space-y-4">
              <h3 className="font-semibold">Diagnosis Results</h3>
              <div className={`p-4 rounded-lg border ${
                diagnosis.issue === 'USER_NOT_FOUND' ? 'bg-red-50 border-red-200' : 
                diagnosis.issue === 'DIAGNOSIS_ERROR' ? 'bg-red-50 border-red-200' : 
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Current Role:</span>
                    <span className={`font-bold ${
                      diagnosis.currentRole === 'admin' ? 'text-green-600' : 
                      diagnosis.currentRole === 'viewer' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {diagnosis.currentRole}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">User Email:</span>
                    <span className="font-bold">{diagnosis.userEmail}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Last Updated:</span>
                    <span className="font-bold">{diagnosis.lastUpdated}</span>
                  </div>
                  
                  {diagnosis.roleChangeActivities && diagnosis.roleChangeActivities.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-red-600">⚠️ Role Changes Detected:</span>
                      <span className="text-sm"> {diagnosis.roleChangeActivities.length} activities in last 24h</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Potential Issues:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {diagnosis.potentialIssues.map((issue: string, index: number) => (
                        <li key={index} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Recommendations:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      {diagnosis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-blue-600">{rec}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fix Results */}
          {result && (
            <div className="space-y-4">
              <h3 className="font-semibold">Sticky Fix Results</h3>
              <div className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="text-sm">
                  {result.success ? (
                    <div>
                      <p><strong>Role:</strong> {result.role}</p>
                      <p><strong>Protected:</strong> {result.protected ? 'Yes' : 'No'}</p>
                      <p><strong>Fixed At:</strong> {new Date().toLocaleString()}</p>
                    </div>
                  ) : (
                    <p><strong>Error:</strong> {result.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">How to Use This Tool:</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>Run "Comprehensive Diagnosis" to identify what's happening with your role</li>
              <li>If issues are found, apply "Sticky Role Fix" to make admin role permanent</li>
              <li>After fix, test CRM functionality to ensure all features work</li>
              <li>Monitor for any further role changes using the diagnostic tool</li>
            </ol>
            <p className="text-xs text-purple-600 mt-2">
              <strong>Note:</strong> This tool adds protection flags to prevent role overwrites and provides comprehensive diagnostics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

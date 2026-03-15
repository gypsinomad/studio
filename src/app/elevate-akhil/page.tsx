'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Shield, AlertCircle, CheckCircle, LoaderCircle } from 'lucide-react';
import { elevateAkhilToAdmin, checkUserPermissions } from '@/firebase/firestore/elevate-akhil-admin';
import { toast } from 'sonner';

export default function ElevateAkhilPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'elevating' | 'success' | 'error'>('idle');
  const [permissions, setPermissions] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const checkCurrentPermissions = async () => {
    setStatus('checking');
    try {
      const userPermissions = await checkUserPermissions();
      setPermissions(userPermissions);
      setStatus('idle');
      toast.success('Permissions checked successfully');
    } catch (error: any) {
      console.error('Error checking permissions:', error);
      setStatus('error');
      toast.error(`Error checking permissions: ${error.message}`);
    }
  };

  const performElevation = async () => {
    setStatus('elevating');
    try {
      const elevationResult = await elevateAkhilToAdmin();
      setResult(elevationResult);
      setStatus('success');
      
      // Refresh permissions after elevation
      setTimeout(async () => {
        const newPermissions = await checkUserPermissions();
        setPermissions(newPermissions);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error elevating role:', error);
      setStatus('error');
      setResult({ error: error.message });
      toast.error(`Failed to elevate role: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Critical Permission Fix - Elevate akhilvenugopal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fix all "Missing or insufficient permissions" errors by elevating akhilvenugopal to Admin role
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Permissions Check */}
          <div className="space-y-4">
            <h3 className="font-semibold">1. Check Current Permissions</h3>
            <Button 
              onClick={checkCurrentPermissions}
              disabled={status === 'checking'}
              className="w-full"
              variant="outline"
            >
              {status === 'checking' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              <Shield className="h-4 w-4 mr-2" />
              Check Current Permissions
            </Button>
          </div>

          {/* Elevation Action */}
          <div className="space-y-4">
            <h3 className="font-semibold">2. Elevate to Admin Role</h3>
            <Button 
              onClick={performElevation}
              disabled={status === 'elevating' || status === 'checking'}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {status === 'elevating' && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              <Crown className="h-4 w-4 mr-2" />
              Elevate akhilvenugopal to Admin
            </Button>
          </div>

          {/* Results Display */}
          {permissions && (
            <div className="space-y-4">
              <h3 className="font-semibold">Current Permissions</h3>
              <div className={`p-4 rounded-lg border ${
                permissions.role === 'admin' ? 'bg-green-50 border-green-200' : 
                permissions.role === 'viewer' ? 'bg-red-50 border-red-200' : 
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {permissions.role === 'admin' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : permissions.role === 'viewer' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium">Role: {permissions.role}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>✅ Can Create: {permissions.canCreate ? 'Yes' : 'No'}</div>
                  <div>✅ Can Read: {permissions.canRead ? 'Yes' : 'No'}</div>
                  <div>✅ Can Update: {permissions.canUpdate ? 'Yes' : 'No'}</div>
                  <div>✅ Can Delete: {permissions.canDelete ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Elevation Result */}
          {result && (
            <div className="space-y-4">
              <h3 className="font-semibold">Elevation Result</h3>
              <div className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="text-sm">
                  {result.success ? (
                    <div>
                      <p><strong>Previous Role:</strong> {result.previousRole}</p>
                      <p><strong>New Role:</strong> {result.newRole}</p>
                      <p><strong>User ID:</strong> {result.userId}</p>
                    </div>
                  ) : (
                    <p><strong>Error:</strong> {result.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>First check current permissions to see the issue</li>
              <li>Click "Elevate to Admin Role" to fix permission errors</li>
              <li>After elevation, all create operations should work</li>
              <li>Test by creating a lead or export order</li>
              <li>Verify role change in user management</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> This directly updates akhilvenugopal's role in Firestore to resolve all permission issues.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

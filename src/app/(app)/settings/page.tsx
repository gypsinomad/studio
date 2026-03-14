'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { makeAkhilSuperAdmin } from '@/firebase/firestore/make-akhil-superadmin';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleMakeAkhilSuperAdmin = async () => {
    setIsUpdating(true);
    try {
      const result = await makeAkhilSuperAdmin();
      if (result.success) {
        console.log('Success:', result);
        // Force page reload to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your CRM settings and preferences</p>
      </div>

      {/* Superadmin Promotion Tool */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Superadmin Promotion Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span>Administrative tool for promoting users to Superadmin role</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This tool will promote akhilvenugopal (akhilvenugopal@gmail.com) to Superadmin role.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <Crown className="h-3 w-3 mr-1" />
                Superadmin
              </Badge>
              <span className="text-sm text-muted-foreground">Full system access</span>
            </div>
          </div>

          <Button 
            onClick={handleMakeAkhilSuperAdmin}
            disabled={isUpdating}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isUpdating ? 'Promoting...' : 'Promote akhilvenugopal to Superadmin'}
          </Button>
        </CardContent>
      </Card>

      {/* Other Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage user roles, permissions, and access controls
            </p>
            <Button variant="outline" className="mt-2" size="sm">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure organization details and preferences
            </p>
            <Button variant="outline" className="mt-2" size="sm">
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

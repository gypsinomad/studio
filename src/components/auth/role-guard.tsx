'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface RoleGuardProps {
    allowedRoles: UserRole[];
    children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const { role, isLoading, isAuthenticated } = useCurrentUser();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // This is a fallback; the main AuthGuard in the layout should handle this.
        router.replace('/login');
        return (
             <div className="flex min-h-[50vh] items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (role && !allowedRoles.includes(role)) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Card className="w-[380px] text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            You do not have permission to view this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button onClick={() => router.push('/dashboard')}>
                         Return to Dashboard
                       </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If role is loaded and is one of the allowed roles, render children
    if (isAuthenticated && role) {
        return <>{children}</>;
    }

    // Fallback for the brief moment role might be null but user is authenticated
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

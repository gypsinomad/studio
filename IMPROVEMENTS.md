# SpiceRoute CRM - Performance & Responsiveness Improvements

## Executive Summary
This document outlines critical improvements to make your SpiceRoute CRM more responsive, performant, and robust.

## 1. Authentication & Network Error Fixes

### Current Issues:
- `auth/network-request-failed` errors during login
- Potential form submission interrupting Firebase requests
- Missing proper error handling

### Solutions:

#### A. Fix Login Form (src/app/login/page.tsx)
```typescript
// Add event.preventDefault() to prevent form submission
const handleLogin = async (event: React.FormEvent) => {
  event.preventDefault(); // CRITICAL: Prevent form reload
  
  if (!auth) {
    setIsSubmitting(false);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: "Unable to initialize authentication. Please refresh the page.",
    });
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Ensure we're passing string values, not refs
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(), // trim whitespace
      password
    );
    
    // Log successful login
    await logActivity({
      type: 'user_login',
      userId: credential.user.uid,
      description: 'User logged in successfully',
    });
    
    router.push('/dashboard');
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Better error messages
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address format',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/network-request-failed': 'Network error. Please check your connection and try again',
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

// Update form element
<form onSubmit={handleLogin} className="space-y-4">
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    disabled={isSubmitting}
  />
  <Input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    disabled={isSubmitting}
  />
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Signing in...' : 'Sign In'}
  </Button>
</form>
```

## 2. Performance & Responsiveness Improvements

### A. Add Loading States & Skeletons

Create `src/components/ui/skeleton.tsx`:
```typescript
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

Create `src/components/ui/dashboard-skeleton.tsx`:
```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-3 w-[120px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

### B. Optimize Dashboard Data Fetching

Update `src/app/(app)/dashboard/page.tsx`:
```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(defaultStats);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [leads, companies, exportOrders] = await Promise.all([
          fetchLeads(),
          fetchCompanies(),
          fetchExportOrders()
        ]);
        
        if (mounted) {
          setData({
            totalLeads: leads.length,
            activeLeads: leads.filter(l => l.status === 'active').length,
            // ... calculate other stats
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        if (mounted) setLoading(false);
      }
    }
    
    fetchData();
    return () => { mounted = false; };
  }, []);
  
  if (loading) return <DashboardSkeleton />;
  
  return (
    // ... dashboard content
  );
}
```

## 3. AI Integration Optimization

### A. Make AI Non-Blocking

Update lead standardization to be async:
```typescript
// src/lib/ai/lead-standardization.ts
export async function standardizeLeadAsync(leadId: string, leadData: any) {
  try {
    // Update lead with 'processing' status
    await updateDoc(doc(db, 'leads', leadId), {
      aiStandardization: {
        status: 'processing',
        startedAt: new Date().toISOString()
      }
    });
    
    // Run AI standardization
    const result = await callGeminiAPI(leadData);
    
    // Update with results
    await updateDoc(doc(db, 'leads', leadId), {
      ...result.standardizedData,
      aiStandardization: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        confidence: result.confidence
      }
    });
  } catch (error) {
    console.error('AI standardization error:', error);
    await updateDoc(doc(db, 'leads', leadId), {
      aiStandardization: {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      }
    });
  }
}
```

### B. Add AI Budget Checks

Update `src/lib/ai/usage-tracking.ts`:
```typescript
export async function canUseAI(): Promise<{ allowed: boolean; reason?: string }> {
  const settings = await getAISettings();
  
  if (settings.mode === 'off') {
    return { allowed: false, reason: 'AI is currently disabled' };
  }
  
  const usage = await getCurrentUsage();
  
  if (settings.dailyBudget && usage.todayTokens >= settings.dailyBudget) {
    return { allowed: false, reason: 'Daily AI budget exceeded' };
  }
  
  if (settings.monthlyBudget && usage.monthTokens >= settings.monthlyBudget) {
    return { allowed: false, reason: 'Monthly AI budget exceeded' };
  }
  
  return { allowed: true };
}
```

## 4. Code Splitting & Dynamic Imports

Update heavy components to load dynamically:
```typescript
// src/app/(app)/dashboard/page.tsx
import dynamic from 'next/dynamic';

// Lazy load charts
const OrdersByStageChart = dynamic(
  () => import('@/app/(app)/dashboard/components/orders-by-stage-chart'),
  { 
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false 
  }
);

const LeadSourceChart = dynamic(
  () => import('@/app/(app)/dashboard/components/lead-source-chart'),
  { 
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false 
  }
);
```

## 5. Error Boundary Implementation

Create `src/components/error-boundary.tsx`:
```typescript
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 6. Implementation Priority

1. **Critical (Do First):**
   - Fix login form preventDefault
   - Add error messages for auth
   - Add loading states to buttons

2. **High Priority:**
   - Add dashboard skeleton
   - Optimize data fetching (Promise.all)
   - Make AI async

3. **Medium Priority:**
   - Add dynamic imports for charts
   - Implement error boundaries
   - Add AI budget checks UI

4. **Nice to Have:**
   - Add optimistic updates
   - Implement caching
   - Add service worker for offline support

## 7. Quick Wins

```bash
# Install missing dependencies
npm install @tanstack/react-query

# Add these to your package.json scripts
"scripts": {
  "analyze": "ANALYZE=true next build",
  "lint:fix": "next lint --fix"
}
```

## Next Steps

1. Create a new branch: `git checkout -b improvements/responsiveness`
2. Implement changes in priority order
3. Test each change thoroughly
4. Deploy to staging first
5. Monitor performance metrics

---

**Created:** February 13, 2026
**Author:** Performance Audit
**Version:** 1.0

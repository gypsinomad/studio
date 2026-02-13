# 🚀 SpiceRoute CRM Performance Optimization - Implementation Prompt

## Context
I have a Next.js 14+ CRM application (SpiceRoute CRM) built with:
- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Firebase (Firestore, Authentication, Cloud Functions)
- **AI:** Gemini API for lead standardization and export order validation
- **Current Issues:** Slow loading, auth errors, blocking AI operations, no loading states

## Your Task
Help me implement these performance improvements in priority order. For each improvement, provide:
1. Complete, production-ready code with proper TypeScript types
2. Explanation of what the code does and why it improves performance
3. Any dependencies or setup required
4. Testing recommendations

---

## 🔴 PRIORITY 1: Fix Authentication Issues (CRITICAL)

### Problem
Users experiencing `auth/network-request-failed` errors during login. The form submission reloads the page before Firebase Auth completes.

### What I Need
Update `src/app/login/page.tsx` to:
1. Add `event.preventDefault()` to prevent form reload
2. Add proper loading state with disabled inputs during submission
3. Implement user-friendly error messages for all Firebase Auth error codes
4. Add email trimming and validation
5. Ensure the form uses controlled inputs (value/onChange)

### Current Structure
The login page has:
- `useState` for email, password, and isSubmitting
- `handleLogin` function that calls `signInWithEmailAndPassword`
- Toast notifications for errors
- Activity logging after successful login

---

## 🟡 PRIORITY 2: Add Loading States & Skeletons

### Problem
Users see blank white screens while data loads, making the app feel slow and broken.

### What I Need
1. **Create `src/components/ui/skeleton.tsx`:**
   - Reusable skeleton component with pulse animation
   - Use Tailwind's `animate-pulse` and `bg-muted`
   - Support custom className for sizing

2. **Create `src/components/ui/dashboard-skeleton.tsx`:**
   - Skeleton for the dashboard page matching the real layout
   - Show 4 stat cards (grid: md:grid-cols-2 lg:grid-cols-4)
   - Show chart placeholder below cards
   - Use the skeleton component from step 1

3. **Create `src/components/ui/table-skeleton.tsx`:**
   - Skeleton for data tables (leads, export orders, etc.)
   - Show header row and 5-10 skeleton rows
   - Match the table structure with proper column widths

### Design Requirements
- Use shadcn/ui Card components where applicable
- Match the spacing and layout of actual components
- Ensure smooth transition when real data loads

---

## 🟢 PRIORITY 3: Optimize Dashboard Data Fetching

### Problem
Dashboard loads data sequentially (leads → companies → export orders), taking 3+ seconds.

### What I Need
Update `src/app/(app)/dashboard/page.tsx` to:
1. Use `Promise.all()` to fetch leads, companies, and export orders in parallel
2. Add loading state that shows `DashboardSkeleton` while fetching
3. Implement cleanup to prevent state updates on unmounted components
4. Add error handling with user-friendly error display
5. Calculate stats from fetched data:
   - Total leads, active leads, conversion rate
   - Recent activities, pending export orders
   - Revenue metrics

### Current Data Fetching Functions
I have these helper functions available:
- `fetchLeads()` - returns Lead[]
- `fetchCompanies()` - returns Company[]
- `fetchExportOrders()` - returns ExportOrder[]
- `fetchActivities()` - returns Activity[]

---

## 🔵 PRIORITY 4: Make AI Operations Non-Blocking

### Problem
AI standardization blocks the UI. When a user saves a lead, they wait 5-10 seconds for AI to finish.

### What I Need
1. **Update `src/lib/ai/lead-standardization.ts`:**
   - Create `standardizeLeadAsync()` function
   - Save lead immediately with `aiStandardization.status: 'processing'`
   - Run AI in background, update status to 'completed' or 'failed'
   - Store AI result timestamps and confidence scores

2. **Update Lead Form UI:**
   - Show "AI processing..." badge when status is 'processing'
   - Show success/error state when complete
   - Allow user to navigate away while AI runs
   - Add refresh button to check status

3. **Add AI Budget Check Function:**
   - Create `canUseAI()` in `src/lib/ai/usage-tracking.ts`
   - Check if AI mode is enabled
   - Check if daily/monthly token budget is exceeded
   - Return `{ allowed: boolean, reason?: string }`

### AI Settings Structure
```typescript
interface AISettings {
  mode: 'off' | 'auto' | 'manual';
  dailyBudget?: number;  // tokens
  monthlyBudget?: number; // tokens
}
```

---

## 🟣 PRIORITY 5: Implement Code Splitting for Charts

### Problem
Dashboard loads large chart libraries (recharts) on initial load, slowing down the app.

### What I Need
Update `src/app/(app)/dashboard/page.tsx` to:
1. Use `next/dynamic` to lazy-load chart components
2. Show skeleton while chart loads
3. Disable SSR for charts (`ssr: false`)
4. Apply to these components:
   - `OrdersByStageChart`
   - `LeadSourceChart`
   - `RevenueChart`
   - `MonthlyTrendsChart`

### Chart Component Paths
- `@/app/(app)/dashboard/components/orders-by-stage-chart`
- `@/app/(app)/dashboard/components/lead-source-chart`
- Similar pattern for others

---

## 🟠 PRIORITY 6: Add Error Boundary

### Problem
Unhandled errors show a blank white screen with no recovery option.

### What I Need
1. **Create `src/components/error-boundary.tsx`:**
   - React class component with error boundary
   - Catch errors with `componentDidCatch`
   - Show user-friendly error UI with:
     - Error message
     - "Reload Page" button
     - Optional "Report Error" button
   - Log errors to console

2. **Wrap app layout:**
   - Update `src/app/layout.tsx` to wrap children with ErrorBoundary
   - Ensure it doesn't break Server Components

### Error UI Requirements
- Center on screen
- Show error message from `error.message`
- Styled with Tailwind and shadcn/ui Button
- Responsive design

---

## 📋 Implementation Checklist

For each priority, provide:
- [ ] Complete file content with all imports
- [ ] TypeScript interfaces/types
- [ ] Inline comments explaining key logic
- [ ] Error handling
- [ ] Loading states where applicable

## 🎯 Success Criteria

After implementation:
1. **Auth:** No more network-request-failed errors, clear error messages
2. **Loading:** Users see skeletons instead of blank screens
3. **Dashboard:** Loads in <1.5s (vs current 3s)
4. **AI:** Users can continue working while AI processes
5. **Charts:** Dashboard initial load is faster, charts load progressively
6. **Errors:** App never shows blank screen, always shows recovery option

## 🔧 Code Style Requirements

- Use TypeScript with strict mode
- Follow Next.js 14+ App Router conventions
- Use `'use client'` directive where needed
- Prefer functional components with hooks
- Use Tailwind CSS for styling
- Follow shadcn/ui patterns for components
- Add JSDoc comments for complex functions
- Handle edge cases (empty states, errors, loading)

## 📦 Available Dependencies

```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "firebase": "10.x",
  "@google/generative-ai": "latest",
  "tailwindcss": "3.x",
  "@radix-ui/react-*": "latest",
  "recharts": "latest"
}
```

---

## 🚦 How to Help Me

**Start with Priority 1** and ask me:
1. "Show me your current `src/app/login/page.tsx` file"
2. Then provide the improved version with detailed explanations
3. After I confirm it works, move to Priority 2
4. Continue through all priorities in order

**For each improvement:**
- Provide complete file contents (not just snippets)
- Explain the performance impact
- Mention any gotchas or edge cases
- Suggest how to test the improvement

**Ready to start?** 
Let's begin with Priority 1: Fixing the authentication issues. Show me the improved login page code.

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/data';

export function AppHeader() {
  // In a real app, this would come from an auth context/hook
  const user: User | undefined = MOCK_USERS.find(u => u.role === 'admin');

  if (!user) {
    // Handle case where user is not found, maybe redirect to login
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="hidden text-xl font-semibold font-headline md:block">
        SpiceRoute CRM
      </h1>
      <div className="ml-auto">
        <UserNav user={user} />
      </div>
    </header>
  );
}

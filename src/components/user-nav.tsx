'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface UserNavProps {
  user: User;
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  };
  
  const getInitials = (name?: string | null) => {
    if (!name?.trim()) {
      return '??'; // Return a fallback if name is null, undefined, or whitespace
    }
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return (names[0] || '').substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
             <p className="text-xs leading-none text-muted-foreground capitalize pt-1 font-semibold">
              Role: {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

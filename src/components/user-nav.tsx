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
    if (!name?.trim()) return '??';
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return (names[0] || '').substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">
            <Avatar className="w-8 h-8 rounded-full ring-2 ring-spice-100">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
             <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-stone-900">{user.displayName}</p>
                <p className="text-xs text-stone-500 capitalize">{user.role}</p>
            </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

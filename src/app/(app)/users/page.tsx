'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleGuard } from '@/components/auth/role-guard';

function UsersTable({ data }: { data: User[] }) {
   if (data.length === 0) {
    return <p className="text-muted-foreground">No users found in the system.</p>;
  }
  
  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.authUid}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                            <AvatarFallback>{user.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                            <p>{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>
                  <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
              </TableCell>
              <TableCell>{format(toDate(user.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


function UsersPageContent() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <>
      <PageHeader
        title="User Management"
        description="View and manage user roles and access."
      >
        <Button>
          <PlusCircle className="mr-2" />
          Invite User
        </Button>
      </PageHeader>
      
      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && users && <UsersTable data={users} />}
    </>
  );
}

export default function UsersPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <UsersPageContent />
        </RoleGuard>
    )
}

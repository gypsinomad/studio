'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Contact } from '@/lib/types';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';


interface ContactsTableProps {
  data: Contact[];
  onDelete: (contactId: string) => void;
}

export function ContactsTable({ data, onDelete }: ContactsTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No contacts found.</p>;
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone / WhatsApp</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{`${contact.firstName} ${contact.lastName}`}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.whatsappNumber || contact.phone || 'N/A'}</TableCell>
              <TableCell>{contact.jobTitle || 'N/A'}</TableCell>
              <TableCell>{format(toDate(contact.createdAt), 'PP')}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => onDelete(contact.id!)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

    
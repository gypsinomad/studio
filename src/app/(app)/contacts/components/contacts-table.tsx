'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Contact } from '@/lib/types';
import { format } from 'date-fns';

interface ContactsTableProps {
  data: Contact[];
}

export function ContactsTable({ data }: ContactsTableProps) {
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
            <TableHead>Phone</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{`${contact.firstName} ${contact.lastName}`}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.phone || 'N/A'}</TableCell>
              <TableCell>{contact.jobTitle || 'N/A'}</TableCell>
              <TableCell>{format(toDate(contact.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

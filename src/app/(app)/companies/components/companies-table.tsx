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
import type { Company } from '@/lib/types';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


interface CompaniesTableProps {
  data: Company[];
  onDelete: (companyId: string) => void;
  onEdit: (companyId: string) => void;
}

export function CompaniesTable({ data, onDelete, onEdit }: CompaniesTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No customer companies found.</p>;
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
            <TableHead>Customer Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added On</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">
                <Link href={`/companies/${company.id}`} className="hover:underline text-primary">
                    {company.name}
                </Link>
              </TableCell>
              <TableCell>{company.country}</TableCell>
              <TableCell>{company.industryType || 'N/A'}</TableCell>
               <TableCell>
                    {company.relationshipStatus ? <Badge variant="outline">{company.relationshipStatus}</Badge> : 'N/A'}
                </TableCell>
              <TableCell>{format(toDate(company.createdAt), 'PP')}</TableCell>
               <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(company.id!)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => onDelete(company.id!)}
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

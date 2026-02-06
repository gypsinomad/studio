'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Company } from '@/lib/types';
import { format } from 'date-fns';

interface CompaniesTableProps {
  data: Company[];
}

export function CompaniesTable({ data }: CompaniesTableProps) {
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
            <TableHead>Company Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Added On</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.country}</TableCell>
              <TableCell>
                {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {company.website}
                    </a>
                ) : 'N/A'}
              </TableCell>
              <TableCell>{format(toDate(company.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
